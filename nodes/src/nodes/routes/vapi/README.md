# Vapi AI Voice Calling Integration

## 1. Introduction

This integration provides an interface to interact with the Vapi platform (https://vapi.ai/) for initiating outbound AI-powered voice calls. It allows you to configure and launch calls using Vapi assistants.

## 2. Authentication

- All requests require a Vapi API Key.
- Provide your API Key in the apiKey field within the main JSON request body.
- Obtain your API Key from the Vapi Dashboard: https://dashboard.vapi.ai/
- The integration automatically handles formatting this key into the required Authorization: Bearer <token> header for the Vapi API.

## 3. Available Endpoints

### Calls

- POST /nodes/vapi/call/create - Initiates a new outbound AI voice call.

## 4. Request and Response Examples

### Create Outbound Call

Initiates an outbound call using the specified customer details, Twilio phone number, and assistant configuration.

#### Example Request
POST /nodes/vapi/call/create
```json
{
  "apiKey": "YOUR_VAPI_API_KEY",
  "customer": {
    "number": "+10000000000"
  },
  "phoneNumber": {
    "twilioAccountSid": "AC00000000000000000000000000000000",
    "twilioAuthToken": "YOUR_TWILIO_AUTH_TOKEN",
    "twilioPhoneNumber": "+10000000000"
  },
  "assistant": {
    "firstMessage": "Hi, I'm an AI assistant calling from Example Corp. How are you today?",
    "endCallMessage": "Thanks for your time. Goodbye!",
    "model": {
      "provider": "openai",
      "model": "gpt-4",
      "tools": [ 
        { "type": "endCall" } 
      ] // Example of passthrough
    },
    "voice": {
      "provider": "11labs",
      "voiceId": "kdmDKE6EkgrWrrykO9Qt"
    },
    "transcriber": {
      "provider": "deepgram",
      "model": "nova-2",
      "language": "en-GB"
    },
    "metadata": { // Example of passthrough
        "campaignId": "xyz123"
    }
  },
  "systemPrompt": "You are a friendly AI assistant from Example Corp calling to follow up on a recent inquiry. Your goal is to understand the customer's needs and schedule a follow-up meeting if appropriate. Keep the conversation concise and professional."
}
```

#### Example Success Response (200 OK)

Note: Vapi's API returns 201 Created, but this node returns 200 OK with the standard success wrapper.

```json
{
  "success": true,
  "data": {
    "id": "2b3a1723-f684-457b-a80d-e05c3df8bac7",
    "status": "queued", // Or "scheduled"
    "type": "outboundPhoneCall",
    "createdAt": "2025-04-06T17:37:51.309Z",
    // ... other fields returned by Vapi API are included here due to passthrough ...
    "orgId": "bab36701-293c-4560-9c92-5f7d30c8870d",
    "cost": 0,
    "assistant": { /* ... Vapi assistant details ... */ },
    "phoneNumber": { /* ... Vapi phone number details ... */ },
    "customer": { /* ... Vapi customer details ... */ },
    "phoneCallProvider": "twilio",
    "monitor": { /* ... monitor URLs ... */ }
  }
}
```

## 5. Error Handling

- If the request fails due to invalid input, API key issues, Vapi API errors (e.g., invalid parameters, insufficient credits), or internal server errors, the endpoint will return a 500 Internal Server Error status code.
- The response body will follow the standard error format:

```json
{
  "success": false,
  "message": "Failed to create Vapi call.",
  "error": {
       "details": "Vapi API request failed: <Specific error message from Vapi or validation>"
   }
}
```

## 6. Additional Notes

- **System Prompt:** The systemPrompt field in the request is a convenience field that maps directly to the assistant.model.messages array required by Vapi. It should contain the core instructions for the AI assistant.
- **Passthrough Configuration:** The schemas for customer, phoneNumber, and assistant (including nested model, voice, transcriber) use passthrough. This allows you to include any additional valid Vapi configuration fields not explicitly defined in our simplified schemas. Refer to the official Vapi API documentation (https://docs.vapi.ai/api-reference/calls/create) for all available options.
- **Asynchronous Nature:** Creating a call is synchronous, but the call itself progresses asynchronously. You would typically use Vapi webhooks or polling mechanisms (if available through their API, though not implemented in this node yet) to track the call status and outcome. 