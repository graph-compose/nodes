import twilio from "twilio";
import type { SendSmsRequest, SmsResultData } from "../schemas/twilioSchemas"; // Import types for params and return

class TwilioMessageService {
  /**
   * Sends an SMS message using Twilio
   * @param params Object containing accountSid, authToken, to, from, message
   * @returns Promise resolving to the structured message details
   */
  async sendSms(params: SendSmsRequest): Promise<SmsResultData> {
    const { accountSid, authToken, to, from, message } = params;
    console.log("[TwilioService] Sending SMS message");

    try {
      // Initialize the Twilio client with credentials
      const client = twilio(accountSid, authToken);

      // Send the message
      const response = await client.messages.create({
        body: message,
        to: to,
        from: from,
      });

      console.log("[TwilioService] Message sent successfully");
      console.log(`[TwilioService] Message SID: ${response.sid}`);

      // Transform the response to match SmsResultDataSchema
      // Explicitly convert types where needed to match the inferred type after schema transformations
      const resultData: SmsResultData = {
        sid: response.sid,
        status: response.status as SmsResultData["status"], // Cast status to expected enum
        dateCreated: response.dateCreated.toISOString(), // Convert Date to ISO string
        dateUpdated: response.dateUpdated.toISOString(), // Convert Date to ISO string
        to: response.to,
        from: response.from,
        // Any other fields returned by Twilio will be handled by .passthrough()
        // If specific optional fields are needed, map them here, e.g.:
        // errorCode: response.errorCode,
        // errorMessage: response.errorMessage,
      };

      return resultData;
    } catch (error: any) {
      console.error("[TwilioService] Error sending SMS message:", error);

      // Enhance error message for common issues
      let errorMessage = error.message;
      if (error.code === 21211) {
        errorMessage = `Invalid 'To' phone number: ${to}`;
      } else if (error.code === 21606) {
        errorMessage = `Invalid 'From' phone number: ${from}. Ensure it is a valid Twilio number you own.`;
      } else if (error.code === 20003) {
        errorMessage =
          "Authentication failed. Verify your Account SID and Auth Token.";
      } else if (error.status === 400) {
        // General bad request, often number format or missing required fields
        errorMessage = `Bad request (${error.code}): ${error.message}`;
      }

      // Throw a new error with a more structured message, which the controller will catch.
      throw new Error(`Twilio API error: ${errorMessage}`);
    }
  }
}

// Export a singleton instance of the service
export const twilioMessageService = new TwilioMessageService();
