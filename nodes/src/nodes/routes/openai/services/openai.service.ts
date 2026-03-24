import * as fs from "fs";
import OpenAI from "openai";
import type { z } from "zod";
import { FileValidatorService } from "../../../services/file-validator.service";
import { TranscribeSpeechRequestSchema } from "../schemas/speechSchemas";
export class OpenAIService {
  constructor(private fileValidator: FileValidatorService) {}

  /**
   * Transcribes audio to text using OpenAI's Whisper model
   * @param params The transcription parameters
   * @returns The transcription result
   */
  async transcribeAudio(params: z.infer<typeof TranscribeSpeechRequestSchema>) {
    try {
      // Create a new OpenAI instance for this request
      const openai = new OpenAI({ apiKey: params.apiKey });

      // First validate and download the audio file
      const { filePath, cleanup } = await this.fileValidator.downloadAudioFile(
        params.audioUrl,
      );

      try {
        // Create transcription using the OpenAI SDK
        const transcription = await openai.audio.transcriptions.create({
          file: await fs.createReadStream(filePath),
          model: params.model,
          language: params.language,
          prompt: params.prompt,
          temperature: params.temperature,
          response_format: params.responseFormat,
        });

        return transcription;
      } finally {
        // Always clean up the temporary file
        await cleanup();
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
          throw new Error("Invalid OpenAI API key");
        }
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw error;
    }
  }
}
