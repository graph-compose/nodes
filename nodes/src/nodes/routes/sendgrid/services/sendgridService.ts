import sgMail, { MailDataRequired } from "@sendgrid/mail";
// import { IEmailData } from "../types"; // Removed old type import
import { SendEmailData } from "../schemas/sendgridSchemas"; // Import type from new schema file

// Define the structure for the core result data returned by the service
interface SendEmailResult {
  messageId: string;
}

export class SendGridService {
  /**
   * Sends an email using SendGrid API
   * @param apiKey SendGrid API key
   * @param emailData Email data including from, to, subject, content, etc.
   * @returns Promise resolving to the core result data ({ messageId })
   */
  async sendEmail(
    apiKey: string,
    emailData: SendEmailData,
  ): Promise<SendEmailResult> {
    console.log(
      `[SendGrid] Preparing to send email from ${JSON.stringify(
        emailData.from,
        null,
        2,
      )} to ${JSON.stringify(emailData.to, null, 2)}`,
    );

    // Set the API key
    sgMail.setApiKey(apiKey);

    // Create content array
    const content: MailDataRequired["content"] = [];

    // Add text content if provided
    if (emailData.text) {
      content.push({
        type: "text/plain",
        value: emailData.text,
      });
      console.log("[SendGrid] Added text/plain content");
    }

    // Add HTML content if provided
    if (emailData.html) {
      content.push({
        type: "text/html",
        value: emailData.html,
      });
      console.log("[SendGrid] Added text/html content");
    }

    // If no content was provided, add a default empty text content
    if (content.length === 0) {
      content.push({
        type: "text/plain",
        value: "",
      });
      console.log("[SendGrid] No content provided, added empty text content");
    }

    // Log attachments if present
    if (emailData.attachments?.length) {
      console.log(
        `[SendGrid] Including ${emailData.attachments.length} attachment(s)`,
      );
    }

    // Log scheduled time if present
    if (emailData.sendAt) {
      console.log(
        `[SendGrid] Email scheduled for: ${new Date(
          emailData.sendAt,
        ).toISOString()}`,
      );
    }

    // Prepare the message
    const msg = {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      content,
      cc: emailData.cc,
      bcc: emailData.bcc,
      attachments: emailData.attachments,
      replyTo: emailData.replyTo,
      sendAt: emailData.sendAt,
    } as sgMail.MailDataRequired;

    console.log("[SendGridService] Message:", JSON.stringify(msg, null, 2));

    try {
      console.log("[SendGridService] Attempting to send email...");
      // Send the email
      const [response] = await sgMail.send(
        msg satisfies sgMail.MailDataRequired,
      );

      const messageId = response.headers["x-message-id"];

      if (!messageId) {
        console.error(
          "[SendGridService] SendGrid response missing x-message-id header.",
        );
        throw new Error(
          "Failed to retrieve message ID from SendGrid response.",
        );
      }

      const result: SendEmailResult = {
        messageId: messageId,
      };

      console.log(
        `[SendGridService] Email sent successfully! Message ID: ${result.messageId}, Status: ${response.statusCode}`,
      );
      return result;
    } catch (error: unknown) {
      // Handle SendGrid API errors
      if (error && typeof error === "object" && "response" in error) {
        const sendGridError = error as {
          response: { body: { errors: { message: string }[] } };
        };
        const errorMessage = sendGridError.response.body.errors
          .map((e) => e.message)
          .join(", ");
        console.error(`[SendGridService] API Error: ${errorMessage}`);
        throw new Error(`SendGrid API error: ${errorMessage}`);
      }
      console.error("[SendGridService] Unexpected error:", error);
      throw error;
    }
  }
}

export const sendgridService = new SendGridService();
