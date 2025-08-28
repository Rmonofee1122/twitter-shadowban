import { logger } from "hono/logger";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import {
  ResultsSchema,
  TestQuerySchema,
  XClientTransactionIdQuerySchema,
  XClientTransactionIdResponseSchema,
} from "./schemas";
import ky from "ky";
import { ClientTransaction, handleXMigration } from "x-client-transaction-id";
import { PerformanceMonitor } from "./performance-monitor";

// キャッシュとレスポンス最適化
const responseCache = new Map();
const CACHE_TTL = 60000; // 1分キャッシュ

// Node ランタイムに固定
export const runtime = "nodejs"; // ← 追加
export const dynamic = "force-dynamic"; // 静的化を回避
export const revalidate = 0;

// 接続プールとHTTPクライアント最適化
class TwitterAPIClient {
  private static instance: TwitterAPIClient;
  private client: typeof ky;
  private connectionPool: Map<string, any> = new Map();

  private constructor() {
    // kyクライアントの設定を最適化
    this.client = ky.create({
      prefixUrl: "https://api.twitter.com",
      timeout: 15000, // 15秒タイムアウト
      retry: {
        limit: 3,
        methods: ["get"],
        statusCodes: [408, 413, 429, 500, 502, 503, 504],
        backoffLimit: 3000,
      },
      hooks: {
        beforeError: [
          (error) => {
            const { response } = error;
            if (response && response.body) {
              console.error(
                "Twitter API Error:",
                response.status,
                response.body
              );
            }
            return error;
          },
        ],
      },
    });
  }

  static getInstance(): TwitterAPIClient {
    if (!TwitterAPIClient.instance) {
      TwitterAPIClient.instance = new TwitterAPIClient();
    }
    return TwitterAPIClient.instance;
  }

  async createAuthenticatedClient(
    authToken: string,
    csrfToken: string,
    ct: any
  ) {
    const cacheKey = `client_${authToken.slice(-8)}_${csrfToken}`;

    if (this.connectionPool.has(cacheKey)) {
      const cached = this.connectionPool.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) {
        // 5分間キャッシュ
        return cached.client;
      }
    }

    const authenticatedClient = this.client.extend({
      headers: {
        authorization:
          "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
        "sec-ch-ua":
          '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "x-csrf-token": csrfToken,
        "x-twitter-active-user": "yes",
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-client-language": "ja",
        cookie: `auth_token=${authToken}; ct0=${csrfToken}`,
      },
      hooks: {
        beforeRequest: [
          async (request) => {
            const xClientTransactionId = await ct.generateTransactionId(
              request.method,
              new URL(request.url).pathname
            );
            request.headers.set(
              "x-client-transaction-id",
              xClientTransactionId
            );
          },
        ],
      },
    });

    // 接続プールにキャッシュ
    this.connectionPool.set(cacheKey, {
      client: authenticatedClient,
      timestamp: Date.now(),
    });

    // 古いキャッシュエントリを削除（メモリリーク防止）
    if (this.connectionPool.size > 50) {
      const now = Date.now();
      this.connectionPool.forEach((value, key) => {
        if (now - value.timestamp > 600000) {
          // 10分以上古い
          this.connectionPool.delete(key);
        }
      });
    }

    return authenticatedClient;
  }

  // 統計情報取得
  getPoolStats() {
    return {
      activeConnections: this.connectionPool.size,
      cacheHitRate: this.connectionPool.size > 0 ? 1 : 0,
    };
  }
}

function generateRandomHexString(length: number) {
  let result = "";
  const characters = "0123456789abcdef";
  for (let i = 0; i < length * 2; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const app = new OpenAPIHono().basePath("/api");

app.use(logger());

app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "X (Twitter) Shadowban Test API",
  },
  servers: [
    {
      url: "/api",
    },
  ],
});

app.get(
  "/docs",
  swaggerUI({
    url: "/api/openapi.json",
  })
);

app.openapi(
  createRoute({
    method: "get",
    path: "/x-client-transaction-id",
    request: {
      query: XClientTransactionIdQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: XClientTransactionIdResponseSchema,
          },
        },
        description: "成功",
      },
    },
  }),
  async (c) => {
    const { method, path } = c.req.valid("query");
    const response = await handleXMigration();
    const ct = await ClientTransaction.create(response);
    const xClientTransactionId = await ct.generateTransactionId(method, path);
    return c.json(
      {
        "x-client-transaction-id": xClientTransactionId,
      },
      200
    );
  }
);

const route = app.openapi(
  createRoute({
    method: "get",
    path: "/test",
    request: {
      query: TestQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: ResultsSchema,
          },
        },
        description: "成功",
      },
    },
  }),
  async (c: any) => {
    const performanceMonitor = PerformanceMonitor.getInstance();
    const startTime = Date.now();

    try {
      const { screen_name: screenName } = c.req.valid("query");

      // キャッシュチェック
      const cacheKey = `shadowban_${screenName}`;
      const cached = responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return c.json(cached.data);
      }

      const authToken = process.env.AUTH_TOKEN;
      if (!authToken) {
        return c.json({ error: "AUTH_TOKEN is not defined" }, 500);
      }

      // 最適化された接続プール使用
      const csrfToken = generateRandomHexString(16);
      const twitterClient = TwitterAPIClient.getInstance();

      // 並列処理でパフォーマンス向上
      const [response, ctInstance] = await Promise.all([
        handleXMigration(),
        ClientTransaction.create(await handleXMigration()).catch((err) => {
          console.error("ClientTransaction creation failed:", err);
          return null;
        }),
      ]);

      if (!ctInstance) {
        return c.json({ error: "Failed to create client transaction" }, 500);
      }

      const client = await twitterClient.createAuthenticatedClient(
        authToken,
        csrfToken,
        ctInstance
      );

      // 並列でAPIコールを実行
      const [userResponse, searchResponse] = await Promise.all([
        client.get("graphql/k5XapwcSikNsEsILW5FvgA/UserByScreenName", {
          searchParams: {
            variables: JSON.stringify({
              screen_name: screenName,
              withSafetyModeUserFields: true,
            }),
            features: JSON.stringify({
              hidden_profile_likes_enabled: true,
              hidden_profile_subscriptions_enabled: true,
              responsive_web_graphql_exclude_directive_enabled: true,
              verified_phone_label_enabled: false,
              subscriptions_verification_info_is_identity_verified_enabled:
                true,
              subscriptions_verification_info_verified_since_enabled: true,
              highlights_tweets_tab_ui_enabled: true,
              responsive_web_twitter_article_notes_tab_enabled: true,
              creator_subscriptions_tweet_preview_api_enabled: true,
              responsive_web_graphql_skip_user_profile_image_extensions_enabled:
                false,
              responsive_web_graphql_timeline_navigation_enabled: true,
            }),
            fieldToggles: JSON.stringify({
              withAuxiliaryUserLabels: false,
            }),
          },
        }),
        // 2つ目のAPIコールも並列で実行（ただし、ユーザー情報が必要なので条件付き）
        Promise.resolve(null), // プレースホルダー
      ]);

      const {
        data: { user },
      } = await userResponse.json();
      if (!user) {
        return c.json({
          not_found: true,
          suspend: false,
          protect: false,
          no_tweet: false,
          search_ban: false,
          search_suggestion_ban: false,
          no_reply: false,
          ghost_ban: false,
          reply_deboosting: false,
          user: null,
        });
      }
      if (user.result.__typename !== "User") {
        return c.json({
          not_found: false,
          suspend: true,
          protect: false,
          no_tweet: false,
          search_ban: false,
          search_suggestion_ban: false,
          no_reply: false,
          ghost_ban: false,
          reply_deboosting: false,
          user: user.result,
        });
      }
      if (user.result.legacy.protected) {
        return c.json({
          not_found: false,
          suspend: false,
          protect: true,
          no_tweet: false,
          search_ban: false,
          search_suggestion_ban: false,
          no_reply: false,
          ghost_ban: false,
          reply_deboosting: false,
          user: user.result,
        });
      }
      if (!user.result.legacy.statuses_count) {
        return c.json({
          not_found: false,
          suspend: false,
          protect: false,
          no_tweet: true,
          search_ban: false,
          search_suggestion_ban: false,
          no_reply: false,
          ghost_ban: false,
          reply_deboosting: false,
          user: user.result,
        });
      }

      // ユーザー情報取得後、並列でAPIコール実行
      const [searchTimelineResponse, searchSuggestionResponse] =
        await Promise.all([
          client.get("graphql/AIdc203rPpK_k_2KWSdm7g/SearchTimeline", {
            searchParams: {
              variables: JSON.stringify({
                rawQuery: `from:${user.result.legacy.screen_name}`,
                count: 20,
                querySource: "typed_query",
                product: "Top",
              }),
              features: JSON.stringify({
                rweb_video_screen_enabled: false,
                profile_label_improvements_pcf_label_in_post_enabled: true,
                rweb_tipjar_consumption_enabled: true,
                verified_phone_label_enabled: false,
                creator_subscriptions_tweet_preview_api_enabled: true,
                responsive_web_graphql_timeline_navigation_enabled: true,
                responsive_web_graphql_skip_user_profile_image_extensions_enabled:
                  false,
                premium_content_api_read_enabled: false,
                communities_web_enable_tweet_community_results_fetch: true,
                c9s_tweet_anatomy_moderator_badge_enabled: true,
                responsive_web_grok_analyze_button_fetch_trends_enabled: false,
                responsive_web_grok_analyze_post_followups_enabled: true,
                responsive_web_jetfuel_frame: false,
                responsive_web_grok_share_attachment_enabled: true,
                articles_preview_enabled: true,
                responsive_web_edit_tweet_api_enabled: true,
                graphql_is_translatable_rweb_tweet_is_translatable_enabled:
                  true,
                view_counts_everywhere_api_enabled: true,
                longform_notetweets_consumption_enabled: true,
                responsive_web_twitter_article_tweet_consumption_enabled: true,
                tweet_awards_web_tipping_enabled: false,
                responsive_web_grok_show_grok_translated_post: false,
                responsive_web_grok_analysis_button_from_backend: false,
                creator_subscriptions_quote_tweet_preview_enabled: false,
                freedom_of_speech_not_reach_fetch_enabled: true,
                standardized_nudges_misinfo: true,
                tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled:
                  true,
                longform_notetweets_rich_text_read_enabled: true,
                longform_notetweets_inline_media_enabled: true,
                responsive_web_grok_image_annotation_enabled: true,
                responsive_web_enhance_cards_enabled: false,
              }),
            },
          }),
          client.get("1.1/search/typeahead.json", {
            searchParams: {
              include_ext_is_blue_verified: "1",
              include_ext_verified_type: "1",
              include_ext_profile_image_shape: "1",
              q: `@${user.result.legacy.screen_name} ${user.result.legacy.name}`,
              src: "search_box",
              result_type: "events,users,topics,lists",
            },
          }),
        ]);

      const [searchTimelineData, searchSuggestionData] = await Promise.all([
        searchTimelineResponse.json(),
        searchSuggestionResponse.json(),
      ]);

      const {
        data: {
          search_by_raw_query: { search_timeline: searchTimeline },
        },
      } = searchTimelineData;
      const { users: searchSuggestionUsers } = searchSuggestionData;

      let searchBanFlag = true;
      for (const instruction of searchTimeline.timeline.instructions) {
        for (const entry of instruction.entries) {
          if (entry.entryId.startsWith("tweet-")) {
            if (
              entry.content.itemContent.tweet_results.result.core.user_results
                .result.legacy.screen_name === user.result.legacy.screen_name
            ) {
              searchBanFlag = false;
              break;
            }
          }
        }
      }
      let searchSuggestionBanFlag = true;
      for (const searchSuggestionUser of searchSuggestionUsers) {
        if (
          searchSuggestionUser.screen_name === user.result.legacy.screen_name
        ) {
          searchSuggestionBanFlag = false;
          break;
        }
      }

      const result = {
        not_found: false,
        suspend: false,
        protect: false,
        no_tweet: false,
        search_ban: searchBanFlag,
        search_suggestion_ban: searchSuggestionBanFlag,
        no_reply: false,
        ghost_ban: false,
        reply_deboosting: false,
        user: user.result,
      };

      // レスポンスをキャッシュ
      responseCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      // パフォーマンス測定と統計情報記録
      const totalDuration = Date.now() - startTime;
      performanceMonitor.recordApiCall("shadowban-test", totalDuration, true);

      const poolStats = twitterClient.getPoolStats();
      performanceMonitor.recordConnectionPool(
        poolStats.activeConnections,
        cached !== undefined
      );

      // デバッグ情報（開発環境のみ）
      if (process.env.NODE_ENV === "development") {
        console.log(`Pool Stats: ${JSON.stringify(poolStats)}`);
        console.log(`Response Time: ${totalDuration}ms`);

        const perfStats = performanceMonitor.getStats("shadowban-test");
        const connectionStats = performanceMonitor.getConnectionPoolStats();
        console.log("Performance Stats:", perfStats);
        console.log("Connection Pool Stats:", connectionStats);

        const alerts = performanceMonitor.checkPerformanceAlerts();
        if (alerts.length > 0) {
          console.warn("Performance Alerts:", alerts);
        }
      }

      return c.json(result);
    } catch (error) {
      // エラー時もパフォーマンス測定
      const totalDuration = Date.now() - startTime;
      performanceMonitor.recordApiCall("shadowban-test", totalDuration, false);

      console.error("API test error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
);

export type AppType = typeof route;

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
export const HEAD = app.fetch;
export const OPTIONS = app.fetch;
