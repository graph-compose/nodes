# LLM API

This integration provides access to various Large Language Model (LLM) providers through a unified API.

## Authentication

Authentication is handled through API keys. Each request requires an `api_key` parameter that corresponds to the provider you're using (e.g., OpenAI API key for OpenAI models).

## Available Endpoints

### Chat Completion

- `POST /api/llm/chat` - Generate a chat completion with full conversation history

### Simple Query

- `POST /api/llm/query` - Generate a completion for a simple one-shot query

## Request and Response Examples

### Chat Completion

#### Example Request
POST /api/llm/chat
```json
{
  "model": "openai/gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "What is the capital of France?"
    },
    {
      "role": "assistant",
      "content": "The capital of France is Paris."
    },
    {
      "role": "user",
      "content": "What about Germany?"
    }
  ],
  "system_prompt": "You are a helpful AI assistant that specializes in geography.",
  "api_key": "sk-your-openai-api-key",
  "temperature": 0.7,
  "max_tokens": 500
}
```

#### Example Response
```json
{
  "response": "The capital of Germany is Berlin.",
  "model": "openai/gpt-4",
  "id": "chatcmpl-123456789"
}
```

### Simple Query

#### Example Request
POST /api/llm/query
```json
{
  "model": "openai/gpt-4",
  "message": "What is the capital of France?",
  "system_prompt": "You are a helpful AI assistant that specializes in geography.",
  "api_key": "sk-your-openai-api-key",
  "temperature": 0.7,
  "max_tokens": 500
}
```

#### Example Response
```json
{
  "response": "The capital of France is Paris.",
  "model": "openai/gpt-4",
  "id": "chatcmpl-123456789"
}
```

## Error Handling

### Common Error Responses

- **400 Bad Request**: Invalid request format
  ```json
  {
    "error": "Invalid request format. Please check the required fields and their types."
  }
  ```

- **500 Internal Server Error**: Service error
  ```json
  {
    "error": "Failed to generate completion. Please check your API key."
  }
  ```

## Additional Notes

- The `model` field must include the provider prefix (e.g., "openai/", "anthropic/", "google/", "mistral/").
- Supported providers: OpenAI, Anthropic, Google, Mistral, Azure OpenAI.
- The `temperature` parameter controls randomness (0.0 to 1.0), with lower values being more deterministic.
- The `max_tokens` parameter is optional and limits the response length. 