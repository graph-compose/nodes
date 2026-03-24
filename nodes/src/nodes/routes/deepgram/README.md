# Deepgram Text-to-Speech Integration

## 1. Introduction

This integration allows you to synthesize speech from text using Deepgram's Aura Text-to-Speech API via the GraphCompose platform.

Core Features:
- Generate high-quality audio from text using various Deepgram voice models.
- Configure audio output format (encoding, container, sample rate, bit rate).
- Synchronous operation: provides a URL to the generated audio file upon completion.

## 2. Authentication

Authentication uses a Deepgram API Key.

- **Credentials Required:** Deepgram API Key
- **How to Pass:** Include the API key in the `apiKey` field within the JSON request body for the `/speak` endpoint.
- Obtain your API keys from the [Deepgram Console](https://console.deepgram.com/project/api-keys).

## 3. Available Endpoints

### Text-to-Speech

- `POST /nodes/deepgram/speak` - Synthesizes speech from text and returns a URL to the generated audio file.

## 4. Workflow (Synchronous)

1.  **Submit Request:** Send a POST request to `/nodes/deepgram/speak` with your `apiKey`, the `text` to synthesize, and any optional configuration parameters (`model`, `encoding`, `container`, etc.).
2.  **Process Request:** The GraphCompose node calls the Deepgram API, receives the audio stream, and uploads it to cloud storage.
3.  **Receive Result:** If successful (200 OK), the response will be a JSON object containing the `audioUrl` (link to the file in cloud storage) and metadata about the request (e.g., model used, character count).
    ```json
    {
        "success": true,
        "data": {
            "audioUrl": "https://storage.googleapis.com/your-bucket/deepgram-tts-....mp3",
            "contentType": "audio/mpeg",
            "requestId": "bf6fc5c7-8f84-479f-b70a-602cf5bf18f3",
            "modelName": "aura-asteria-en",
            "modelUuid": "e4979ab0-8475-4901-9d66-0a562a4949bb",
            "charCount": "41"
        }
    }
    ```
4.  **Handle Failure:** If any step fails (validation, Deepgram API error, storage upload error), the endpoint will respond with a 500 status code and error details.

## 5. Request and Response Examples

#### Example Request

POST /nodes/deepgram/speak

```json
{
    "apiKey": "YOUR_DEEPGRAM_API_KEY",
    "text": "Hello from GraphCompose using Deepgram!",
    "model": "aura-asteria-en",
    "container": "mp3"
}
```

#### Example Response (Success)

```json
{
    "success": true,
    "data": {
        "audioUrl": "https://storage.googleapis.com/your-bucket-name/deepgram-tts/deepgram-tts-bf6fc5c7-8f84-479f-b70a-602cf5bf18f3.mp3",
        "contentType": "audio/mpeg",
        "requestId": "bf6fc5c7-8f84-479f-b70a-602cf5bf18f3",
        "modelName": "aura-asteria-en",
        "modelUuid": "e4979ab0-8475-4901-9d66-0a562a4949bb",
        "charCount": "41"
    }
}
```

## 6. Error Handling

- If the request fails validation, the Deepgram API call fails, or the storage upload fails, the endpoint will respond with a 500 status code.
- The response body will contain details about the error.

#### Example Error Response

```json
{
    "success": false,
    "message": "Failed to synthesize speech: Deepgram API Error (synthesizeSpeech): Invalid API Key provided. (Status: 401)",
    "error": "Deepgram API Error (synthesizeSpeech): Invalid API Key provided. (Status: 401)"
}
```

## 7. Additional Notes

- The maximum input `text` length is 2000 characters per request.
- Refer to the [Deepgram Text-to-Speech Documentation](https://developers.deepgram.com/docs/text-to-speech) for available voice models, encoding/container options, and other parameters.
- Ensure the cloud storage bucket specified in the application configuration (`appConfig.gcp.storage.bucketName`) is correctly set up and accessible. 