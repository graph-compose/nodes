# Luma Video Generation Integration

This integration provides an Express router for generating videos using the Luma AI API.

## Overview
The Luma integration allows you to generate videos from text prompts or images. Video generation is an asynchronous process that requires multiple API calls - first to initiate generation and then to check status until completion.

## Authentication
All requests require a Luma API key. For POST requests, include it in the request body:

{
  "apiKey": "your_luma_api_key"
}

For GET requests, include it in the request headers:

apiKey: your_luma_api_key

## Available Endpoints

### Video Generations
- POST /api/video/luma/generations - Create a new video generation
- GET /api/video/luma/generations/:id - Get status of a specific video generation
- GET /api/video/luma/generations - List your video generations

## How to Generate a Video

### Step 1: Initiate Video Generation
Send a POST request to start the generation process:

Request:
POST /api/video/luma/generations
{
  "apiKey": "your_luma_api_key",
  "prompt": "A serene lake surrounded by mountains at sunset",
  "aspectRatio": "widescreen",
  "duration": 3,
  "fps": 24,
  "modelType": "text_to_video"
}

Response:
{
  "id": "gen_abc123",
  "status": "pending",
  "prompt": "A serene lake surrounded by mountains at sunset",
  "createdAt": "2023-05-20T15:30:45Z"
}

### Step 2: Check Generation Status
Poll the status endpoint until the video is complete:

Request:
GET /api/video/luma/generations/gen_abc123
Headers:
apiKey: your_luma_api_key

Response (while processing):
{
  "id": "gen_abc123",
  "status": "processing",
  "prompt": "A serene lake surrounded by mountains at sunset",
  "createdAt": "2023-05-20T15:30:45Z"
}

Response (when complete):
{
  "id": "gen_abc123",
  "status": "complete",
  "prompt": "A serene lake surrounded by mountains at sunset",
  "createdAt": "2023-05-20T15:30:45Z",
  "completedAt": "2023-05-20T15:35:12Z",
  "videoUrl": "https://storage.lumalabs.ai/videos/gen_abc123.mp4",
  "thumbnailUrl": "https://storage.lumalabs.ai/thumbnails/gen_abc123.jpg"
}

### Step 3: Download the Video
Once the status is "complete", download the video from the videoUrl provided in the response.

## Generation Options

### Text-to-Video (Default)
{
  "apiKey": "your_luma_api_key",
  "prompt": "A serene lake surrounded by mountains at sunset",
  "modelType": "text_to_video"
}

### Image-to-Video
{
  "apiKey": "your_luma_api_key",
  "prompt": "A tiger walking in snow",
  "modelType": "image_to_video",
  "imageUrl": "https://example.com/your-image.jpg"
}

### Optional Parameters
- negativePrompt: Things to avoid in the video
- aspectRatio: "square" (1:1), "widescreen" (16:9), or "portrait" (9:16)
- duration: Video duration in seconds (1-4)
- fps: Frames per second (8-30)
- seed: For reproducible results
- outputFormat: "mp4" (default) or "gif"

## Listing Your Generations

Request:
GET /api/video/luma/generations?limit=10
Headers:
apiKey: your_luma_api_key

Response:
{
  "data": [
    {
      "id": "gen_abc123",
      "status": "complete",
      "prompt": "A serene lake surrounded by mountains at sunset",
      "createdAt": "2023-05-20T15:30:45Z",
      "completedAt": "2023-05-20T15:35:12Z",
      "videoUrl": "https://storage.lumalabs.ai/videos/gen_abc123.mp4",
      "thumbnailUrl": "https://storage.lumalabs.ai/thumbnails/gen_abc123.jpg"
    },
    {
      "id": "gen_def456",
      "status": "processing",
      "prompt": "A futuristic city with flying cars",
      "createdAt": "2023-05-20T16:10:22Z"
    }
  ],
  "hasMore": true,
  "nextCursor": "cursor_xyz789"
}

## Error Handling

The API returns standard error responses in the following format:

{
  "success": false,
  "error": "Error message"
}

Common HTTP status codes:
- 400 Bad Request - Invalid input
- 401 Unauthorized - Invalid API key
- 404 Not Found - Generation not found
- 500 Internal Server Error - Server error

## Additional Notes
- Video generation can take several minutes to complete
- The maximum video duration is 4 seconds
- For image-to-video generation, you must provide an imageUrl
- Supported aspect ratios: square (1:1), widescreen (16:9), portrait (9:16)
- Supported output formats: mp4, gif 