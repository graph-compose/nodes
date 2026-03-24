import { createDocument, ZodOpenApiObject } from "zod-openapi";
import {
  ApiErrorResponseSchema,
  HTTP_STATUS,
} from "../../../types/api-response";
import {
  SpeakRequestSchema,
  SpeakResponseSchema,
} from "./schemas/speakSchemas";
import {
  TranscribeUrlRequestSchema,
  TranscribeUrlResponseSchema,
} from "./schemas/transcribeSchemas";

// Common Tags
const DEEPGRAM_TAGS = ["Deepgram"];

export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "Deepgram Speech API (TTS & STT)",
      version: "1.0.0",
      description: `API for interacting with Deepgram's speech services: Text-to-Speech (TTS) and Speech-to-Text (STT).\n\n## Services\n- **Speak (TTS):** Synthesizes text into audio using various voice models and output formats.\n- **Transcribe (STT):** Converts audio from a URL into text, with options for formatting, diarization, etc.\n\n## Authentication\nRequires a Deepgram API key provided in the \`apiKey\` field of the request body for all endpoints.`,
    },
    externalDocs: {
      description: "Deepgram API Documentation",
      url: "https://developers.deepgram.com/docs",
    },
    paths: {
      // === Text-to-Speech Endpoint ===
      "/deepgram/speak": {
        post: {
          summary: "Synthesize Speech from Text (TTS)",
          description: `Generates audio from the provided text using Deepgram's TTS models.\n\n**Workflow:**\n1. Submit \`text\`, \`apiKey\`, and optional parameters (\`model\`, \`encoding\`, etc.).\n2. The service synthesizes the audio synchronously.\n3. If successful (\`200 OK\`),\n the response includes a URL (\`data.audioUrl\`) to the generated audio file stored temporarily in cloud storage, along with metadata.\n4. If failed, an error response (4xx/5xx) is returned.`,
          tags: DEEPGRAM_TAGS,
          requestBody: {
            required: true,
            description:
              "API key, text to synthesize, and optional TTS parameters",
            content: {
              "application/json": {
                schema: SpeakRequestSchema,
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description:
                "Audio synthesized successfully. Returns audio URL and metadata.",
              content: {
                "application/json": {
                  schema: SpeakResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request parameters (e.g., text too long, invalid model/encoding).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description:
                "Authentication failed - Invalid or missing Deepgram API key.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description:
                "Request valid, but TTS generation failed (e.g., unsupported parameter combination, content policy).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description:
                "Internal server error or Deepgram API issue during synthesis.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            // Consider 429, 503
          },
        },
      },
      // === Speech-to-Text Endpoint ===
      "/deepgram/transcribe/url": {
        post: {
          summary: "Transcribe Audio from URL (STT)",
          description: `Transcribes audio content from a publicly accessible URL using Deepgram's STT models.\n\n**Workflow:**\n1. Submit the audio \`url\`, \`apiKey\`, and optional transcription parameters (\`model\`, \`language\`, \`punctuate\`, \`diarize\`, etc.).\n2. Deepgram processes the audio synchronously.\n3. If successful (\`200 OK\`),\n the response includes the full transcription result, including \`metadata\` and \`results.channels[].alternatives[].transcript\`.\n4. If failed, an error response (4xx/5xx) is returned.`,
          tags: DEEPGRAM_TAGS,
          requestBody: {
            required: true,
            description:
              "API key, audio URL, and optional transcription parameters",
            content: {
              "application/json": {
                schema: TranscribeUrlRequestSchema,
              },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description:
                "Audio transcribed successfully. Returns detailed results.",
              content: {
                "application/json": {
                  schema: TranscribeUrlResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request parameters (e.g., invalid URL, unsupported language/model combination).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description:
                "Authentication failed - Invalid or missing Deepgram API key.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.NOT_FOUND)]: {
              description:
                "The audio file could not be found or accessed at the provided URL.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description:
                "Audio could not be processed (e.g., unsupported format, empty file, processing error).",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description:
                "Internal server error or Deepgram API issue during transcription.",
              content: {
                "application/json": {
                  schema: ApiErrorResponseSchema,
                },
              },
            },
            // Consider 429, 503
          },
        },
      },
    },
    components: {
      // schemas: { ... }
    },
  });

  // Add custom metadata
  return {
    ...document,
    meta: {
      tags: [
        "speech",
        "audio",
        "tts",
        "stt",
        "transcription",
        "voice",
        "deepgram",
      ],
      provider: "Deepgram",
      category: "AI/ML",
      imageUrl:
        "https://storage.cloud.google.com/graph-compose-public/deepgram-logo.png", // Official white logo
      sourceUrl: "https://deepgram.com/",
      description: `Deepgram provides powerful and accurate Speech-to-Text (STT) and Text-to-Speech (TTS) APIs for developers.\n\n**Key Features:**\n- **STT:** High accuracy transcription, real-time & pre-recorded audio, speaker diarization, smart formatting, language detection, keyword spotting.\n- **TTS:** Natural-sounding voices (Aura models), various output formats and encodings, low latency.\n- Easy-to-use API.\n\n**Use Cases:**\n- Voice assistants and bots.\n- Meeting transcription and analysis.\n- Audio/Video content captioning.\n- Voice-enabled applications.\n- Generating audio readouts or voiceovers.`,
      features: [
        "Accurate Speech-to-Text (STT)",
        "Natural Text-to-Speech (TTS - Aura)",
        "Pre-recorded Audio Transcription (URL based)",
        "Speaker Diarization",
        "Smart Formatting & Punctuation (STT)",
        "Multiple Audio Formats/Encodings (TTS)",
        "Language Detection (STT)",
        "Keyword Spotting (STT)",
      ],
      pricing: "Pay-as-you-go pricing based on audio duration processed.",
      documentation: "https://developers.deepgram.com/docs",
      support: "https://deepgram.com/contact-us",
    },
  } as ZodOpenApiObject;
};
