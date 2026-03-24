import { createDocument } from "zod-openapi";
import "zod-openapi/extend";
// Use a type import for the error schema if it's only used for type annotation
import {
  ApiErrorResponseSchema,
  HTTP_STATUS,
} from "../../../types/api-response"; // Keep runtime import if needed elsewhere or for direct use
import {
  ScrapeRequestSchema,
  ScrapeResponseSchema,
} from "./schemas/firecrawlSchemas";

// Common Tags
const FIRECRAWL_TAGS = ["Firecrawl"];

// Create OpenAPI document for Firecrawl integration
export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "Firecrawl Web Scraping API",
      version: "1.0.0",
      description: `API for scraping web pages and extracting content using the Firecrawl service.

## Overview
This endpoint allows you to scrape a single URL, handle JavaScript rendering, and retrieve content in various formats (Markdown, HTML, etc.) along with page metadata.

## Authentication
Requires a Firecrawl API key provided in the \`apiKey\` field of the request body.`,
    },
    externalDocs: {
      description: "Firecrawl API Documentation",
      url: "https://docs.firecrawl.dev/api-reference/scrape-url", // More specific URL
    },
    paths: {
      "/firecrawl/scrape": {
        post: {
          summary: "Scrape Content from a URL",
          description: `Initiates a scraping job for a specified URL using Firecrawl.

**Workflow:**
1. Submit a \`POST\` request with the target \`url\` and your \`apiKey\`.
2. Optionally, provide \`params\` to customize the scrape (e.g., \`formats\`, \`pageOptions\`).
3. The service fetches and processes the page synchronously.
4. Successful response (\`200 OK\`) contains the extracted \`data\` (in requested formats) and \`metadata\`.
5. Errors (4xx/5xx) are returned for invalid requests, failed scrapes, or server issues.`,
          tags: FIRECRAWL_TAGS,
          requestBody: {
            required: true,
            description: "API key, target URL, and optional scrape parameters",
            content: { "application/json": { schema: ScrapeRequestSchema } },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description:
                "Scraping successful. Returns scraped content and metadata.",
              content: { "application/json": { schema: ScrapeResponseSchema } },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request parameters (e.g., malformed URL, invalid format requested).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description:
                "Authentication failed - Invalid or missing Firecrawl API key.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.NOT_FOUND)]: {
              description: "The target URL could not be found (404 error).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description:
                "Scraping failed for the URL (e.g., page load timeout, blocked by website, JavaScript error).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description:
                "Internal server error or issue communicating with the Firecrawl API.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            // Consider 429 Too Many Requests if applicable
          },
        },
      },
      // Removed /openapi.json endpoint as it should be handled globally
    },
    // Components automatically inferred
  });

  // Add custom metadata
  return {
    ...document,
    meta: {
      tags: [
        "web scraping",
        "content extraction",
        "data collection",
        "automation",
        "firecrawl",
      ],
      provider: "Firecrawl",
      category: "Data & APIs",
      imageUrl:
        "https://mintlify.s3.us-west-1.amazonaws.com/firecrawl/logo/light.svg", // Official Logo
      sourceUrl: "https://firecrawl.dev/",
      description: `Leverages the Firecrawl API to reliably scrape and convert any webpage into clean, LLM-ready data (Markdown, HTML, structured JSON). Handles JavaScript rendering, blocks, proxies, and provides metadata.

**Key Features:**
- Scrapes static and dynamic (JavaScript-heavy) websites.
- Converts content to Markdown, HTML, or extracts structured JSON.
- Captures screenshots (full page option available).
- Extracts page metadata (title, description, OpenGraph, etc.).
- Handles proxies and blocks automatically.

**Use Cases:**
- Building RAG (Retrieval-Augmented Generation) systems.
- Training AI models on web data.
- Market research and competitive analysis.
- Content monitoring and aggregation.`,
      features: [
        "Single URL Scraping",
        "JavaScript Rendering",
        "Multiple Output Formats (Markdown, HTML, JSON, Links, Screenshot)",
        "Metadata Extraction",
        "Handles Blocks & Proxies",
        "Page Interaction Options (e.g., wait for selector)",
        "Structured Data Extraction (via `json` format and params)",
      ],
      pricing: "Usage-based pricing with a free tier available.",
      documentation: "https://docs.firecrawl.dev/api-reference/introduction",
      support: "Via Discord or email listed on Firecrawl website",
    },
  };
};
