import { createDocument } from "zod-openapi";
import {
  ApiErrorResponseSchema,
  HTTP_STATUS,
} from "../../../types/api-response";
import {
  SerpApiSearchRequestSchema,
  SerpApiSearchResponseSchema,
} from "./schemas/serpapiSchemas";

export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "SerpAPI Search API",
      version: "1.0.0",
      description:
        "Search web engines (Google and more) through SerpAPI and return structured search results.",
    },
    externalDocs: {
      description: "SerpAPI documentation",
      url: "https://serpapi.com/search-api",
    },
    paths: {
      "/serpapi/search": {
        post: {
          summary: "Run a SerpAPI search",
          description:
            "Execute a search request via SerpAPI. Supports Google Search API core parameters, localization, advanced filters, pagination, recency helpers, and direct tbs overrides.",
          tags: ["SerpAPI"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: SerpApiSearchRequestSchema,
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description: "Search results returned successfully.",
              content: {
                "application/json": {
                  schema: SerpApiSearchResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description: "SerpAPI request failed.",
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
      tags: ["serpapi", "search", "google", "seo", "research"],
      provider: "SerpAPI",
      category: "Data & APIs",
      imageUrl: "https://serpapi.com/static/brand/serpapi-logo-black.svg",
      sourceUrl: "https://serpapi.com/",
    },
  };
};
