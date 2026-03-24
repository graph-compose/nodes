import { Request, Response } from "express";
import type { z } from "zod";
import {
  ScrapeRequestSchema,
  ScrapeResponseSchema, // We'll use this to type the success response
} from "../schemas/firecrawlSchemas";
import { firecrawlService } from "../services/firecrawlService";

// Infer the type for the validated request body
type ScrapeRequestValidatedBody = z.infer<typeof ScrapeRequestSchema>;

/**
 * Controller to handle the /scrape endpoint.
 * Calls the Firecrawl service after middleware validation.
 */
export const handleScrape = async (
  req: Request<
    Record<string, never>,
    unknown,
    ScrapeRequestValidatedBody // Use the inferred type for req.body
  >,
  res: Response,
) => {
  // Input is validated by middleware
  const { apiKey, url, params } = req.body;

  try {
    console.log(`[FirecrawlController] Received scrape request for: ${url}`);

    // Construct the object expected by the service method
    const serviceParams = { url, params };

    // Call the service
    const scrapeResult = await firecrawlService.scrapeWebpage(
      apiKey,
      serviceParams,
    );

    console.log(
      `[FirecrawlController] Scrape successful for ${url}. Formatting response.`,
    );

    // Format the successful response according to the standard
    const responsePayload: z.infer<typeof ScrapeResponseSchema> = {
      success: true,
      message: "Scrape successful",
      data: scrapeResult,
    };

    res.json(responsePayload);
  } catch (error: unknown) {
    // Log the error with context
    console.error(
      `[FirecrawlController] Error during scrape for ${url}:`,
      error instanceof Error ? error.message : JSON.stringify(error),
    );

    // Use the error message constructed by the service layer
    const message =
      error instanceof Error
        ? error.message // This will now include the detailed info from the service
        : "An unexpected error occurred during the scrape operation.";

    // Send standardized error response
    res.status(500).json({
      success: false,
      // Keep the user-facing message relatively simple
      message: "Failed to complete the scrape operation.",
      error: {
        details: message, // Provide the detailed message here
      },
    });
  }
};
