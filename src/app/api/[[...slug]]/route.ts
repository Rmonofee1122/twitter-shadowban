import { logger } from "hono/logger";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { ResultsSchema, TestQuerySchema } from "./schemas";
import ky from "ky";

function generateRandomHexString(length: number) {
  let result = "";
  const characters = "0123456789abcdef";
  for (let i = 0; i < length * 2; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export const runtime = "edge";

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
  }),
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
  async (c) => {
    const authToken = process.env.AUTH_TOKEN;
    if (!authToken) {
      throw new Error("AUTH_TOKEN is not defined");
    }
    const csrfToken = generateRandomHexString(16);
    const client = ky.create({
      prefixUrl: "https://api.twitter.com",
      headers: {
        Authorization:
          "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
        Cookie: `auth_token=${authToken}; ct0=${csrfToken}`,
        "X-Csrf-Token": csrfToken,
      },
    });
    const { screen_name: screenName } = c.req.valid("query");
    const { data: { user } } = await client.get(
      "graphql/k5XapwcSikNsEsILW5FvgA/UserByScreenName",
      {
        searchParams: {
          "variables": JSON.stringify({
            "screen_name": screenName,
            "withSafetyModeUserFields": true,
          }),
          "features": JSON.stringify({
            "hidden_profile_likes_enabled": true,
            "hidden_profile_subscriptions_enabled": true,
            "responsive_web_graphql_exclude_directive_enabled": true,
            "verified_phone_label_enabled": false,
            "subscriptions_verification_info_is_identity_verified_enabled":
              true,
            "subscriptions_verification_info_verified_since_enabled": true,
            "highlights_tweets_tab_ui_enabled": true,
            "responsive_web_twitter_article_notes_tab_enabled": true,
            "creator_subscriptions_tweet_preview_api_enabled": true,
            "responsive_web_graphql_skip_user_profile_image_extensions_enabled":
              false,
            "responsive_web_graphql_timeline_navigation_enabled": true,
          }),
          "fieldToggles": JSON.stringify({
            "withAuxiliaryUserLabels": false,
          }),
        },
      },
    ).json<any>();
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
    const {
      data: { search_by_raw_query: { search_timeline: searchTimeline } },
    } = await client.get(
      "graphql/3k6tjrexrMMfvGkBm7wDZg/SearchTimeline",
      {
        searchParams: {
          "variables": JSON.stringify({
            "rawQuery": `from:${user.result.legacy.screen_name}`,
            "count": 20,
            "querySource": "typed_query",
            "product": "Top",
          }),
          "features": JSON.stringify({
            "responsive_web_graphql_exclude_directive_enabled": true,
            "verified_phone_label_enabled": false,
            "creator_subscriptions_tweet_preview_api_enabled": true,
            "responsive_web_graphql_timeline_navigation_enabled": true,
            "responsive_web_graphql_skip_user_profile_image_extensions_enabled":
              false,
            "c9s_tweet_anatomy_moderator_badge_enabled": true,
            "tweetypie_unmention_optimization_enabled": true,
            "responsive_web_edit_tweet_api_enabled": true,
            "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
            "view_counts_everywhere_api_enabled": true,
            "longform_notetweets_consumption_enabled": true,
            "responsive_web_twitter_article_tweet_consumption_enabled": true,
            "tweet_awards_web_tipping_enabled": false,
            "freedom_of_speech_not_reach_fetch_enabled": true,
            "standardized_nudges_misinfo": true,
            "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled":
              true,
            "rweb_video_timestamps_enabled": true,
            "longform_notetweets_rich_text_read_enabled": true,
            "longform_notetweets_inline_media_enabled": true,
            "responsive_web_enhance_cards_enabled": false,
          }),
        },
      },
    ).json<any>();
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
    const { users: searchSuggestionUsers } = await client.get(
      "1.1/search/typeahead.json",
      {
        searchParams: {
          "include_ext_is_blue_verified": "1",
          "include_ext_verified_type": "1",
          "include_ext_profile_image_shape": "1",
          "q": `@${user.result.legacy.screen_name} ${user.result.legacy.name}`,
          "src": "search_box",
          "result_type": "events,users,topics,lists",
        },
      },
    ).json<any>();
    let searchSuggestionBanFlag = true;
    for (const searchSuggestionUser of searchSuggestionUsers) {
      if (searchSuggestionUser.screen_name === user.result.legacy.screen_name) {
        searchSuggestionBanFlag = false;
        break;
      }
    }
    return c.json({
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
    });
  },
);

export type AppType = typeof route;

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
export const HEAD = app.fetch;
export const OPTIONS = app.fetch;
