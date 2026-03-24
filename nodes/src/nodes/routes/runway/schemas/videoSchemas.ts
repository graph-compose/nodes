import { z } from "zod";
import "zod-openapi/extend";

// Common OpenAPI tags for Runway schemas
const RUNWAY_TAGS = ["RunwayML"] as const;

// PromptImage position enum
const PromptImagePositionSchema = z.enum(["first", "last"]).openapi({
  description: "Position of the image in the output video",
  example: "first",
  "x-tags": RUNWAY_TAGS,
});

// PromptImage object schema
const PromptImageObjectSchema = z
  .object({
    uri: z.string().url().openapi({
      description: "A HTTPS URL or data URI containing an encoded image",
      example: "https://example.com/image.jpg",
    }),
    position: PromptImagePositionSchema,
  })
  .openapi({
    description: "Image to be used in the output video",
    "x-tags": RUNWAY_TAGS,
  });

// PromptImage schema (string or array of objects)
const PromptImageSchema = z
  .union([
    z.string().url().openapi({
      description:
        "A HTTPS URL or data URI containing an encoded image to be used as the first frame of the generated video",
      example: "https://example.com/start-image.jpg",
    }),
    z.array(PromptImageObjectSchema).openapi({
      description:
        "An array of objects representing images to be used in the output video",
      example: [
        { uri: "https://example.com/image1.jpg", position: "first" },
        { uri: "https://example.com/image2.jpg", position: "last" },
      ],
    }),
  ])
  .openapi({
    description: "Image input for video generation (URL, data URI, or array)",
    "x-tags": RUNWAY_TAGS,
  });

// Video generation input schema (used by request schema)
export const VideoGenerationInputSchema = z
  .object({
    promptImage: PromptImageSchema,
    model: z.enum(["gen3a_turbo"]).openapi({
      description: "The model variant to use",
      example: "gen3a_turbo",
    }),
    seed: z.number().int().min(0).max(4294967295).optional().openapi({
      description:
        "Integer seed for reproducibility (0 to 2^32 - 1). If unspecified, a random number is chosen.",
      example: 123456789,
    }),
    promptText: z.string().max(512).optional().openapi({
      description:
        "Detailed description of the desired output (up to 512 characters)",
      example:
        "A cinematic shot of a futuristic city skyline at night, neon lights reflecting on wet streets.",
    }),
    watermark: z.boolean().default(false).optional().openapi({
      description: "Whether the output video will contain a Runway watermark",
      example: false,
    }),
    duration: z.enum(["5", "10"]).default("10").optional().openapi({
      description: "Duration of the output video in seconds",
      example: "10",
    }),
    ratio: z.enum(["1280:768", "768:1280"]).optional().openapi({
      description: "Resolution of the output video (width:height)",
      example: "1280:768",
    }),
  })
  .openapi({
    description: "Core parameters for generating a video with RunwayML",
    "x-tags": RUNWAY_TAGS,
  });

// Video generation result data schema (used by response schema)
export const VideoGenerationResultDataSchema = z
  .object({
    id: z.string().openapi({
      description: "Unique identifier for the initiated video generation task",
      example: "task_abc123xyz789",
    }),
  })
  .passthrough() // Allow additional fields from the API
  .openapi({
    description: "Response data containing the ID of the initiated task.",
    "x-tags": RUNWAY_TAGS,
  });
