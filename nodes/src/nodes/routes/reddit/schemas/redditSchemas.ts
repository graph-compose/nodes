import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../../../types/api-response";

export const RedditSearchSortSchema = z.enum([
  "relevance",
  "hot",
  "top",
  "new",
  "comments",
]);

export const RedditSearchTimeSchema = z.enum([
  "hour",
  "day",
  "week",
  "month",
  "year",
  "all",
]);

export const RedditSearchRequestSchema = z.object({
  clientId: z.string().openapi({
    description: "Reddit app client id from reddit app settings.",
  }),
  clientSecret: z.string().openapi({
    description: "Reddit app client secret from reddit app settings.",
  }),
  userAgent: z.string().openapi({
    description:
      "Unique and descriptive user-agent string, e.g. graph-compose:trend-radar:v1.0 (by /u/actual_reddit_username). Avoid placeholders.",
  }),
  username: z.string().optional().openapi({
    description:
      "Optional Reddit username for script-style auth. If provided, password must also be provided. Recommended: use a dedicated non-critical automation account rather than your primary personal account.",
  }),
  password: z.string().optional().openapi({
    description:
      "Optional Reddit password for script-style auth. If provided, username must also be provided. Store in secrets and pair with a dedicated low-risk automation account.",
  }),
  query: z.string().min(1).openapi({
    description: "Search query string.",
    example: "best async python frameworks",
  }),
  subreddit: z.string().default("all").openapi({
    description: "Subreddit to search in. Use 'all' for sitewide search.",
    example: "python",
  }),
  sort: RedditSearchSortSchema.default("relevance").openapi({
    description: "Search sort mode.",
  }),
  time: RedditSearchTimeSchema.default("week").openapi({
    description: "Time filter used by Reddit ranking.",
  }),
  limit: z.number().int().min(1).max(100).default(10).openapi({
    description: "Maximum number of posts to return.",
  }),
});

export const RedditPostDataSchema = z
  .object({
    id: z.string().openapi({ description: "Reddit post ID." }),
    title: z.string().openapi({ description: "Post title." }),
    selftext: z.string().openapi({ description: "Post text body." }),
    url: z.string().openapi({ description: "Post URL." }),
    permalink: z.string().openapi({ description: "Relative Reddit permalink." }),
    subreddit: z.string().openapi({ description: "Subreddit name." }),
    author: z.string().nullable().openapi({ description: "Post author username." }),
    score: z.number().int().openapi({ description: "Post score." }),
    numComments: z.number().int().openapi({ description: "Comment count." }),
    createdUtc: z.number().openapi({ description: "UTC creation timestamp." }),
    isSelf: z.boolean().openapi({ description: "Whether this is a self post." }),
    over18: z.boolean().openapi({ description: "Whether this post is NSFW." }),
    spoiler: z.boolean().openapi({ description: "Whether this post is spoiler." }),
  })
  .openapi({ description: "Normalized Reddit post payload." });

export const RedditSearchResponseSchema = SuccessResponseSchema(
  z.array(RedditPostDataSchema),
);

export type RedditSearchRequest = z.infer<typeof RedditSearchRequestSchema>;
export type RedditSearchPostData = z.infer<typeof RedditPostDataSchema>;
