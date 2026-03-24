import axios from "axios";
import type { z } from "zod"; // Import z type for inference
import {
  ScrapeRequestSchema,
  ScrapeResultDataSchema,
} from "../schemas/firecrawlSchemas"; // Adjusted path

// Infer types from Zod schemas
type ScrapeRequest = z.infer<typeof ScrapeRequestSchema>;
type ScrapeResult = z.infer<typeof ScrapeResultDataSchema>;

// Define the parameters for the scrapeWebpage method, excluding apiKey
type ScrapeWebpageParams = Omit<ScrapeRequest, "apiKey">;

export class FirecrawlService {
  private readonly baseUrl = "https://api.firecrawl.dev/v1";

  /**
   * Scrapes a webpage using the Firecrawl API /scrape endpoint.
   * @param apiKey Firecrawl API key.
   * @param scrapeData Scrape request data including URL and optional parameters.
   * @returns Promise resolving to the scraped data conforming to ScrapeResultDataSchema.
   */
  async scrapeWebpage(
    apiKey: string,
    scrapeData: ScrapeWebpageParams,
  ): Promise<ScrapeResult> {
    console.log(
      `[FirecrawlService] Starting scrape for URL: ${scrapeData.url}`,
    );

    try {
      const requestBody = {
        url: scrapeData.url,
        ...(scrapeData.params ?? {}), // Spread optional params object
      };

      console.log(
        "[FirecrawlService] Sending scrape request with body:",
        JSON.stringify(requestBody, null, 2),
      ); // Log the actual request body sent

      const response = await axios.post(`${this.baseUrl}/scrape`, requestBody, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        // Consider adding a reasonable timeout for the request itself
        // timeout: 60000, // e.g., 60 seconds
      });

      const result = response.data;

      // Check for explicit failure in the response body
      if (result && typeof result === "object" && result.success === false) {
        const errorMessage =
          result.error || result.message || "Unknown Firecrawl API error";
        console.error(
          `[FirecrawlService] Firecrawl API returned failure: ${errorMessage}`,
          result,
        );
        throw new Error(`Firecrawl API Error: ${errorMessage}`);
      }

      // Extract the core data, expected under the 'data' key
      const scrapedData = result?.data;

      if (!scrapedData) {
        console.error(
          "[FirecrawlService] Firecrawl API response missing expected 'data' field.",
          result,
        );
        throw new Error(
          "Firecrawl API response structure invalid: Missing 'data' field.",
        );
      }

      console.log(
        `[FirecrawlService] Scrape successful. Status code from metadata: ${scrapedData.metadata?.statusCode}`,
      );

      // Validate the extracted data against our schema
      const validatedData = ScrapeResultDataSchema.parse(scrapedData);
      return validatedData;
    } catch (error: unknown) {
      // Log the raw error structure for debugging
      console.error(
        "[FirecrawlService] Error during scrapeWebpage execution:",
        JSON.stringify(error, null, 2),
      );

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const responseData = error.response?.data;

        // Construct a detailed error message from the Axios response
        let detailMessage = `Status Code: ${statusCode || "N/A"}.`;
        if (responseData) {
          // Try to extract Firecrawl's specific error/message field
          const apiError = responseData.error || responseData.message;
          if (apiError) {
            detailMessage += ` Firecrawl Message: ${JSON.stringify(apiError)}.`;
          } else {
            // Fallback to stringifying the whole response data if specific fields aren't found
            detailMessage += ` Response Body: ${JSON.stringify(responseData)}.`;
          }
        }
        // Append Axios's own message if available and not redundant
        if (error.message && !detailMessage.includes(error.message)) {
          detailMessage += ` Axios Message: ${error.message}.`;
        }

        console.error(
          `[FirecrawlService] Axios Error Details: ${detailMessage}`,
        );

        // Throw a new error with a user-friendly prefix and detailed info
        let userMessage = "Firecrawl API request failed.";
        switch (statusCode) {
          case 400:
            userMessage = `Invalid request to Firecrawl.`;
            break;
          case 401:
            userMessage = "Invalid Firecrawl API key.";
            break;
          case 403: // Assuming 403 might be permission/plan related
            userMessage =
              "Permission denied by Firecrawl. Check your API key or plan.";
            break;
          case 429:
            userMessage = "Firecrawl rate limit exceeded.";
            break;
          case 500:
            userMessage = "Firecrawl internal server error.";
            break;
          // Add other specific status codes as needed
        }
        // Append the detailed message for internal logging/debugging purposes
        throw new Error(`${userMessage} Details: ${detailMessage}`);
      } else if (error instanceof Error) {
        // Handle Zod validation errors or other standard errors
        console.error(
          `[FirecrawlService] Standard Error: ${error.message}`,
          error.stack,
        );
        throw new Error(`Internal processing error: ${error.message}`);
      } else {
        // Handle unexpected error types
        console.error("[FirecrawlService] Unexpected error type:", error);
        throw new Error(
          "An unexpected error occurred during the Firecrawl operation.",
        );
      }
    }
  }
}

export const firecrawlService = new FirecrawlService();
