import axios from "axios";
import { z } from "zod";
import {
  SendEmailRequestSchema,
  SendEmailResultDataSchema,
} from "../schemas/emailSchemas";

// Define types based on Zod schemas for better clarity
type SendEmailParams = z.infer<typeof SendEmailRequestSchema>;
type SendEmailResult = z.infer<typeof SendEmailResultDataSchema>;

// Resend API endpoint URL
const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Sends an email using the Resend REST API.
 * @param params - The email parameters including authentication and email details.
 * @returns The relevant data from the Resend API response on success.
 * @throws Standardized error if the API call fails.
 */
export async function sendEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  // Extract API key and the rest of the parameters matching the Zod schema
  const { apiKey, ...emailData } = params;

  try {
    // Make the POST request using axios
    const response = await axios.post<SendEmailResult>( // Expect the response data to match our Result schema
      RESEND_API_URL,
      emailData, // Send the Zod-validated data (excluding apiKey)
      {
        headers: {
          Authorization: `Bearer ${apiKey}`, // Use Bearer token auth
          "Content-Type": "application/json",
        },
      },
    );

    // Basic check if the expected 'id' is present in the response data
    if (!response.data || !response.data.id) {
      console.error(
        "[ResendService] Unexpected success response format from API:",
        response.data,
      );
      throw new Error("Resend API returned an unexpected success format.");
    }

    // The response.data should conform to SendEmailResultDataSchema due to axios typing
    // and the .passthrough() in the schema handles any extra fields.
    console.log(
      "[ResendService] Email sent successfully via REST:",
      response.data.id,
    );
    return response.data;
  } catch (error: unknown) {
    // Log the raw error for debugging
    console.error("[ResendService] Error calling Resend REST API:", error);

    // Handle Axios-specific errors
    if (axios.isAxiosError(error) && error.response) {
      // Try to extract error details from Resend's response body
      const errorData = error.response.data as {
        name?: string;
        message?: string;
        statusCode?: number;
      }; // Type assertion for Resend error structure
      const errorMessage = errorData?.message || "Unknown Resend API error";
      const errorName = errorData?.name || "ResendApiError";
      const statusCode = errorData?.statusCode || error.response.status;

      console.error(
        `[ResendService] Resend API Error (${statusCode}): ${errorName} - ${errorMessage}`,
        errorData,
      );
      // Throw a standardized error for the controller
      throw new Error(`Resend API Error (${statusCode}): ${errorMessage}`);
    } else if (error instanceof Error) {
      // Handle other types of errors (e.g., network issues before response)
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    } else {
      // Handle non-Error objects thrown
      throw new Error(
        "An unknown error occurred while contacting the Resend API.",
      );
    }
  }
}
