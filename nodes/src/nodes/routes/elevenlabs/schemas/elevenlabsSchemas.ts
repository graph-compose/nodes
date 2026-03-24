import { z } from "zod";
// Removed direct import of createDocument, as it's used in openapi.ts
// import { createDocument } from "zod-openapi";
import "zod-openapi/extend";
import {
  ApiErrorResponseSchema as SharedApiErrorResponseSchema, // Import with alias
  SuccessResponseSchema as SharedSuccessResponseSchema, // Import with alias
} from "../../../../types/api-response";

// Re-export shared schemas for use within this module and by openapi.ts
export const ApiErrorResponseSchema = SharedApiErrorResponseSchema;
export const SuccessResponseSchema = SharedSuccessResponseSchema;

// Common OpenAPI tags for ElevenLabs schemas
const ELEVENLABS_TAGS = ["ElevenLabs"] as const;

// Voice settings schema
export const VoiceSettingsSchema = z
  .object({
    stability: z.number().min(0).max(1).optional().openapi({
      description:
        "Stability (0-1). Higher = more stable, less natural. Default varies by voice.",
      example: 0.75,
    }),
    similarity_boost: z.number().min(0).max(1).optional().openapi({
      description:
        "Similarity Boost (0-1). Higher = more similar to original voice. Default varies.",
      example: 0.8,
    }),
    style: z.number().min(0).max(1).optional().openapi({
      description:
        "Style Exaggeration (0-1). Higher = more expressive. Default: 0.",
      example: 0.2,
    }),
    use_speaker_boost: z.boolean().optional().openapi({
      description:
        "Enhances voice clarity and target speaker characteristics. Default: true.",
      example: true,
    }),
  })
  .openapi({
    description: "Voice settings controlling stability, similarity, and style.",
    "x-tags": ELEVENLABS_TAGS,
  });

// Shared Authentication Schema
export const ElevenLabsAuthSchema = z
  .object({
    apiKey: z.string().min(1).openapi({
      description: "Your ElevenLabs API key.",
      example: "YOUR_ELEVENLABS_API_KEY",
    }),
  })
  .openapi({
    description: "Authentication using an ElevenLabs API key",
    "x-tags": ELEVENLABS_TAGS,
  });

// Text to speech request schema
export const TextToSpeechRequestSchema = ElevenLabsAuthSchema.extend({
  text: z.string().max(5000).openapi({
    description:
      "The text to synthesize into speech. Max 5000 chars (may vary by plan).",
    example: "Hello! Welcome to the world of synthesized audio.",
  }),
  voiceId: z.string().min(1).openapi({
    description: "ID of the voice model to use (e.g., pre-made or cloned).",
    example: "21m00Tcm4TlvDq8ikWAM", // Example: Rachel
  }),
  modelId: z.string().optional().openapi({
    description: `Model ID. Examples: \`eleven_monolingual_v1\`, \`eleven_multilingual_v2\` (default), \`eleven_turbo_v2\`. See ElevenLabs docs.`,
    example: "eleven_multilingual_v2",
  }),
  voiceSettings: VoiceSettingsSchema.optional(),
  outputFormat: z
    .enum([
      "mp3_44100_32",
      "mp3_44100_64",
      "mp3_44100_96",
      "mp3_44100_128",
      "mp3_44100_192",
      "pcm_16000",
      "pcm_22050",
      "pcm_24000",
      "pcm_44100",
      "ulaw_8000",
    ])
    .optional()
    .openapi({
      description:
        "Output audio format (codec_samplerate_bitrate for mp3). See docs for options.",
      example: "mp3_44100_128",
    }),
  optimizeStreamingLatency: z.number().int().min(0).max(4).optional().openapi({
    description:
      "Latency optimization level (0-4). 0=default, 4=fastest (potential quality trade-off).",
    example: 0,
  }),
  seed: z.number().int().min(0).max(4294967295).optional().openapi({
    description: "Random seed (0-4294967295) for deterministic generation.",
    example: 12345,
  }),
}).openapi({
  description: "Parameters for generating speech from text.",
  "x-tags": ELEVENLABS_TAGS,
});

// Audio result data schema
export const AudioResultDataSchema = z
  .object({
    audioUrl: z.string().url().openapi({
      description: "Publicly accessible URL to the generated audio file.",
      example: "https://api.elevenlabs.io/v1/history/download/.../audio.mp3",
    }),
    format: z.string().openapi({
      description: "Format of the generated audio file.",
      example: "mp3_44100_128",
    }),
    generationId: z.string().optional().openapi({
      description:
        "Unique ID for the generation request (often in headers or history).",
      example: "gen_abc123xyz789",
    }),
    contentType: z.string().openapi({
      description: "MIME type of the audio file.",
      example: "audio/mpeg",
    }),
    contentLength: z.string().optional().openapi({
      description: "Size of the audio data in bytes (string format).",
      example: "512000",
    }),
  })
  .passthrough()
  .openapi({
    description: "Response data containing generated audio URL and metadata.",
    "x-tags": ELEVENLABS_TAGS,
  });

// Response schema using standardized format
export const TextToSpeechResponseSchema = SuccessResponseSchema(
  AudioResultDataSchema,
).openapi({
  description: "Standard success response for the TTS operation.",
  "x-tags": ELEVENLABS_TAGS,
});

// Sound effects request schema
export const SoundEffectsRequestSchema = ElevenLabsAuthSchema.extend({
  text: z.string().max(1000).openapi({
    description:
      "Text description of the sound effect (e.g., 'footsteps on gravel', 'movie trailer boom'). Max 1000 chars.",
    example: "A deep, resonant cinematic boom sound effect",
  }),
  duration_seconds: z.number().min(0.5).max(22).optional().openapi({
    description:
      "Sound duration in seconds (0.5 - 22). If omitted, inferred from prompt.",
    example: 3.5,
  }),
  prompt_influence: z.number().min(0).max(1).optional().openapi({
    description:
      "Prompt influence (0-1). Higher = closer to prompt, less varied. Default: 0.3.",
    example: 0.5,
  }),
  outputFormat: z
    .enum([
      "mp3_44100_128",
      "mp3_44100_192",
      "pcm_16000",
      "pcm_22050",
      "pcm_24000",
      "pcm_44100",
      "ulaw_8000",
    ])
    .optional()
    .openapi({
      description: "Optional output format. Defaults likely to mp3.",
      example: "mp3_44100_192",
    }),
}).openapi({
  description: "Parameters for generating a sound effect from text.",
  "x-tags": ELEVENLABS_TAGS,
});

// Sound effects response schema
export const SoundEffectsResponseSchema = SuccessResponseSchema(
  AudioResultDataSchema,
).openapi({
  description: "Standard success response for the SFX generation operation.",
  "x-tags": ELEVENLABS_TAGS,
});

// Voice changer request schema (JSON with URL input)
export const VoiceChangerUrlRequestSchema = ElevenLabsAuthSchema.extend({
  voiceId: z.string().min(1).openapi({
    description: "ID of the target voice to convert the audio to.",
    example: "pNInz6obpgDQGcFmaJgB", // Example: Gigi
  }),
  audioUrl: z.string().url().openapi({
    description: "Publicly accessible URL of the source audio file to convert.",
    example: "https://example.com/source_audio.wav",
  }),
  modelId: z.string().optional().openapi({
    description: `Model ID. Options: \`eleven_english_sts_v2\` (default), \`eleven_multilingual_sts_v2\`.`,
    default: "eleven_english_sts_v2",
    example: "eleven_multilingual_sts_v2",
  }),
  voiceSettings: VoiceSettingsSchema.optional(),
  outputFormat: z
    .enum([
      "mp3_44100_128",
      "mp3_44100_192",
      "pcm_16000",
      "pcm_22050",
      "pcm_24000",
      "pcm_44100",
      "ulaw_8000",
    ])
    .optional()
    .openapi({
      description: "Optional output audio format.",
      example: "mp3_44100_128",
    }),
  optimizeStreamingLatency: z.number().int().min(0).max(4).optional().openapi({
    description:
      "Latency optimization level (0-4). (Verify effectiveness for Voice Changer).",
    example: 0,
  }),
  seed: z.number().int().min(0).max(4294967295).optional().openapi({
    description: "Random seed (0-4294967295) for deterministic generation.",
    example: 98765,
  }),
  removeBackgroundNoise: z.boolean().optional().openapi({
    description:
      "Attempt to remove background noise from the input audio. Default: false.",
    example: true,
  }),
}).openapi({
  description:
    "Parameters for converting speech from an audio URL to a different voice.",
  "x-tags": ELEVENLABS_TAGS,
});

// Voice changer response schema (same structure as TTS/SFX)
export const VoiceChangerResponseSchema = SuccessResponseSchema(
  AudioResultDataSchema,
).openapi({
  description: "Standard success response for the voice changing operation.",
  "x-tags": ELEVENLABS_TAGS,
});
