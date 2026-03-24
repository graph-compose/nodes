import { createDocument } from "zod-openapi";
import "zod-openapi/extend"; // Ensure Zod methods are extended
import { HTTP_STATUS } from "../../../types/api-response";
import {
  ApiErrorResponseSchema, // Import the standard error schema
  AudioResultDataSchema,
  SoundEffectsRequestSchema,
  SoundEffectsResponseSchema,
  TextToSpeechRequestSchema,
  TextToSpeechResponseSchema,
  VoiceChangerResponseSchema,
  VoiceChangerUrlRequestSchema,
  VoiceSettingsSchema,
} from "./schemas/elevenlabsSchemas"; // Corrected path

const elevenlabsPaths = {
  // Note: Paths MUST include the service name prefix '/elevenlabs'
  "/elevenlabs/tts/generate": {
    post: {
      summary: "Generate Speech from Text (TTS)",
      description: `Synthesizes audio from text using a specified voice model and settings.

**Workflow:**
1. Provide \`apiKey\`, \`text\`, and \`voiceId\`.
2. Optionally specify \`modelId\`, \`voiceSettings\`, \`outputFormat\`, etc.
3. The API generates the audio synchronously.
4. Successful response (\`200 OK\`) includes \`audioUrl\` and metadata.
5. Errors (4xx/5xx) are returned for invalid requests or server issues.`,
      requestBody: {
        required: true,
        description: "API key, text, voice ID, and optional TTS parameters",
        content: {
          "application/json": {
            schema: TextToSpeechRequestSchema,
          },
        },
      },
      responses: {
        [String(HTTP_STATUS.OK)]: {
          description:
            "Speech generated successfully. Returns audio URL and metadata.",
          content: {
            "application/json": {
              schema: TextToSpeechResponseSchema,
            },
          },
        },
        [String(HTTP_STATUS.BAD_REQUEST)]: {
          description:
            "Invalid request parameters (e.g., text too long, invalid voice/model ID, invalid settings).",
          content: {
            "application/json": {
              schema: ApiErrorResponseSchema,
            },
          },
        },
        [String(HTTP_STATUS.UNAUTHORIZED)]: {
          description: "Authentication failed - Invalid or missing API key.",
          content: {
            "application/json": {
              schema: ApiErrorResponseSchema,
            },
          },
        },
        [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
          description:
            "Request valid, but generation failed (e.g., content policy violation, insufficient credits).",
          content: {
            "application/json": {
              schema: ApiErrorResponseSchema,
            },
          },
        },
        [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
          description:
            "Internal server error or ElevenLabs API issue during synthesis.",
          content: {
            "application/json": {
              schema: ApiErrorResponseSchema,
            },
          },
        },
      },
      tags: ["ElevenLabs"],
    },
  },
  "/elevenlabs/sfx/generate": {
    post: {
      summary: "Generate Sound Effect from Text (SFX)",
      description: `Generates a sound effect based on a textual description.

**Workflow:**
1. Provide \`apiKey\` and \`text\` description of the sound.
2. Optionally specify \`duration_seconds\` and \`prompt_influence\`.
3. The API generates the audio synchronously.
4. Successful response (\`200 OK\`) includes \`audioUrl\` and metadata.
5. Errors (4xx/5xx) indicate issues.`,
      requestBody: {
        required: true,
        description: "API key, text description, and optional SFX parameters",
        content: {
          "application/json": {
            schema: SoundEffectsRequestSchema,
          },
        },
      },
      responses: {
        [String(HTTP_STATUS.OK)]: {
          description:
            "Sound effect generated successfully. Returns audio URL and metadata.",
          content: {
            "application/json": {
              schema: SoundEffectsResponseSchema,
            },
          },
        },
        [String(HTTP_STATUS.BAD_REQUEST)]: {
          description:
            "Invalid request parameters (e.g., text too long, duration out of range).",
          content: {
            "application/json": {
              schema: ApiErrorResponseSchema,
            },
          },
        },
        [String(HTTP_STATUS.UNAUTHORIZED)]: {
          description: "Authentication failed - Invalid or missing API key.",
          content: {
            "application/json": {
              schema: ApiErrorResponseSchema,
            },
          },
        },
        [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
          description:
            "Request valid, but generation failed (e.g., content policy, insufficient credits).",
          content: {
            "application/json": {
              schema: ApiErrorResponseSchema,
            },
          },
        },
        [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
          description:
            "Internal server error or ElevenLabs API issue during SFX generation.",
          content: {
            "application/json": {
              schema: ApiErrorResponseSchema,
            },
          },
        },
      },
      tags: ["ElevenLabs"],
    },
  },
  "/elevenlabs/voice-changer/convert": {
    post: {
      summary: "Convert Voice using Audio URL",
      description: `Converts the voice in an audio file (provided via URL) to a target ElevenLabs voice.

**Workflow:**
1. Provide \`apiKey\`, target \`voiceId\`, and the \`audioUrl\` of the source speech.
2. Optionally specify conversion parameters like \`modelId\`, \`voiceSettings\`, etc.
3. The service downloads the audio, performs conversion, and uploads the result.
4. Successful response (\`200 OK\`) includes \`audioUrl\` and metadata.
5. Errors (4xx/5xx) indicate issues.`,
      requestBody: {
        required: true,
        description:
          "API key, target voice ID, source audio URL, and optional conversion parameters",
        content: {
          "application/json": {
            schema: VoiceChangerUrlRequestSchema,
          },
        },
      },
      responses: {
        [String(HTTP_STATUS.OK)]: {
          description:
            "Voice converted successfully. Returns audio URL and metadata.",
          content: {
            "application/json": {
              schema: VoiceChangerResponseSchema,
            },
          },
        },
        [String(HTTP_STATUS.BAD_REQUEST)]: {
          description:
            "Invalid request parameters (e.g., invalid URL, invalid voice/model ID).",
          content: {
            "application/json": {
              schema: ApiErrorResponseSchema,
            },
          },
        },
        [String(HTTP_STATUS.UNAUTHORIZED)]: {
          description: "Authentication failed - Invalid or missing API key.",
          content: {
            "application/json": {
              schema: ApiErrorResponseSchema,
            },
          },
        },
        [String(HTTP_STATUS.NOT_FOUND)]: {
          description:
            "Source audio file could not be accessed from the provided URL.",
          content: {
            "application/json": {
              schema: ApiErrorResponseSchema,
            },
          },
        },
        [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
          description:
            "Request valid, but conversion failed (e.g., unsupported audio format, content policy, credits).",
          content: {
            "application/json": {
              schema: ApiErrorResponseSchema,
            },
          },
        },
        [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
          description:
            "Internal server error or ElevenLabs API issue during voice conversion.",
          content: {
            "application/json": {
              schema: ApiErrorResponseSchema,
            },
          },
        },
      },
      tags: ["ElevenLabs"],
    },
  },
};

// Define components based on exported schemas
const elevenlabsComponents = {
  schemas: {
    // Request Schemas
    TextToSpeechRequest: TextToSpeechRequestSchema,
    SoundEffectsRequest: SoundEffectsRequestSchema,
    VoiceChangerUrlRequest: VoiceChangerUrlRequestSchema,

    // Response Schemas (including wrappers)
    TextToSpeechResponse: TextToSpeechResponseSchema,
    SoundEffectsResponse: SoundEffectsResponseSchema,
    VoiceChangerResponse: VoiceChangerResponseSchema,

    // Core Data Schemas
    AudioResultData: AudioResultDataSchema,
    VoiceSettings: VoiceSettingsSchema,
  },
  // Add securitySchemes if needed, e.g., for API keys passed in headers
  // securitySchemes: {
  //    ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' }
  // }
};

export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "ElevenLabs Speech Synthesis API",
      version: "1.0.0",
      description: `API for generating realistic speech, sound effects, and converting voices using ElevenLabs technology.

## Services
- **Text-to-Speech (TTS):** Converts text into natural-sounding speech using various voices and settings.
- **Sound Effects (SFX):** Generates sound effects based on text descriptions.
- **Voice Changer:** Converts speech from an audio source to a different target voice.

## Authentication
Requires an ElevenLabs API key provided in the \`apiKey\` field of the request body for all endpoints.`,
    },
    externalDocs: {
      description: "ElevenLabs API Documentation",
      url: "https://docs.elevenlabs.io/api-reference/introduction",
    },
    paths: elevenlabsPaths,
    components: elevenlabsComponents,
    // If using securitySchemes defined above, add a global security requirement
    // security: [ { ApiKeyAuth: [] } ] // Example if using header-based key globally
  });

  // Add custom metadata
  return {
    ...document,
    meta: {
      tags: [
        "ai",
        "speech",
        "audio",
        "tts",
        "voice",
        "sfx",
        "voice cloning",
        "elevenlabs",
      ],
      provider: "ElevenLabs",
      category: "AI/ML",
      imageUrl:
        "https://storage.cloud.google.com/graph-compose-public/elevenlabs-logo.png", // Official Logo URL
      sourceUrl: "https://elevenlabs.io/",
      description: `ElevenLabs offers advanced AI-powered text-to-speech (TTS), sound effects (SFX) generation, and voice changing capabilities through a simple API.

**Key Features:**
- **TTS:** Highly realistic and expressive voices, multilingual support, voice cloning (via website), fine-tuning settings (stability, similarity, style).
- **SFX:** Generate custom sound effects from text descriptions.
- **Voice Changer:** Convert existing speech audio into a different target voice.
- Multiple output formats and quality options.

**Use Cases:**
- Generating voiceovers for videos, presentations, and podcasts.
- Creating audio content for e-learning and accessibility.
- Building voice assistants and interactive applications.
- Producing custom sound effects for games or media.
- Modifying voices for creative projects or privacy.`,
      features: [
        "Realistic Text-to-Speech (TTS)",
        "Multilingual Voice Models",
        "Voice Cloning (via website/API)",
        "Sound Effect (SFX) Generation from Text",
        "Voice Changing/Conversion (Speech-to-Speech)",
        "Fine-grained Voice Settings (Stability, Similarity, Style)",
        "Multiple Audio Output Formats",
        "Low-latency Streaming Options",
      ],
      pricing: "Subscription-based with free tier and usage-based credits.",
      documentation: "https://docs.elevenlabs.io/api-reference/introduction",
      support: "https://elevenlabs.io/contact",
    },
  };
};
