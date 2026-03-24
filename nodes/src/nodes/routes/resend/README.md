# Resend Email Integration

## 1. Introduction

This integration allows you to send emails using the Resend API through the GraphCompose platform.

Core Features:
- Send emails with HTML or plain text content.
- Include CC, BCC, and Reply-To addresses.
- Add attachments (via Base64 content or hosted path).
- Tag emails for categorization.

## 2. Authentication

Authentication is handled via a Resend API key.

- **Credentials Required:** Resend API Key
- **How to Pass:** Include the API key in the `apiKey` field within the JSON request body for the `/send` endpoint.
- Obtain your API keys from the [Resend Dashboard](https://resend.com/api-keys).

## 3. Available Endpoints

### Email

- `POST /nodes/resend/email/send` - Sends a single email.

## 4. Request and Response Examples

#### Example Request

POST /nodes/resend/email/send

```json
{
    "apiKey": "re_YOUR_API_KEY",
    "from": "Your App <noreply@yourdomain.com>",
    "to": ["recipient@example.com"],
    "subject": "Hello from GraphCompose!",
    "html": "<p>This is an email sent via the Resend node.</p>",
    "tags": [
        { "name": "source", "value": "graphcompose-node" }
    ]
}
```

#### Example Response (Success)

```json
{
    "success": true,
    "data": {
        "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"
    }
}
```

## 5. Error Handling

- If the request fails validation or if the Resend API returns an error, the endpoint will respond with a 500 status code.
- The response body will contain details about the error.

#### Example Error Response

```json
{
    "success": false,
    "message": "Failed to send email: Resend API Error: Invalid API Key (Status: 401)",
    "error": "Resend API Error: Invalid API Key (Status: 401)"
}
```

Common Errors:
- `401 Unauthorized`: Invalid API Key.
- `422 Unprocessable Entity`: Validation error (e.g., missing required field, invalid email format).
- `429 Rate Limit Exceeded`: Too many requests sent.

## 6. Additional Notes

- Ensure your sending domain is verified within your Resend account to improve deliverability.
- For attachments, provide either `content` (Base64 string) or `path` (URL).
- Refer to the official [Resend API Documentation](https://resend.com/docs/api-reference/emails/send-email) for detailed parameter information and limits.

## 7. Use of Backticks

- Use Backticks for code blocks, inline code, endpoint paths, and field names.
- Do not use Backticks for general emphasis. 