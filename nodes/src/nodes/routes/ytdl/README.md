# YouTube Downloader Node

## Introduction
The YouTube Downloader node provides functionality to download videos from YouTube in various formats and quality levels. It supports both video and audio downloads, with options for quality selection and format conversion.

## Authentication
This node does not require any specific authentication. However, please ensure you comply with YouTube's terms of service and have the necessary rights to download content.

## Available Endpoints

### POST /ytdl/download
Downloads a video from YouTube and returns a public URL to access the downloaded file.

#### Request Body
```json
{
  "url": "https://www.youtube.com/watch?v=example",
  "format": "mp4",
  "quality": "highest"
}
```

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `url` | string | Valid YouTube video URL | Yes |
| `format` | string | Output format (`mp4` or `mp3`) | Yes |
| `quality` | string | Video quality (`highest` or `lowest`) | Yes |

#### Response
```json
{
  "task_id": "abc123...",
  "task_status": "succeed",
  "task_status_msg": "Download completed successfully",
  "task_result": {
    "url": "https://storage.example.com/ytdl-abc123.mp4",
    "format": "mp4",
    "title": "Example Video",
    "duration": 180,
    "size": 12345678
  },
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400`: Invalid request parameters (malformed URL, invalid format/quality)
- `404`: Video not found or is private
- `500`: Internal server error or download failure

Error Response Format:
```json
{
  "task_status": "failed",
  "task_status_msg": "Error message describing what went wrong"
}
```

## Additional Notes

- Maximum video length: 3 hours
- Maximum file size: 2GB
- Supported formats: MP4 (video), MP3 (audio)
- Downloaded files are automatically cleaned up after 14 days
- Live streams are not supported
- Please respect copyright and usage rights when downloading content

## Best Practices

1. Always validate the video URL before sending the request
2. Choose appropriate quality settings based on your needs
3. Handle potential errors gracefully in your application
4. Monitor the response size to ensure it meets your requirements
5. Consider implementing rate limiting in your application 