import axios from "axios";
import FormData from "form-data";
import { appConfig } from "../../../../utils/appConfig";
import { StorageService } from "../../../services/storage.service";

const storageService = new StorageService({
  bucketName: appConfig.gcp.storage.bucketName,
  projectId: appConfig.gcp.projectId,
});

// Define the expected options type for convertVoiceFromUrl, mirroring VoiceChangerUrlRequestSchema options
type ConvertVoiceUrlOptions = {
  modelId?: string;
  voiceSettings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  outputFormat?: string;
  optimizeStreamingLatency?: number;
  seed?: number;
  removeBackgroundNoise?: boolean;
};

/**
 * Parses an ElevenLabs error response from an arraybuffer.
 * ElevenLabs returns errors as JSON even when the success responseType is arraybuffer.
 * Examples:
 *   {"detail": {"status": "quota_exceeded", "message": "..."}}
 *   {"detail": "Invalid API key. Please check your API key and try again."}
 */
function parseElevenLabsError(axiosError: any): string {
  try {
    if (axiosError.response?.data) {
      const raw = Buffer.isBuffer(axiosError.response.data)
        ? axiosError.response.data
        : Buffer.from(axiosError.response.data);
      const text = raw.toString("utf-8");
      const parsed = JSON.parse(text);
      const detail = parsed?.detail;
      if (typeof detail === "string") return detail;
      if (typeof detail?.message === "string") return `[${detail.status ?? "error"}] ${detail.message}`;
      if (typeof detail?.status === "string") return detail.status;
      return text;
    }
  } catch {
    // fall through to generic message
  }
  return axiosError.message ?? "Unknown ElevenLabs error";
}

export class ElevenLabsService {
  private readonly baseUrl = "https://api.elevenlabs.io/v1";

  /**
   * Generates speech from text using ElevenLabs API
   * @param apiKey ElevenLabs API key
   * @param text Text to convert to speech
   * @param voiceId ID of the voice to use
   * @param options Additional options for speech generation
   * @returns Promise resolving to the audio information
   */
  async generateSpeech(
    apiKey: string,
    text: string,
    voiceId: string,
    options: {
      modelId?: string;
      voiceSettings?: {
        stability?: number;
        similarity_boost?: number;
        style?: number;
        use_speaker_boost?: boolean;
      };
      outputFormat?: string;
      optimizeStreamingLatency?: number;
    } = {},
  ) {
    console.log("[ElevenLabs] Generating speech from text");
    try {
      // Prepare request URL with query parameters
      let url = `${this.baseUrl}/text-to-speech/${voiceId}`;
      if (options.outputFormat) {
        url += `?output_format=${options.outputFormat}`;
      }
      if (options.optimizeStreamingLatency !== undefined) {
        url += `${url.includes("?") ? "&" : "?"}optimize_streaming_latency=${
          options.optimizeStreamingLatency
        }`;
      }

      // Prepare request body
      const requestBody: any = {
        text,
        model_id: options.modelId || "eleven_monolingual_v1",
      };

      if (options.voiceSettings) {
        requestBody.voice_settings = options.voiceSettings;
      }

      // Make the API request
      const response = await axios.post(url, requestBody, {
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      });

      // Upload to storage and get public URL
      const audioUrl = await storageService.uploadFile(
        Buffer.from(response.data),
        response.headers["content-type"] || "audio/mpeg",
        "elevenlabs-tts",
      );

      console.log("[ElevenLabs] Speech generated successfully");

      return {
        audioUrl,
        format: options.outputFormat || "mp3_44100_128",
        generationId: response.headers["x-request-id"] || Date.now().toString(),
        contentType: response.headers["content-type"],
        contentLength: response.headers["content-length"],
      };
    } catch (error: any) {
      const detail = parseElevenLabsError(error);
      console.error(`[ElevenLabs] Error generating speech (${error.response?.status ?? "network"}): ${detail}`);
      throw new Error(`ElevenLabs API error (${error.response?.status ?? "network"}): ${detail}`);
    }
  }

  /**
   * Generates a sound effect from text description using ElevenLabs API
   * @param apiKey ElevenLabs API key
   * @param text Text description of the desired sound effect
   * @param options Additional options for sound generation
   * @returns Promise resolving to the audio information
   */
  async generateSoundEffect(
    apiKey: string,
    text: string,
    options: {
      duration_seconds?: number;
      prompt_influence?: number;
      outputFormat?: string;
    } = {},
  ) {
    console.log("[ElevenLabs] Generating sound effect from text description");
    try {
      // Prepare request URL with query parameters
      let url = `${this.baseUrl}/sound-generation`;
      if (options.outputFormat) {
        url += `?output_format=${options.outputFormat}`;
      }

      // Prepare request body
      const requestBody: any = {
        text,
      };

      if (options.duration_seconds !== undefined) {
        requestBody.duration_seconds = options.duration_seconds;
      }

      if (options.prompt_influence !== undefined) {
        requestBody.prompt_influence = options.prompt_influence;
      }

      // Make the API request
      const response = await axios.post(url, requestBody, {
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      });

      // Upload to storage and get public URL
      const audioUrl = await storageService.uploadFile(
        Buffer.from(response.data),
        response.headers["content-type"] || "audio/mpeg",
        "elevenlabs-sfx",
      );

      console.log("[ElevenLabs] Sound effect generated successfully");

      return {
        audioUrl,
        format: options.outputFormat || "mp3_44100_128",
        generationId: response.headers["x-request-id"] || Date.now().toString(),
        contentType: response.headers["content-type"],
        contentLength: response.headers["content-length"],
      };
    } catch (error: any) {
      const detail = parseElevenLabsError(error);
      console.error(`[ElevenLabs] Error generating sound effect (${error.response?.status ?? "network"}): ${detail}`);
      throw new Error(`ElevenLabs API error (${error.response?.status ?? "network"}): ${detail}`);
    }
  }

  /**
   * Converts audio from one voice to another using ElevenLabs API
   * @param apiKey ElevenLabs API key
   * @param voiceId ID of the target voice
   * @param audioBuffer Audio file buffer
   * @param options Additional options for voice conversion
   * @returns Promise resolving to the audio information
   */
  async convertVoice(
    apiKey: string,
    voiceId: string,
    audioBuffer: Buffer,
    options: {
      modelId?: string;
      voiceSettings?: {
        stability?: number;
        similarity_boost?: number;
        style?: number;
        use_speaker_boost?: boolean;
      };
      outputFormat?: string;
      optimizeStreamingLatency?: number;
      seed?: number;
      removeBackgroundNoise?: boolean;
    } = {},
  ) {
    console.log("[ElevenLabs] Converting voice");
    try {
      // Prepare request URL with query parameters
      let url = `${this.baseUrl}/speech-to-speech/${voiceId}`;
      const queryParams = [];

      if (options.outputFormat) {
        queryParams.push(`output_format=${options.outputFormat}`);
      }
      if (options.optimizeStreamingLatency !== undefined) {
        queryParams.push(
          `optimize_streaming_latency=${options.optimizeStreamingLatency}`,
        );
      }
      if (options.removeBackgroundNoise !== undefined) {
        queryParams.push(
          `remove_background_noise=${options.removeBackgroundNoise}`,
        );
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append("audio", audioBuffer, {
        filename: "input.mp3",
        contentType: "audio/mpeg",
      });

      if (options.modelId) {
        formData.append("model_id", options.modelId);
      }

      if (options.voiceSettings) {
        formData.append(
          "voice_settings",
          JSON.stringify(options.voiceSettings),
        );
      }

      if (options.seed !== undefined) {
        formData.append("seed", options.seed.toString());
      }

      // Make the API request
      const response = await axios.post(url, formData, {
        headers: {
          "xi-api-key": apiKey,
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer",
      });

      // Upload to storage and get public URL
      const audioUrl = await storageService.uploadFile(
        Buffer.from(response.data),
        response.headers["content-type"] || "audio/mpeg",
        "elevenlabs-voice-changer",
      );

      console.log("[ElevenLabs] Voice conversion successful");

      return {
        audioUrl,
        format: options.outputFormat || "mp3_44100_128",
        generationId: response.headers["x-request-id"] || Date.now().toString(),
        contentType: response.headers["content-type"],
        contentLength: response.headers["content-length"],
      };
    } catch (error: any) {
      const detail = parseElevenLabsError(error);
      console.error(`[ElevenLabs] Error converting voice (${error.response?.status ?? "network"}): ${detail}`);
      throw new Error(`ElevenLabs API error (${error.response?.status ?? "network"}): ${detail}`);
    }
  }

  /**
   * Downloads audio from a URL and converts it using ElevenLabs API
   * @param apiKey ElevenLabs API key
   * @param voiceId ID of the target voice
   * @param audioUrl URL of the audio file to download and convert
   * @param options Additional options for voice conversion
   * @returns Promise resolving to the converted audio information
   */
  async convertVoiceFromUrl(
    apiKey: string,
    voiceId: string,
    audioUrl: string,
    options: ConvertVoiceUrlOptions = {},
  ): Promise<any> {
    // Consider defining a specific return type matching AudioResultDataSchema
    console.log(`[ElevenLabs] Downloading audio from URL: ${audioUrl}`);
    let audioBuffer: Buffer;
    let inputContentType: string | undefined;

    // 1. Download the audio file
    try {
      const downloadResponse = await axios.get(audioUrl, {
        responseType: "arraybuffer",
        // Add timeout and potentially size limits
        timeout: 15000, // 15 seconds timeout for download
        maxContentLength: 50 * 1024 * 1024, // 50MB limit (adjust as needed)
        headers: {
          Accept: "audio/*", // Indicate preference for audio
        },
      });
      audioBuffer = Buffer.from(downloadResponse.data);
      inputContentType = downloadResponse.headers["content-type"];
      console.log(
        `[ElevenLabs] Audio downloaded successfully (${audioBuffer.length} bytes, type: ${inputContentType})`,
      );

      // Basic validation: Check if content type seems like audio
      if (!inputContentType || !inputContentType.startsWith("audio/")) {
        console.warn(
          "[ElevenLabs] Downloaded file Content-Type is not audio:",
          inputContentType,
        );
        // Decide whether to proceed or throw error - let's proceed cautiously
      }
    } catch (downloadError: any) {
      console.error(
        "[ElevenLabs] Error downloading audio from URL:",
        downloadError,
      );
      if (axios.isAxiosError(downloadError)) {
        if (downloadError.code === "ECONNABORTED") {
          throw new Error("Audio download timed out.");
        }
        if (downloadError.response) {
          throw new Error(
            `Failed to download audio. Status: ${downloadError.response.status} - ${downloadError.response.statusText}`,
          );
        }
      }
      throw new Error("Failed to download audio from the provided URL.");
    }

    console.log("[ElevenLabs] Converting downloaded voice");
    // 2. Forward the downloaded buffer to the existing convertVoice method (or directly call API)
    // Reusing convertVoice is simpler if the logic is identical
    try {
      // Use the existing method to handle the API call with the buffer
      const result = await this.convertVoice(apiKey, voiceId, audioBuffer, {
        ...options,
        // Pass necessary info like filename/contentType if convertVoice needs it
        // It seems convertVoice currently hardcodes filename/contentType, which is okay here
      });

      console.log("[ElevenLabs] Voice conversion from URL successful");
      return result;
    } catch (conversionError: any) {
      console.error(
        "[ElevenLabs] Error during voice conversion step (after download):",
        conversionError,
      );
      // Re-throw the error from convertVoice, which should be descriptive
      throw conversionError;
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
