# AI Content Generation Pipeline

Write a complete blog post, extract its SEO metadata, and publish it to your CMS as a draft, all from a single workflow. The three nodes run in strict dependency order: content generation finishes first, then SEO extraction analyses the generated text, then publishing pulls from both and creates the post. No orchestration code, no glue scripts.

## Node breakdown

### `generate_content`

Calls the [OpenAI Chat Completions API](https://platform.openai.com/docs/api-reference/chat) with a system prompt that instructs GPT-4o to write as a technical content writer, and a user message constructed from `context.topic`, `context.targetAudience`, and `context.wordCount`.

The full markdown post comes back at `results.generate_content.data.choices[0].message.content`, a standard OpenAI response path. This value is passed downstream to both `extract_seo_metadata` and `publish_to_cms`.

Configured with a 2-minute timeout and 2 retry attempts. Temperature is set to `0.7` for creative variation in content while keeping the structure consistent.

### `extract_seo_metadata`

Feeds the generated post back into GPT-4o with a tighter system prompt: extract a `title`, `slug`, `metaDescription` (max 160 characters), and `tags` array from the content, and return them as valid JSON.

Using `"response_format": { "type": "json_object" }` guarantees the response is parseable JSON rather than a markdown code block, no brittle string manipulation needed. The parsed metadata is available at `results.extract_seo_metadata.data.choices[0].message.content` as a JSON string, then passed through `$parseJSON()` in the publish node's body.

This node has a 30s timeout with no retries, if GPT-4o is returning malformed JSON, a retry is unlikely to help.

### `publish_to_cms`

Posts both the content and the SEO metadata to your CMS API as a draft. This node lists **two dependencies**, `generate_content` and `extract_seo_metadata`, so it waits for both to complete before executing.

The body uses a JSONata expression to parse the SEO metadata string into a structured object:

```json
"metadata": "{{ $parseJSON(results.extract_seo_metadata.data.choices[0].message.content) }}"
```

Posts are created with `"status": "draft"` so nothing goes live without a human review step.

## Key patterns

- **Sequential AI chaining**: the second GPT-4o call operates on the output of the first; each node's `results` are accessible to all downstream nodes
- **Dual dependencies**: `publish_to_cms` lists two dependencies and waits for both before executing, without any coordination logic
- **Structured outputs**: `response_format: json_object` on the metadata node guarantees parseable JSON from the LLM
- **JSONata in node bodies**: `$parseJSON()` converts the raw string response into a structured object inline, without a separate transformation step

## Customising

**Add image generation:** Insert a DALL-E or Stability AI node between `generate_content` and `publish_to_cms`. Pass the generated post's title as the image prompt. Add the image URL to the CMS publish body.

**Add human review:** Insert a `confirmation` node between `extract_seo_metadata` and `publish_to_cms`. The workflow will pause and wait for approval before the post is created.

**Batch multiple topics:** Wrap the entire three-node pipeline in a `forEach` loop over an array of topics. Each topic runs its own generate/extract/publish pipeline in parallel.

**Use a different LLM:** Replace the OpenAI calls with any chat completions-compatible API, Anthropic Claude, Mistral, Gemini. Update the `url` and `Authorization` header on `generate_content` and `extract_seo_metadata`.

## Required setup

| Secret | Description |
|--------|-------------|
| `OPENAI_API_KEY` | Used by `generate_content` and `extract_seo_metadata` |
| `CMS_API_KEY` | Bearer token for your CMS API |

Update `context.cmsBaseUrl` to your CMS API base URL and adjust the `publish_to_cms` body to match your CMS's expected payload shape (field names vary between WordPress, Contentful, Strapi, etc.).
