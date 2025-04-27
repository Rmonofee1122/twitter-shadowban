import { z } from "@hono/zod-openapi";

export const XClientTransactionIdQuerySchema = z.object({
  method: z.string().openapi({
    description: "X Client Transaction ID",
    example: "GET",
  }),
  path: z.string().openapi({
    description: "X Client Transaction ID",
    example: "/graphql/AIdc203rPpK_k_2KWSdm7g/SearchTimeline",
  }),
});

export const XClientTransactionIdResponseSchema = z.object({
  "x-client-transaction-id": z.string().openapi({
    description: "X Client Transaction ID",
  }),
});

export const TestQuerySchema = z.object({
  screen_name: z
    .string()
    .min(1, "1文字以上にしてください")
    .max(15, "15文字以下にしてください")
    .regex(/^[a-zA-Z0-9_]+$/, "正しい形式にしてください")
    .openapi({
      example: "X",
      description: "ユーザー名",
    }),
});

export const ResultsSchema = z
  .object({
    not_found: z.boolean().openapi({
      example: false,
    }),
    suspend: z.boolean().openapi({
      example: false,
    }),
    protect: z.boolean().openapi({
      example: false,
    }),
    no_tweet: z.boolean().openapi({
      example: false,
    }),
    search_ban: z.boolean().openapi({
      example: false,
    }),
    search_suggestion_ban: z.boolean().openapi({
      example: false,
    }),
    no_reply: z.boolean().openapi({
      example: false,
    }),
    ghost_ban: z.boolean().openapi({
      example: false,
    }),
    reply_deboosting: z.boolean().openapi({
      example: false,
    }),
    user: z.any().openapi({
      example: {
        __typename: "User",
        id: "VXNlcjo3ODMyMTQ=",
        rest_id: "783214",
        affiliates_highlighted_label: {},
        has_graduated_access: true,
        is_blue_verified: true,
        profile_image_shape: "Square",
        legacy: {
          can_dm: false,
          can_media_tag: true,
          created_at: "Tue Feb 20 14:35:54 +0000 2007",
          default_profile: false,
          default_profile_image: false,
          description: "what's happening?!",
          entities: {
            description: {
              urls: [],
            },
            url: {
              urls: [
                {
                  display_url: "about.x.com",
                  expanded_url: "https://about.x.com/",
                  url: "https://t.co/bGcvaMApJO",
                  indices: [0, 23],
                },
              ],
            },
          },
          fast_followers_count: 0,
          favourites_count: 5899,
          followers_count: 67587924,
          friends_count: 0,
          has_custom_timelines: true,
          is_translator: false,
          listed_count: 88718,
          location: "everywhere",
          media_count: 2417,
          name: "X",
          normal_followers_count: 67587924,
          pinned_tweet_ids_str: [],
          possibly_sensitive: false,
          profile_banner_url:
            "https://pbs.twimg.com/profile_banners/783214/1690175171",
          profile_image_url_https:
            "https://pbs.twimg.com/profile_images/1683899100922511378/5lY42eHs_normal.jpg",
          profile_interstitial_type: "",
          screen_name: "X",
          statuses_count: 15192,
          translator_type: "regular",
          url: "https://t.co/bGcvaMApJO",
          verified: false,
          verified_type: "Business",
          want_retweets: false,
          withheld_in_countries: [],
        },
        smart_blocked_by: false,
        smart_blocking: false,
        legacy_extended_profile: {},
        is_profile_translatable: false,
        has_hidden_likes_on_profile: false,
        has_hidden_subscriptions_on_profile: false,
        verification_info: {
          is_identity_verified: false,
          reason: {
            description: {
              text: "This account is verified because it's an official organization on X. Learn more",
              entities: [
                {
                  from_index: 69,
                  to_index: 79,
                  ref: {
                    url: "https://help.twitter.com/en/rules-and-policies/profile-labels",
                    url_type: "ExternalUrl",
                  },
                },
              ],
            },
            verified_since_msec: "1362700632470",
          },
        },
        highlights_info: {
          can_highlight_tweets: true,
          highlighted_tweets: "3",
        },
        user_seed_tweet_count: 0,
        business_account: {
          affiliates_count: 100,
        },
        creator_subscriptions_count: 0,
      },
    }),
  })
  .openapi("Results");
