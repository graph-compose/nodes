import axios from "axios";
import {
  IImageGenerationInput,
  IImageGenerationResponse,
  // IListImageGenerationsResponse,
  // IListVideoGenerationsResponse,
  IVideoGenerationInput,
  IVideoGenerationResponse,
} from "../types";

export class LumaService {
  private readonly baseUrl = "https://api.lumalabs.ai/dream-machine/v1";

  /**
   * Creates a new video generation request
   * @param apiKey Luma API key
   * @param input Video generation parameters
   * @returns Promise resolving to the video generation response
   */
  async createVideoGeneration(
    apiKey: string,
    input: IVideoGenerationInput,
  ): Promise<IVideoGenerationResponse> {
    console.log("[Luma] Creating video generation");
    console.log(apiKey);
    console.log(input);
    try {
      const response = await axios.post(`${this.baseUrl}/generations`, input, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.log("[Luma] Error creating video generation");
        console.log(JSON.stringify(error.response?.data, null, 2));
        throw new Error(
          `Luma API error: ${error.response?.data?.error || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Creates a new image generation request
   * @param apiKey Luma API key
   * @param input Image generation parameters
   * @returns Promise resolving to the image generation response
   */
  async createImageGeneration(
    apiKey: string,
    input: IImageGenerationInput,
  ): Promise<IImageGenerationResponse> {
    console.log("[Luma] Creating image generation");
    try {
      const response = await axios.post(
        `${this.baseUrl}/generations/image`,
        input,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.log("[Luma] Error creating image generation");
        console.log(JSON.stringify(error.response?.data, null, 2));
        throw new Error(
          `Luma API error: ${error.response?.data?.error || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Gets the status of a video generation
   * @param apiKey Luma API key
   * @param id Video generation ID
   * @returns Promise resolving to the video generation response
   */
  async getVideoGeneration(
    id: string,
    apiKey: string,
  ): Promise<IVideoGenerationResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/generations/${id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.log(error.message);
        console.log(error.response?.data);
        throw new Error(
          `Luma API error: ${error.response?.data?.error || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Gets the status of an image generation
   * @param apiKey Luma API key
   * @param id Image generation ID
   * @returns Promise resolving to the image generation response
   */
  async getImageGeneration(
    id: string,
    apiKey: string,
  ): Promise<IImageGenerationResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/generations/${id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.log(error.message);
        console.log(error.response?.data);
        throw new Error(
          `Luma API error: ${error.response?.data?.error || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Lists video generations
   * @param apiKey Luma API key
   * @param limit Maximum number of results to return
   * @param cursor Pagination cursor
   * @returns Promise resolving to the list video generations response
   * @deprecated This method is deprecated and will be removed.
   */
  /*
  async listVideoGenerations(
    apiKey: string,
    limit?: string,
    cursor?: string,
  ): Promise<IListVideoGenerationsResponse> {
    try {
      const params: Record<string, string> = {};
      if (limit) params.limit = limit;
      if (cursor) params.cursor = cursor;

      const response = await axios.get(`${this.baseUrl}/generations`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        params: {
          ...params,
          type: "video",
        },
      });

      return {
        data: response.data.data || [],
        has_more: response.data.has_more || false,
        next_cursor: response.data.next_cursor,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Luma API error: ${error.response?.data?.error || error.message}`,
        );
      }
      throw error;
    }
  }
  */

  /**
   * Lists image generations
   * @param apiKey Luma API key
   * @param limit Maximum number of results to return
   * @param cursor Pagination cursor
   * @returns Promise resolving to the list image generations response
   * @deprecated This method is deprecated and will be removed.
   */
  /*
  async listImageGenerations(
    apiKey: string,
    limit?: string,
    cursor?: string,
  ): Promise<IListImageGenerationsResponse> {
    try {
      const params: Record<string, string> = {};
      if (limit) params.limit = limit;
      if (cursor) params.cursor = cursor;

      const response = await axios.get(`${this.baseUrl}/generations`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        params: {
          ...params,
          type: "image",
        },
      });

      return {
        data: response.data.data || [],
        has_more: response.data.has_more || false,
        next_cursor: response.data.next_cursor,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Luma API error: ${error.response?.data?.error || error.message}`,
        );
      }
      throw error;
    }
  }
  */
}

export const lumaService = new LumaService();
