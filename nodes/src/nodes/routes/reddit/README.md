# Reddit Search Node

Search Reddit posts through `POST /nodes/reddit/search`.

## Authentication Modes

This node supports two auth modes:

1. **App-only auth (default)**  
   Required fields:
   - `clientId`
   - `clientSecret`
   - `userAgent`

2. **Script auth (recommended for hosted reliability)**  
   Required fields:
   - `clientId`
   - `clientSecret`
   - `userAgent`
   - `username`
   - `password`

## When Username/Password Is Needed

`username`/`password` is not always required, but it is often needed in hosted/cloud environments where Reddit may block app-only requests due to network policy (`whoa there, pardner`).

If app-only requests are blocked, switch to script auth.

## Security Guidance

- Use a **unique, descriptive** user-agent string (avoid placeholders).
- Use a **dedicated non-critical automation Reddit account** for script auth.
- Store all credentials in secrets; never hardcode them in source.

## Request Example

```json
{
  "query": "individual health insurance canada",
  "subreddit": "all",
  "sort": "relevance",
  "time": "week",
  "limit": 10,
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "userAgent": "graph-compose:trend-radar:v1.0 (by /u/your_bot_account)",
  "username": "your_bot_account",
  "password": "your_bot_password"
}
```
