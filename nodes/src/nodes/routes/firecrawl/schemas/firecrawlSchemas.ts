import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../../../types/api-response"; // Corrected path

// Common OpenAPI tags for Firecrawl schemas
const FIRECRAWL_TAGS = ["Firecrawl"] as const;

// Define allowed output formats based on Firecrawl docs
const FirecrawlFormatEnum = z
  .enum([
    "markdown",
    "html",
    "rawHtml",
    "screenshot",
    "screenshot@fullPage",
    "links",
    "json", // For structured data extraction
  ])
  .openapi({
    description: "Desired output format for the scraped data",
    example: "markdown",
  });

// Schema for page interaction options (subset for basic scraping)
const PageOptionsSchema = z
  .object({
    waitForSelector: z.string().optional().openapi({
      description:
        "CSS selector to wait for before scraping (e.g., `#main-content`).",
      example: "#article-body",
    }),
    timeout: z
      .number()
      .int()
      .positive() // Timeout should be positive
      .optional()
      .openapi({
        description:
          "Timeout in milliseconds for page load (e.g., 5000 for 5s).",
        example: 10000,
      }),
    // Add other page options like headers, userAgent etc. if needed later
  })
  .optional()
  .openapi({
    description:
      "Options controlling page loading, rendering, and interaction.",
    "x-tags": FIRECRAWL_TAGS,
  });

// Schema for general scrape parameters
const ScrapeParamsSchema = z
  .object({
    formats: z
      .array(FirecrawlFormatEnum)
      .nonempty("At least one format must be specified.")
      .optional()
      .openapi({
        description:
          "Array of desired output formats (e.g., `markdown`, `html`, `screenshot`).",
        example: ["markdown", "screenshot"],
      }),
    pageOptions: PageOptionsSchema,
    // Add extractorOptions, screenshotOptions, jsonOptions, location etc. later as needed
  })
  .optional()
  .openapi({
    description:
      "Parameters controlling the scrape process and output formats.",
    "x-tags": FIRECRAWL_TAGS,
  });

// Main Scrape request schema
export const ScrapeRequestSchema = z
  .object({
    // Authentication
    apiKey: z.string().nonempty("API key is required.").openapi({
      description: "Your Firecrawl API key.",
      example: "fc_abcdef1234567890abcdef1234567890",
    }),

    // Target URL
    url: z.string().url("Invalid URL provided.").openapi({
      description: "The URL of the webpage to scrape.",
      example: "https://firecrawl.dev/blog/how-to-scrape-linkedin",
    }),

    // Scrape Parameters
    params: ScrapeParamsSchema,
  })
  .openapi({
    description: "Request body for scraping a single URL.",
    "x-tags": FIRECRAWL_TAGS,
  });

// Metadata schema (seems mostly consistent with docs)
export const MetadataSchema = z
  .object({
    title: z.string().optional().openapi({
      description: "Page title",
      example: "Scraping LinkedIn | Firecrawl Blog",
    }),
    description: z.string().optional().openapi({
      description: "Meta description",
      example: "Learn how to effectively scrape LinkedIn...",
    }),
    language: z.string().optional().openapi({
      description: "Detected language (e.g., `en`)",
      example: "en",
    }),
    keywords: z.string().optional().openapi({
      description: "Meta keywords (comma-separated string)",
      example: "linkedin, scraping, web data",
    }),
    robots: z.string().optional().openapi({
      description: "Robots meta tag content",
      example: "index, follow",
    }),
    ogTitle: z.string().optional().openapi({
      description: "OpenGraph title",
      example: "Scraping LinkedIn Effectively",
    }),
    ogDescription: z
      .string()
      .optional()
      .openapi({ description: "OpenGraph description" }),
    ogUrl: z
      .string()
      .url()
      .optional()
      .openapi({ description: "OpenGraph URL" }),
    ogImage: z
      .string()
      .url()
      .optional()
      .openapi({ description: "OpenGraph image URL" }),
    ogLocaleAlternate: z
      .array(z.string())
      .optional()
      .openapi({ description: "OpenGraph alternate locales" }),
    ogSiteName: z
      .string()
      .optional()
      .openapi({ description: "OpenGraph site name" }),
    sourceURL: z
      .string()
      .url()
      .openapi({ description: "The original URL scraped" }),
    statusCode: z
      .number()
      .int()
      .openapi({ description: "HTTP status code of the fetch", example: 200 }),
  })
  .passthrough() // Allow other metadata fields
  .openapi({
    description: "Metadata extracted from the scraped webpage.",
    "x-tags": FIRECRAWL_TAGS,
  });

// Scrape result data schema, including potential format fields
export const ScrapeResultDataSchema = z
  .object({
    markdown: z.string().optional().openapi({
      description: "Scraped content formatted as Markdown.",
      example: "# How to Scrape LinkedIn\n...",
    }),
    html: z.string().optional().openapi({
      description: "Scraped content as cleaned HTML.",
      example: "<h1>How to Scrape LinkedIn</h1><p>...</p>",
    }),
    rawHtml: z.string().optional().openapi({
      description: "Raw HTML source of the page.",
      example: "<!DOCTYPE html><html>...</html>",
    }),
    screenshot: z.string().url().optional().openapi({
      description: "URL to the captured screenshot image.",
      example: "https://storage.firecrawl.dev/screenshots/abc.png",
    }),
    links: z
      .array(z.string().url())
      .optional()
      .openapi({
        description: "List of absolute URLs found on the page.",
        example: ["https://firecrawl.dev/", "https://firecrawl.dev/pricing"],
      }),
    json: z
      .any()
      .optional()
      .openapi({
        description: "Structured data extracted via LLM (if requested).",
        example: { company_name: "Firecrawl", founded_year: 2023 },
      }),
    metadata: MetadataSchema,
  })
  .passthrough() // Allow potential future fields or variations
  .openapi({
    description:
      "Result containing requested data formats (markdown, html, etc.) and metadata.",
    "x-tags": FIRECRAWL_TAGS,
  });

// Standardized Scrape response schema
export const ScrapeResponseSchema = SuccessResponseSchema(
  ScrapeResultDataSchema,
).openapi({
  description: "Standard success response wrapping the scrape results.",
  "x-tags": FIRECRAWL_TAGS,
});

// --- Schemas for other potential features (Batch, Crawl) can be added below ---
