import axios from "axios";
import { z } from "zod";
import { AnalyzeImageRequest } from "../schemas/visionSchemas";

const OPENAI_API_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_VISION_MODEL = "gpt-4o";
const DEFAULT_PROMPT = "Describe this image in detail.";
const DEFAULT_MAX_TOKENS = 300;

// Define the expected structure of the response data from OpenAI
const OpenAIChatCompletionChoiceSchema = z.object({
  message: z.object({
    role: z.string(),
    content: z.string().nullable(), // Content can be null
  }),
  // Include other fields if needed, like finish_reason
});

const OpenAIChatCompletionResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(OpenAIChatCompletionChoiceSchema).min(1),
  usage: z
    .object({
      // Optional: include usage if you want to return it
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
});

interface AnalyzeImageResult {
  analysis: string;
  modelUsed: string;
}

export const analyzeImageWithVision = async (
  request: AnalyzeImageRequest,
): Promise<AnalyzeImageResult> => {
  const { apiKey, imageUrl, prompt } = request;
  const analysisPrompt = prompt || DEFAULT_PROMPT;
  const modelToUse = DEFAULT_VISION_MODEL; // For now, hardcode gpt-4o
  const maxTokens = DEFAULT_MAX_TOKENS; // Use a default

  const payload = {
    model: modelToUse,
    messages: [
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: analysisPrompt,
          },
          {
            type: "image_url" as const,
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ],
    max_tokens: maxTokens,
  };

  try {
    const response = await axios.post(
      `${OPENAI_API_BASE_URL}/chat/completions`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Validate the structure of the OpenAI response
    const validationResult = OpenAIChatCompletionResponseSchema.safeParse(
      response.data,
    );

    if (!validationResult.success) {
      console.error(
        "OpenAI API response validation failed:",
        validationResult.error.errors,
      );
      throw new Error("Invalid response structure received from OpenAI API.");
    }

    const analysisContent = validationResult.data.choices[0]?.message?.content;

    if (typeof analysisContent !== "string") {
      console.error(
        "No valid text content found in OpenAI response choices.",
        validationResult.data,
      );
      throw new Error(
        "Failed to extract analysis content from OpenAI response.",
      );
    }

    return {
      analysis: analysisContent,
      modelUsed: validationResult.data.model, // Return the actual model used
    };
  } catch (error) {
    console.error("Error calling OpenAI Vision API:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("OpenAI API Error Response:", error.response.data);
      const errorData = error.response.data?.error;
      const errorMessage =
        typeof errorData === "string"
          ? errorData
          : errorData?.message || "Unknown OpenAI API error";
      throw new Error(`OpenAI API request failed: ${errorMessage}`);
    } else if (
      error instanceof Error &&
      (error.message.startsWith("Invalid response structure") ||
        error.message.startsWith("Failed to extract analysis"))
    ) {
      // Re-throw our specific validation errors
      throw error;
    }
    throw new Error("An unexpected error occurred while analyzing the image.");
  }
};
