# Slack Integration

## Overview
This integration provides a seamless interface to interact with Slack's API, enabling message sending, channel management, user listing, and webhook event handling. It supports rich message formatting, threaded conversations, and secure webhook processing.

## Authentication
The integration requires the following credentials to be passed in the request headers:
- `X-Slack-Bot-Token`: Bot User OAuth Token from your Slack App
- `X-Slack-Signing-Secret`: (Optional) Signing Secret for webhook verification

Example request:
```http
POST /api/slack/messages
X-Slack-Bot-Token: xoxb-your-token
X-Slack-Signing-Secret: your-signing-secret
Content-Type: application/json

{
    "channel": "C1234567890",
    "text": "Hello from the API!"
}
```

Note: Unlike traditional implementations, this integration does not use environment variables for authentication. 
Instead, tokens must be provided with each request, allowing the API to serve multiple Slack workspaces.

## Available Endpoints

### Messages
- POST /api/slack/messages - Send a message to a channel or user
  - Supports text messages, blocks, and attachments
  - Can create threaded replies

### Conversations
- GET /api/slack/conversations - List all accessible channels and conversations

### Users
- GET /api/slack/users - List all users in the workspace

### Webhooks
- POST /api/slack/webhooks - Receive and process Slack events
  - Handles URL verification
  - Processes various event types
  - Verifies request signatures

## Request and Response Examples

### Send Message
POST /api/slack/messages
{
    "channel": "C1234567890",
    "text": "Hello from the API!",
    "blocks": [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "Hello from the *API*!"
            }
        }
    ]
}

Response:
{
    "ok": true,
    "channel": "C1234567890",
    "ts": "1234567890.123456"
}

### List Conversations
GET /api/slack/conversations

Response:
{
    "conversations": [
        {
            "id": "C1234567890",
            "name": "general",
            "is_private": false,
            "is_im": false
        }
    ]
}

### List Users
GET /api/slack/users

Response:
{
    "users": [
        {
            "id": "U1234567890",
            "name": "username",
            "real_name": "User Name",
            "is_admin": false,
            "is_bot": false
        }
    ]
}

## Error Handling
The API returns standard HTTP status codes:
- 200: Success
- 400: Invalid request (malformed data, validation error)
- 401: Authentication error
- 403: Permission denied
- 404: Resource not found
- 429: Rate limited
- 500: Server error

Error Response Format:
{
    "error": "Error message description"
}

## Additional Notes
- Rate Limiting: Follows Slack's tier-based rate limits
- Message Formatting: Supports both legacy attachments and modern block kit
- Webhook Security: Implements Slack's request signature verification
- Event Types: Handles message events, with extensibility for other event types

## Testing with Postman
1. Set up environment variables in Postman:
   - base_url: Your API base URL
   - slack_token: Your Bot User OAuth Token

2. Import the provided Postman collection for testing endpoints

3. Test without API key:
   - Use the mock server feature in Postman
   - Create example responses for each endpoint
   - Test request/response formats without actual API calls

4. Mock Server Setup:
   - Create a new mock server in Postman
   - Add example responses for each endpoint
   - Use the mock server URL for development testing

5. Example Mock Responses:

   Send Message:
   {
       "ok": true,
       "channel": "C1234567890",
       "ts": "1234567890.123456"
   }

   List Conversations:
   {
       "conversations": [
           {
               "id": "C1234567890",
               "name": "general",
               "is_private": false,
               "is_im": false
           }
       ]
   }

6. Testing Workflow:
   - Start with basic message sending
   - Test channel listing
   - Test user listing
   - Test error scenarios
   - Test webhook handling

For production testing, replace the mock server URL with your actual API endpoint and add your Slack credentials. 