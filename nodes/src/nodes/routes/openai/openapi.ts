import { createDocument, ZodOpenApiObject } from "zod-openapi";
import "zod-openapi/extend";
import {
  ApiErrorResponseSchema,
  HTTP_STATUS,
} from "../../../types/api-response";
import {
  TranscribeSpeechRequestSchema,
  TranscribeSpeechResponseSchema,
} from "./schemas/speechSchemas";
import {
  AnalyzeImageRequestSchema,
  AnalyzeImageResponseSchema,
} from "./schemas/visionSchemas";
// TODO: Import a standard error response schema if available
// import { ErrorResponseSchema } from '@common/schemas';

// Common Tags
const OPENAI_TAGS = ["OpenAI"];

export const createOpenApiDocument = () => {
  const document = createDocument({
    openapi: "3.1.0",
    info: {
      title: "OpenAI Node API (Vision & Speech)",
      version: "1.0.0",
      description: `API for interacting with OpenAI services.

## Services
- **Vision:** Analyze images using models like GPT-4o.
- **Speech-to-Text (Whisper):** Transcribe audio files to text.

## Authentication
Requires an OpenAI API key (\`apiKey\`) provided in the request body for all endpoints.`,
    },
    externalDocs: {
      description: "OpenAI API Documentation",
      url: "https://platform.openai.com/docs/api-reference",
    },
    paths: {
      // === Vision Endpoint ===
      "/openai/vision/analyze-image": {
        post: {
          summary: "Analyze Image with OpenAI Vision",
          description: `Analyzes an image using an OpenAI vision model (e.g., \`gpt-4o\`).

**Workflow:**
1. Provide \`apiKey\` and \`imageUrl\`.
2. Optionally provide a \`prompt\` to guide analysis, \`model\` to use, and \`max_tokens\`.
3. Successful response (\`200 OK\`) contains the text \`analysis\`, \`modelUsed\`, and \`usage\` stats.
4. Errors (4xx/5xx) indicate issues.`,
          tags: OPENAI_TAGS,
          requestBody: {
            required: true,
            description: "API key, image URL, and optional analysis parameters",
            content: {
              "application/json": { schema: AnalyzeImageRequestSchema },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description:
                "Image analysis successful. Returns analysis and metadata.",
              content: {
                "application/json": { schema: AnalyzeImageResponseSchema },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request parameters (e.g., invalid URL, unsupported image format, invalid model).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description:
                "Authentication failed - Invalid or missing API key.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description:
                "Image could not be processed (e.g., content policy violation, download error, analysis failure).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description:
                "Internal server error or OpenAI API issue during analysis.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            // Consider 429
          },
        },
      },
      // === Speech-to-Text Endpoint ===
      "/openai/speech/transcribe": {
        post: {
          summary: "Transcribe Audio with OpenAI Whisper",
          description: `Transcribes audio from a URL using the Whisper model.

**Workflow:**
1. Provide \`apiKey\` and \`audioUrl\`.
2. Optionally specify \`language\`, \`prompt\`, \`temperature\`, \`responseFormat\`.
3. The service downloads and processes the audio synchronously.
4. Successful response (\`200 OK\`) contains the transcription in the specified format.
5. Errors (4xx/5xx) indicate issues.

**Response Format Note:** The structure of \`data\` in the success response depends on the requested \`responseFormat\`. For \`json\` or \`verbose_json\`, it's a structured object. For \`text\`, \`srt\`, or \`vtt\`, it's a plain string.`,
          tags: OPENAI_TAGS,
          requestBody: {
            required: true,
            description:
              "API key, audio URL, and optional transcription parameters",
            content: {
              "application/json": { schema: TranscribeSpeechRequestSchema },
            },
          },
          responses: {
            [String(HTTP_STATUS.OK)]: {
              description:
                "Audio transcribed successfully. Format depends on `responseFormat`.",
              content: {
                "application/json": { schema: TranscribeSpeechResponseSchema },
              },
            },
            [String(HTTP_STATUS.BAD_REQUEST)]: {
              description:
                "Invalid request parameters (e.g., invalid URL, unsupported language, invalid format).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNAUTHORIZED)]: {
              description:
                "Authentication failed - Invalid or missing API key.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.UNPROCESSABLE_ENTITY)]: {
              description:
                "Audio could not be processed (e.g., invalid/unsupported audio format, file too large, transcription error).",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            [String(HTTP_STATUS.INTERNAL_SERVER_ERROR)]: {
              description:
                "Internal server error or OpenAI API issue during transcription.",
              content: {
                "application/json": { schema: ApiErrorResponseSchema },
              },
            },
            // Consider 429
          },
        },
      },
    },
    // Components automatically inferred
  });

  // Add custom metadata
  return {
    ...document,
    meta: {
      tags: [
        "ai",
        "openai",
        "vision",
        "image analysis",
        "speech-to-text",
        "stt",
        "whisper",
        "audio",
        "transcription",
      ],
      provider: "OpenAI",
      category: "AI/ML",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1200px-OpenAI_Logo.svg.png", // Official Logo
      sourceUrl: "https://platform.openai.com/docs/introduction",
      description: `Integrates with OpenAI\'s powerful AI models for various tasks.

**Services Provided:**
- **Vision (GPT-4o etc.):** Analyze and describe images, answer questions about visual content.
- **Speech-to-Text (Whisper):** Transcribe audio files into text with high accuracy, supporting multiple languages.

**Use Cases:**
- Image captioning and understanding.
- Extracting information from images.
- Transcribing podcasts, meetings, or audio notes.
- Creating searchable audio archives.`,
      features: [
        "Image Analysis (GPT-4 Vision models)",
        "Text-based prompting for Vision",
        "Audio Transcription (Whisper)",
        "Multiple Transcription Formats (JSON, Text, SRT, VTT)",
        "Language Detection (STT)",
        "Transcription Prompting",
        "Temperature Control (STT)",
      ],
      pricing:
        "Usage-based pricing based on tokens (Vision) or audio duration (Whisper).",
      documentation: "https://platform.openai.com/docs/api-reference",
      support: "https://help.openai.com/",
    },
  } as ZodOpenApiObject;
};
