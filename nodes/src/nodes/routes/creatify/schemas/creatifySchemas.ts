import { z } from "zod";
import "zod-openapi/extend";
import { SuccessResponseSchema } from "../../../../types/api-response";

// --- Reusable Schemas ---

// Common OpenAPI tags for Creatify schemas
const CREATIFY_TAGS = ["Creatify"] as const;

// Extracted from old types.ts and schema.ts
export const CreatifyAuthSchema = z
  .object({
    apiId: z.string().min(1).openapi({
      description: "Your Creatify X-API-ID.",
      example: "YOUR_CREATIFY_API_ID",
    }),
    apiKey: z.string().min(1).openapi({
      description: "Your Creatify X-API-KEY.",
      example: "YOUR_CREATIFY_API_KEY",
    }),
  })
  .openapi({
    description: "Authentication credentials for Creatify API",
    "x-tags": CREATIFY_TAGS,
  });

// Standardized Task Result Schema (Based on ROUTE_STANDARDS.md and old schema.ts)
export const CreatifyTaskResultDataSchema = z
  .object({
    taskId: z.string().openapi({
      description: "The unique identifier for the Creatify task.",
      example: "tsk_abc123xyz789def012",
    }),
    status: z.enum(["submitted", "processing", "succeed", "failed"]).openapi({
      description:
        "The current status of the task (submitted, processing, succeed, failed).",
      example: "succeed",
    }),
    statusMessage: z.string().optional().openapi({
      description:
        "Additional status information or error message from Creatify.",
      example: "Task failed due to invalid voice ID.",
    }),
    progress: z.number().min(0).max(100).optional().openapi({
      description: "Task progress percentage (0-100, if available).",
      example: 75,
    }),
    resultUrl: z.string().url().optional().openapi({
      description:
        "URL of the generated video. Available only when status is 'succeed'.",
      example: "https://video.creatify.ai/output/abc123xyz.mp4",
    }),
  })
  .passthrough()
  .openapi({
    description:
      "Standardized response data containing task status and results.",
    "x-tags": CREATIFY_TAGS,
  });

// --- Single Avatar Lipsync Schemas ---

// Request Schema for Single Avatar Lipsync
export const CreateSingleLipsyncRequestSchema = CreatifyAuthSchema.extend({
  text: z.string().optional().openapi({
    description:
      "Text script for the avatar to speak. Required if 'audio_url' is not provided.",
    example: "Hello and welcome to our latest feature showcase!",
  }),
  audio_url: z.string().url().optional().openapi({
    description:
      "URL of a publicly accessible audio file (.mp3, .wav) for lip-syncing. Required if 'text' is not provided.",
    example: "https://storage.googleapis.com/my-bucket/audio/intro.mp3",
  }),
  avatar_id: z.string().openapi({
    description: "The unique identifier of the Creatify avatar to use.",
    example: "avt_1234567890abcdef123456",
  }),
  voice_id: z.string().optional().openapi({
    description:
      "The unique identifier of the Creatify voice to use for text-to-speech. Required if 'text' is provided.",
    example: "voi_abcdef1234567890abcdef",
  }),
  aspect_ratio: z
    .enum(["1x1", "16x9", "9x16"])
    .optional()
    .default("16x9")
    .openapi({
      description: "Aspect ratio of the output video.",
      example: "16x9",
    }),
  background_url: z.string().url().optional().openapi({
    description:
      "URL of a public image (.jpg, .png) or video (.mp4) for the background.",
    example: "https://images.pexels.com/photos/210186/pexels-photo-210186.jpeg",
  }),
  caption_style: z.string().optional().openapi({
    description:
      "Predefined style for captions (e.g., 'normal-black', see Creatify docs).",
    example: "normal-white-stroke",
  }),
  callback_url: z.string().url().optional().openapi({
    description:
      "Webhook URL to receive task status updates (POST requests) from Creatify.",
    example: "https://your-service.com/webhook/creatify-status",
  }),
})
  .refine((data) => data.text || data.audio_url, {
    message:
      "Either 'text' or 'audio_url' must be provided for the speech source.",
    path: ["text", "audio_url"],
  })
  .refine((data) => (data.text ? data.voice_id : true), {
    message: "A 'voice_id' is required when using 'text' for speech synthesis.",
    path: ["voice_id"],
  })
  .openapi({
    description: "Parameters for creating a single-avatar lipsync video task.",
    "x-tags": CREATIFY_TAGS,
  });

// --- Multi-Avatar Lipsync Schemas ---

const CreatifyOffsetSchema = z
  .object({
    x: z.number().optional().openapi({
      description: "Horizontal offset (pixels or percentage)",
      example: 10,
    }),
    y: z.number().optional().openapi({
      description: "Vertical offset (pixels or percentage)",
      example: -5,
    }),
  })
  .openapi({
    description: "X/Y offset coordinates for positioning elements.",
    "x-tags": CREATIFY_TAGS,
  });

const CreatifyCharacterSchema = z
  .object({
    avatar_id: z.string().openapi({
      description: "Unique ID of the avatar for this scene.",
      example: "avt_fedcba0987654321fedcba",
    }),
    avatar_style: z.string().optional().default("normal").openapi({
      description:
        "Style of the avatar (e.g., 'normal', check Creatify docs for options).",
      example: "circle",
    }),
    offset: CreatifyOffsetSchema.optional(),
  })
  .openapi({
    description: "Avatar configuration within a multi-avatar scene.",
    "x-tags": CREATIFY_TAGS,
  });

const CreatifyVoiceSchema = z
  .object({
    type: z.enum(["text", "audio"]).openapi({
      description:
        "Input type: 'text' for TTS or 'audio' for lip-sync to existing audio.",
      example: "text",
    }),
    input_text: z.string().optional().openapi({
      description: "Text script for TTS. Required if type is 'text'.",
      example: "Now let's hear from our expert...",
    }),
    audio_url: z.string().url().optional().openapi({
      description:
        "Publicly accessible audio file URL (.mp3, .wav). Required if type is 'audio'.",
      example:
        "https://storage.googleapis.com/my-bucket/audio/expert_segment.mp3",
    }),
    voice_id: z.string().openapi({
      description:
        "Unique ID of the voice for TTS. Required if type is 'text'.",
      example: "voi_112233445566778899aabb",
    }),
  })
  .refine(
    (data) => (data.type === "text" ? data.input_text && data.voice_id : true),
    {
      message:
        "When voice type is 'text', 'input_text' and 'voice_id' are required.",
      path: ["input_text", "voice_id"],
    },
  )
  .refine((data) => (data.type === "audio" ? data.audio_url : true), {
    message: "When voice type is 'audio', 'audio_url' is required.",
    path: ["audio_url"],
  })
  .openapi({
    description:
      "Voice configuration for a scene, using either text-to-speech or an audio file.",
    "x-tags": CREATIFY_TAGS,
  });

const CreatifyBackgroundSchema = z
  .object({
    type: z.enum(["image", "video"]).openapi({
      description:
        "Type of background: 'image' (.jpg, .png) or 'video' (.mp4).",
      example: "image",
    }),
    url: z.string().url().openapi({
      // URL is always required if type is image/video
      description: "Public URL for the background image or video.",
      example:
        "https://images.pexels.com/photos/110854/pexels-photo-110854.jpeg",
    }),
  })
  // Removed refine as URL is now non-optional based on Creatify docs implied structure
  .openapi({
    description: "Background configuration (image or video) for a scene.",
    "x-tags": CREATIFY_TAGS,
  });

const CreatifyCaptionSettingSchema = z
  .object({
    style: z.string().optional().default("normal-black").openapi({
      description: "Predefined style for captions (see Creatify docs).",
      example: "highlight-yellow",
    }),
    offset: CreatifyOffsetSchema.optional(),
  })
  .openapi({
    description: "Optional caption style and positioning for a scene.",
    "x-tags": CREATIFY_TAGS,
  });

// Combined Input schema for one part of the multi-avatar sequence
const CreatifyVideoInputSchema = z
  .object({
    character: CreatifyCharacterSchema,
    voice: CreatifyVoiceSchema,
    background: CreatifyBackgroundSchema,
    caption_setting: CreatifyCaptionSettingSchema.optional(),
  })
  .openapi({
    description:
      "Configuration for a single segment/scene within a multi-avatar video.",
    "x-tags": CREATIFY_TAGS,
  });

// Request Schema for Multi-Avatar Lipsync
export const CreateMultiLipsyncRequestSchema = CreatifyAuthSchema.extend({
  video_inputs: z
    .array(CreatifyVideoInputSchema)
    .min(1)
    .openapi({
      description:
        "An array defining the sequence of scenes, each with character, voice, and background.",
      example: [
        {
          character: {
            avatar_id: "avt_1234567890abcdef123456",
            avatar_style: "circle",
          },
          voice: {
            type: "text",
            input_text: "Scene 1 text goes here.",
            voice_id: "voi_abcdef1234567890abcdef",
          },
          background: {
            type: "image",
            url: "https://images.pexels.com/photos/110854/pexels-photo-110854.jpeg",
          },
          caption_setting: {
            style: "highlight-yellow",
          },
        },
        {
          character: {
            avatar_id: "avt_fedcba0987654321fedcba",
          },
          voice: {
            type: "audio",
            audio_url:
              "https://storage.googleapis.com/my-bucket/audio/expert_segment.mp3",
            voice_id: "voi_placeholder_for_audio", // voice_id still required by base schema, even if unused for audio type by Creatify
          },
          background: {
            type: "video",
            url: "https://videos.pexels.com/video-files/854004/854004-hd_1920_1080_25fps.mp4",
          },
        },
      ],
    }),
  aspect_ratio: z
    .enum(["1x1", "16x9", "9x16"])
    .optional()
    .default("16x9")
    .openapi({
      description: "Aspect ratio for the final output video.",
      example: "9x16",
    }),
  callback_url: z.string().url().optional().openapi({
    description: "Optional webhook URL for task status updates.",
    example: "https://your-service.com/webhook/creatify-multi-status",
  }),
}).openapi({
  description: "Parameters for creating a multi-avatar lipsync video task.",
  "x-tags": CREATIFY_TAGS,
});

// --- Task Status Query Schemas ---

// Request Schema for Querying Task Status
export const QueryTaskRequestSchema = CreatifyAuthSchema.extend({
  taskId: z.string().openapi({
    description:
      "The ID of the Creatify task (obtained from a create request) to query.",
    example: "tsk_abc123xyz789def012",
  }),
}).openapi({
  description: "Parameters for querying the status of a Creatify task.",
  "x-tags": CREATIFY_TAGS,
});

// --- Wrapped Response Schemas ---

// Specific data schema for task *creation* responses
const CreatifyTaskCreateResponseDataSchema = z
  .object({
    taskId: z.string().openapi({
      description: "The ID assigned by Creatify to the newly created task.",
      example: "tsk_abc123xyz789def012",
    }),
  })
  .openapi({
    description: "Core response data after successfully initiating a task.",
    "x-tags": CREATIFY_TAGS,
  });

// Wrapped response for *creating* a lipsync task (single or multi)
export const CreateLipsyncResponseSchema = SuccessResponseSchema(
  CreatifyTaskCreateResponseDataSchema,
).openapi({
  description:
    "Standard success response after submitting a task creation request.",
  "x-tags": CREATIFY_TAGS,
});

// Wrapped response for *querying* task status
export const QueryTaskResponseSchema = SuccessResponseSchema(
  CreatifyTaskResultDataSchema, // Uses the standardized result schema
).openapi({
  description:
    "Standard success response containing the task status and result URL (if completed).",
  "x-tags": CREATIFY_TAGS,
});
