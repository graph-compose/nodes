import { createDocument } from "zod-openapi";
import {
  ApiErrorResponseSchema,
  HTTP_STATUS,
} from "../../../types/api-response";
import {
  RedditSearchRequestSchema,
  RedditSearchResponseSchema,
} from "./schemas/redditSchemas";

export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "Reddit Search API",
      version: "1.0.0",
      description:
        "Search Reddit posts by query, subreddit, sort, and time filter using snoowrap.",
    },
    externalDocs: {
      description: "Reddit API docs",
      url: "https://www.reddit.com/dev/api/",
    },
    paths: {
      "/reddit/search": {
        post: {
          summary: "Search Reddit posts",
          description:
            "Search Reddit posts and return normalized post fields for workflows. Supports app-only auth by default and script-style auth when username/password are supplied. For hosted environments, script auth plus a unique non-placeholder userAgent is recommended to reduce Reddit network-policy blocks. If you use script auth, prefer a dedicated non-critical automation Reddit account (not your primary personal account).",
          tags: ["Reddit"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: RedditSearchRequestSchema,
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description: "Search results returned successfully.",
              content: {
                "application/json": {
                  schema: RedditSearchResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description: "Reddit search failed.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
          },
        },
      },
    },
  });

  return {
    ...document,
    meta: {
      tags: ["reddit", "social", "search", "community", "forum"],
      provider: "Reddit",
      category: "Social",
      imageUrl:
        "https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-57x57.png",
      sourceUrl: "https://www.reddit.com/dev/api/",
    },
  };
};
