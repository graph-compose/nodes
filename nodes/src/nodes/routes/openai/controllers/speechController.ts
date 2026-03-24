import { Request, Response } from "express";
import { FileValidatorService } from "../../../services/file-validator.service"; // Assuming path is correct relative to controllers
import type { TranscribeSpeechRequest } from "../schemas/speechSchemas"; // Import type for req.body
import { OpenAIService } from "../services/openai.service";

// Initialize services required by the controller logic
// TODO: Consider dependency injection for services instead of direct instantiation
const fileValidator = new FileValidatorService();
const openaiService = new OpenAIService(fileValidator);

// Controller function for transcribing speech
export const transcribeSpeechController = async (
  // Use specific types instead of {}
  req: Request<
    Record<string, never>,
    any,
    TranscribeSpeechRequest,
    Record<string, never>
  >,
  res: Response,
) => {
  try {
    // Input is validated by middleware before reaching here
    const result = await openaiService.transcribeAudio(req.body);
    // Service should return data that conforms to TranscribeSpeechDataSchema
    res.json({
      success: true,
      data: result, // Assuming service returns data matching TranscribeSpeechDataSchema
    });
  } catch (error: unknown) {
    console.error(
      "[OpenAI Speech Controller] Error transcribing audio:",
      error,
    );

    const userMessage = "Failed to transcribe audio due to an internal error.";
    let statusCode = 500;
    let errorDetails = "An unexpected error occurred during transcription";
    let errorCode: string | undefined = undefined;

    // Extract more specific details if possible (based on old error structure)
    if (error instanceof Error) {
      errorDetails = error.message;
      // Attempt to preserve any custom error codes if the service throws them
      // This requires the service to throw errors with a 'code' property
      if ((error as any).code) {
        errorCode = (error as any).code;
      }
      // Check for specific error messages like in vision controller if applicable
      if (error.message.includes("Invalid API Key")) {
        statusCode = 401;
      }
      // Add more specific checks if needed (e.g., file size, format)
    }

    res.status(statusCode).json({
      success: false,
      message: userMessage,
      error: {
        details: errorDetails,
        ...(errorCode && { code: errorCode }), // Include code if it exists
      },
    });
  }
};
