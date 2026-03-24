# SendGrid Node

This node integrates with the SendGrid API to send emails.

## Overview
The SendGrid node allows sending emails with options like CC, BCC, attachments, and scheduled delivery.

## Authentication
Requires a SendGrid API key passed in the `apiKey` field of the request body for the `/send` endpoint.

## Endpoints

### `POST /send`
Sends an email.

**Request Body:** See `POST /openapi.json` schema (`SendEmailRequestSchema`).
Key fields:
- `apiKey`: Your SendGrid API key.
- `from`: Sender email object (`{ email, name? }`).
- `to`: Array of primary recipient objects.
- `subject`: Email subject.
- `text` / `html`: Email body content (at least one required).
- Optional fields: `cc`, `bcc`, `attachments`, `replyTo`, `sendAt`.

**Responses:**
- **200 OK:** Email successfully queued. See `POST /openapi.json` schema (`SendEmailResponseSchema`). Includes `{ success: true, data: { messageId } }`.
- **400 Bad Request:** Invalid input. See `POST /openapi.json` schema (`ApiErrorResponseSchema`).
- **500 Internal Server Error:** SendGrid API error or server issue. See `POST /openapi.json` schema (`ApiErrorResponseSchema`).

### `POST /openapi.json`
Retrieves the OpenAPI specification (version 3.1.0) for this node, including detailed schema definitions and metadata.

**Request Body:** None

**Responses:**
- **200 OK:** Returns the JSON OpenAPI document.

## Examples

### Send Email Request Example

`POST /send`
```json
{
  "apiKey": "SG.your_sendgrid_api_key",
  "from": {
    "email": "sender@example.com",
    "name": "Sender Name"
  },
  "to": [
    {
      "email": "recipient@example.com",
      "name": "Recipient Name"
    }
  ],
  "subject": "Test Email Subject",
  "html": "<p>This is an HTML email body</p>"
}
```

### Send Email Success Response Example

```json
{
  "success": true,
  "data": {
    "messageId": "unique-message-id-from-sendgrid"
  }
}
```

### Error Response Example

```json
{
  "success": false,
  "message": "Failed to send email.",
  "error": {
      "details": "SendGrid API error: Specific error message from SendGrid."
  }
}
```

## Notes
- Attachment content (`content` field) must be Base64 encoded.
- Ensure the API key has `mail.send` permission in SendGrid. 