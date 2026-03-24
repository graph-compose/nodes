# Kling AI Integration

This integration provides an Express router for generating and managing AI-generated images via the Kling AI API.

## Overview
The Kling AI integration enables high-quality image generation from text prompts, with support for reference images, multiple model versions, and asynchronous task management.

## Authentication
All requests require Kling AI credentials passed in the request body:

```json
{
  "accessKey": "your_access_key",
  "secretKey": "your_secret_key"
}
```

## Available Endpoints

### Image Generation
- POST /api/klingai/generate - Generate images using text prompts and optional reference images
- GET /api/klingai/generate/:task_id - Query the status of a specific generation task
- GET /api/klingai/tasks - List all image generation tasks with pagination

## Request and Response Examples

### Generate Image
POST /api/klingai/generate
```json
{
  "accessKey": "your_access_key",
  "secretKey": "your_secret_key",
  "model_name": "kling-v1-5",
  "prompt": "A beautiful sunset over a mountain landscape",
  "negative_prompt": "blur, distortion, low quality",
  "n": 1,
  "aspect_ratio": "16:9",
  "image": "base64_encoded_image_or_url",
  "image_reference": "subject",
  "image_fidelity": 0.8,
  "callback_url": "https://your-callback-url.com/webhook"
}
```

Response:
```json
{
  "code": 0,
  "message": "Success",
  "request_id": "req_abc123",
  "data": {
    "task_id": "task_xyz789",
    "task_status": "submitted",
    "created_at": 1711481600000,
    "updated_at": 1711481600000
  }
}
```

### Query Task Status
GET /api/klingai/generate/task_xyz789
```json
{
  "accessKey": "your_access_key",
  "secretKey": "your_secret_key"
}
```

Response:
```json
{
  "code": 0,
  "message": "Success",
  "request_id": "req_def456",
  "data": {
    "task_id": "task_xyz789",
    "task_status": "succeed",
    "task_status_msg": "Generation completed successfully",
    "created_at": 1711481600000,
    "updated_at": 1711481700000,
    "task_result": {
      "images": [
        {
          "index": 0,
          "url": "https://api.klingai.com/generated/image1.jpg"
        }
      ]
    }
  }
}
```

### List Tasks
GET /api/klingai/tasks?pageNum=1&pageSize=30
```json
{
  "accessKey": "your_access_key",
  "secretKey": "your_secret_key"
}
```

Response:
```json
{
  "code": 0,
  "message": "Success",
  "request_id": "req_ghi789",
  "data": [
    {
      "task_id": "task_xyz789",
      "task_status": "succeed",
      "task_status_msg": "Generation completed successfully",
      "created_at": 1711481600000,
      "updated_at": 1711481700000,
      "task_result": {
        "images": [
          {
            "index": 0,
            "url": "https://api.klingai.com/generated/image1.jpg"
          }
        ]
      }
    }
  ]
}
```

## Error Handling

The API returns standard error responses in the following format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- 400 Bad Request - Invalid input parameters
- 401 Unauthorized - Invalid API credentials
- 429 Rate Limit Exceeded
- 500 Internal Server Error

## Additional Notes
- Generated images are stored for 30 days before being automatically deleted
- When using model "kling-v1-5" with a reference image, image_reference must be specified
- Maximum prompt length: 500 characters
- Maximum negative prompt length: 200 characters
- Number of images per request (n): 1-9
- Supported aspect ratios: 16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3, 21:9 (21:9 only for V1.5)
- Reference image requirements:
  - Max size: 10MB
  - Min resolution: 300x300px
  - Aspect ratio: between 1:2.5 and 2.5:1
  - Formats: jpg/jpeg/png

For full documentation, see [Kling AI API Documentation](https://docs.qingque.cn) 