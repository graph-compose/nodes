# Replicate API Integration (Generalized)

## 1. Introduction

This integration provides generalized access to run inference tasks on models hosted by Replicate.com.

Core Features:
- Start prediction tasks for any Replicate model version.
- Check the status of ongoing or completed predictions.
- Asynchronous workflow using polling.

**IMPORTANT:** This node is generalized. You **must** know the specific **model version ID** you want to run and the exact **input schema** required by that version. You also need to know how to interpret the **output schema** provided by that model version.

## 2. Authentication

Authentication uses a Replicate API Token.

- **Credentials Required:** Replicate API Token
- **How to Pass:** Include the token in the `apiKey` field within the JSON request body for all endpoints (`/create`, `/status`).
- Obtain your tokens from your [Replicate Account Settings](https://replicate.com/account/api-tokens).

## 3. Available Endpoints

### Predictions

- `POST /nodes/replicate/predictions/create` - Starts an asynchronous prediction task on Replicate.
- `POST /nodes/replicate/predictions/status` - Checks the status and retrieves results of a prediction task.

## 4. Workflow (Asynchronous)

1.  **Find Model & Version:** Identify the specific model and **version ID** you want to use on Replicate (e.g., `stability-ai/sdxl:c221b2b8...`).
2.  **Check Input/Output:** Consult the Replicate documentation for that specific model version to understand its required `input` object structure and the expected format of the `output` field upon completion.
3.  **Submit Task:** Send a POST request to `/nodes/replicate/predictions/create` with:
    - `apiKey`: Your Replicate token.
    - `version`: The full model version ID string.
    - `input`: A JSON object matching the model's required input schema.
    - `webhook` (Optional): A URL for Replicate to send status updates.
    - `webhook_events_filter` (Optional): Specific events for the webhook.
4.  **Get Task ID:** If successful (200 OK), the response contains the `taskId` (this is the Replicate prediction ID).
    ```json
    {
        "success": true,
        "data": { "taskId": "REPLICATE_PREDICTION_ID" }
    }
    ```
5.  **Poll Status:** Periodically send a POST request to `/nodes/replicate/predictions/status` with your `apiKey` and the `taskId`.
6.  **Check Status & Results:** Examine the response:
    - `status`: Will be `submitted`, `processing`, `succeed`, or `failed`.
    - `output`: If status is `succeed`, this field contains the model's output. **Its structure (URL, array of URLs, JSON, text, etc.) depends entirely on the model version.**
    - `error`: Contains details if the status is `failed`.
    - `logs`, `metrics`, etc.: Additional details from Replicate.
    ```json
    // Example: Successful response for an image model
    {
        "success": true,
        "data": {
            "taskId": "REPLICATE_PREDICTION_ID",
            "status": "succeed",
            "input": { "prompt": "..." },
            "output": [
                "https://replicate.delivery/pbxt/..../output_0.png"
            ],
            "error": null,
            "logs": "...",
            "metrics": { "predict_time": 3.5 },
            "createdAt": "...",
            "startedAt": "...",
            "completedAt": "..."
        }
    }
    ```

## 5. Request Examples

#### Example: Create Prediction Task (SDXL)

POST /nodes/replicate/predictions/create

```json
{
    "apiKey": "r8_YOUR_REPLICATE_TOKEN",
    "version": "stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866fe846a791195",
    "input": {
        "prompt": "An astronaut riding a horse on the moon, cinematic lighting"
    }
}
```

#### Example: Query Status

POST /nodes/replicate/predictions/status

```json
{
    "apiKey": "r8_YOUR_REPLICATE_TOKEN",
    "taskId": "REPLICATE_PREDICTION_ID"
}
```

## 6. Error Handling

- **Task Creation:** Errors during submission (validation, auth, invalid version ID, Replicate errors) result in a 500 response from the `/create` endpoint.
- **Task Status Query:**
    - If the Replicate prediction itself failed, the `/status` endpoint returns 200 OK, but the `status` field in the data will be `failed`, and the `error` field will contain details.
    - If the call to query the status fails (e.g., invalid `taskId`, auth error), the `/status` endpoint itself returns a 500 error.

#### Example Error Response (from `/status` if prediction failed)

```json
{
    "success": true,
    "data": {
        "taskId": "REPLICATE_PREDICTION_ID",
        "status": "failed",
        "input": { ... },
        "output": null,
        "error": "Prediction failed: NSFW content detected",
        // ... other fields
    }
}
```

## 7. Additional Notes

- Always use the specific **version ID** for the model, not just the model name.
- You are responsible for understanding the input requirements and output format for the specific model version you choose to run via this generalized node.
- Refer to the [Replicate HTTP API documentation](https://replicate.com/docs/reference/http) for details on prediction objects. 