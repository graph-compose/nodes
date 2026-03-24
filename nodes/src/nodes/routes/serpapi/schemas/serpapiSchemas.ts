import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../../../types/api-response";

export const SerpApiEngineSchema = z.enum([
  "google",
  "google_news",
  "google_images",
  "google_videos",
  "google_scholar",
]);

export const SerpApiRecencySchema = z.enum([
  "hour",
  "day",
  "week",
  "month",
  "year",
]);

export const SerpApiSearchRequestSchema = z.object({
  apiKey: z.string().openapi({
    description: "Your SerpAPI key.",
    example: "your-serpapi-key",
  }),
  query: z.string().min(1).openapi({
    description: "Search query string.",
    example: "best running shoes for flat feet",
  }),
  engine: SerpApiEngineSchema.default("google").openapi({
    description: "SerpAPI search engine to use.",
  }),
  num: z.number().int().min(1).max(100).default(10).openapi({
    description: "Number of results to return.",
  }),
  gl: z.string().optional().openapi({
    description:
      "Geographic location country code (Google only), e.g. 'us', 'ca'.",
    example: "ca",
  }),
  hl: z.string().optional().openapi({
    description: "Language code, e.g. 'en'.",
    example: "en",
  }),
  location: z.string().optional().openapi({
    description: "Location string for localized search, e.g. 'Toronto,Ontario'.",
    example: "Toronto,Ontario,Canada",
  }),
  uule: z.string().optional().openapi({
    description: "Google encoded location value.",
  }),
  lat: z.number().optional().openapi({
    description: "GPS latitude for search origin.",
    example: 43.6532,
  }),
  lon: z.number().optional().openapi({
    description: "GPS longitude for search origin.",
    example: -79.3832,
  }),
  radius: z.number().int().positive().optional().openapi({
    description: "Search radius in meters.",
    example: 200,
  }),
  ludocid: z.string().optional().openapi({
    description: "Google local CID parameter.",
  }),
  lsig: z.string().optional().openapi({
    description: "Google lsig parameter.",
  }),
  kgmid: z.string().optional().openapi({
    description: "Google knowledge graph ID.",
  }),
  si: z.string().optional().openapi({
    description: "Google cached encrypted search parameter.",
  }),
  ibp: z.string().optional().openapi({
    description: "Google expansion/layout parameter.",
  }),
  uds: z.string().optional().openapi({
    description: "Google filter parameter string.",
  }),
  googleDomain: z.string().optional().openapi({
    description: "Google domain, e.g. google.com, google.ca.",
    example: "google.ca",
  }),
  safe: z.enum(["active", "off"]).optional().openapi({
    description: "SafeSearch mode.",
    example: "off",
  }),
  cr: z.string().optional().openapi({
    description:
      "Country restrict, e.g. countryFR or countryFR|countryDE.",
  }),
  lr: z.string().optional().openapi({
    description:
      "Language restrict, e.g. lang_en or lang_fr|lang_de.",
  }),
  nfpr: z.enum(["0", "1"]).optional().openapi({
    description: "Exclude autocorrected query results when set to 1.",
    example: "1",
  }),
  filter: z.enum(["0", "1"]).optional().openapi({
    description:
      "Enable/disable omitted/similar result filtering (1 default, 0 disable).",
    example: "0",
  }),
  tbm: z.string().optional().openapi({
    description:
      "Search type (e.g. isch, nws, vid, shop, lcl, pts).",
    example: "nws",
  }),
  start: z.number().int().min(0).optional().openapi({
    description: "Result offset for pagination.",
    example: 10,
  }),
  recency: SerpApiRecencySchema.optional().openapi({
    description:
      "Friendly recency filter. Maps to Google tbs qdr values (h/d/w/m/y). Ignored when tbs is provided.",
    example: "week",
  }),
  dateMin: z.string().optional().openapi({
    description:
      "Custom date range start in YYYY-MM-DD. Requires dateMax. Ignored when tbs is provided.",
    example: "2026-01-01",
  }),
  dateMax: z.string().optional().openapi({
    description:
      "Custom date range end in YYYY-MM-DD. Requires dateMin. Ignored when tbs is provided.",
    example: "2026-03-14",
  }),
  tbs: z.string().optional().openapi({
    description:
      "Raw Google tbs filter override (e.g., qdr:w, qdr:h5, cdr:1,cd_min:1/1/2026,cd_max:3/1/2026, sbd:1). Takes precedence over recency/dateMin/dateMax.",
    example: "qdr:w",
  }),
  device: z.enum(["desktop", "tablet", "mobile"]).optional().openapi({
    description: "Device type for search rendering.",
    example: "desktop",
  }),
  noCache: z.boolean().optional().openapi({
    description: "Force fresh results instead of cache.",
    example: false,
  }),
  async: z.boolean().optional().openapi({
    description: "Submit search asynchronously.",
    example: false,
  }),
  zeroTrace: z.boolean().optional().openapi({
    description: "Enterprise-only ZeroTrace mode.",
    example: false,
  }),
  output: z.enum(["json", "html"]).optional().openapi({
    description: "Output format from SerpAPI.",
    example: "json",
  }),
  jsonRestrictor: z.string().optional().openapi({
    description: "Restrict response fields for smaller payloads.",
  }),
  extraParams: z.record(z.any()).optional().openapi({
    description:
      "Optional passthrough key/value params for newly added SerpAPI options.",
  }),
});

export const SerpApiSearchResultDataSchema = z
  .object({
    search_metadata: z.any().optional().openapi({
      description: "SerpAPI search metadata.",
    }),
    search_parameters: z.any().optional().openapi({
      description: "Parameters used by SerpAPI.",
    }),
    search_information: z.any().optional().openapi({
      description: "General information about the search.",
    }),
    organic_results: z.array(z.any()).optional().openapi({
      description: "Organic search results.",
    }),
    related_questions: z.array(z.any()).optional().openapi({
      description: "People also ask style related questions.",
    }),
    inline_images: z.array(z.any()).optional().openapi({
      description: "Inline image results when available.",
    }),
    // Keep passthrough to remain resilient to SerpAPI response shape changes.
  })
  .passthrough()
  .openapi({
    description: "Raw SerpAPI response payload (normalized wrapper).",
  });

export const SerpApiSearchResponseSchema = SuccessResponseSchema(
  SerpApiSearchResultDataSchema,
);

export type SerpApiSearchRequest = z.infer<typeof SerpApiSearchRequestSchema>;
