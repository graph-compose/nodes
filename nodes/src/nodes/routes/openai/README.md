# OpenAI Integration

## 1. Introduction

This integration provides interfaces to interact with various OpenAI APIs, including:
- Audio Transcription (Whisper)
- Image Analysis (Vision - GPT-4o)

## 2. Authentication

- All requests require an OpenAI API Key.
- Provide your API Key in the `apiKey` field within the main JSON request body for each endpoint.
- Obtain your API Key from the OpenAI Platform: https://platform.openai.com/api-keys

## 3. Available Endpoints

### Audio Transcription

- `POST /nodes/openai/speech-to-text/transcribe` - Transcribes audio from a URL using the Whisper model.

### Vision

- `POST /nodes/openai/vision/analyze-image` - Analyzes an image from a URL using a GPT vision model.

## 4. Request and Response Examples

### Transcribe Audio (Whisper)

Transcribes audio from a URL.

#### Example Request

```json
POST /nodes/openai/speech-to-text/transcribe
{
  "apiKey": "YOUR_OPENAI_API_KEY",
  "audioUrl": "https://example.com/audio.mp3",
  "model": "whisper-1",
  "language": "en",
  "responseFormat": "json"
}
```

#### Example Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "text": "This is the transcribed text from the audio file."
    // Other fields like language, duration, segments might be included depending on responseFormat
  }
}
```

### Analyze Image (Vision)

Analyzes an image from a URL using GPT-4o (default).

#### Example Request

```json
POST /nodes/openai/vision/analyze-image
{
  "apiKey": "YOUR_OPENAI_API_KEY",
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "What are the main colors present in this image? Provide hex codes."
}
```

#### Example Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "analysis": "The main colors appear to be blue (#0000FF), green (#00FF00), and white (#FFFFFF).",
    "modelUsed": "gpt-4o-2024-05-13"
  }
}
```

## 5. Error Handling

- If a request fails due to invalid input, API key issues, OpenAI API errors, or internal server errors, the endpoint will return an appropriate error status code (e.g., 400, 401, 500).
- The response body will follow the standard error format:

```json
{
  "success": false,
  "message": "<Specific error message>",
  "error": "<Detailed error information or code>"
}
```

- **Specific Errors:**
    - **400 Bad Request:** Invalid input parameters, invalid audio/image URL, unsupported format (for STT), etc.
    - **401 Unauthorized:** Invalid or missing OpenAI API Key.
    - **413 Payload Too Large:** Audio file exceeds 25MB limit (for STT).
    - **415 Unsupported Media Type:** Unsupported audio format (for STT).
    - **500 Internal Server Error:** Issues with file processing, errors from the OpenAI API itself, or other unexpected server issues.

## 6. Additional Notes

- **Audio Transcription:** Handles various audio formats by converting them to MP3. Maximum file size is 25MB.
- **Vision:** Uses `gpt-4o` by default. If the `prompt` field is omitted, a default prompt ("Describe this image in detail.") is used. 