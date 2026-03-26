# API Health Check with Slack Alerts

Poll any HTTP endpoint, evaluate the response, and fire a formatted Slack alert when something looks wrong. This is a two-node workflow, short enough to understand in a few minutes, but it demonstrates one of Graph Compose's most useful features: **conditional execution**. The alert node only runs when the health check actually fails. If the endpoint is healthy, it's skipped entirely with no side effects.

## Node breakdown

### `check_endpoint`: HTTP GET (your API)

Makes a `GET` request to your API's health check URL (set in `context.healthCheckUrl`). The node is configured to retry up to 3 times with a 5s interval before marking itself as failed, so transient blips don't trigger false alarms.

The raw HTTP response is available to downstream nodes via `results.check_endpoint`. The status code specifically is at `results.check_endpoint.statusCode`, which the alert node's condition checks against `context.expectedStatusCode` (default: `200`).

### `send_slack_alert`: [Slack Incoming Webhook](https://api.slack.com/messaging/webhooks)

Posts a structured message to your Slack channel via an Incoming Webhook. Uses Slack's [Block Kit](https://api.slack.com/block-kit) format for a clean two-field layout showing the endpoint URL and the actual status code received.

This node only executes when the `check_endpoint` response code doesn't match the expected value. That condition is declared directly on the node:

```json
"conditions": {
  "match": "any",
  "rules": [
    {
      "field": "{{ results.check_endpoint.statusCode }}",
      "operator": "neq",
      "value": "{{ context.expectedStatusCode }}"
    }
  ]
}
```

If the health check passes, the workflow completes without sending anything.

## Key patterns

- **Conditional execution**: the `conditions` block on `send_slack_alert` gates whether the node runs at all
- **Context variables**: `healthCheckUrl` and `expectedStatusCode` are set in `context`, making the workflow easy to reconfigure without touching node definitions
- **Retry policy**: `check_endpoint` retries 3 times before giving up, so transient errors don't cause noise

## Customising

**Check response body, not just status:** Add a rule to the `conditions` block that inspects a field in the response body, e.g. `{{ results.check_endpoint.data.status }}` `neq` `"healthy"`.

**Monitor multiple endpoints:** Duplicate `check_endpoint` with a different ID and URL, then add a corresponding alert node for each. Or point both to a single summary alert node that depends on both checks completing.

**Use a different notification channel:** Replace the `send_slack_alert` HTTP config with any webhook-based service, Discord, PagerDuty, Teams, or a SendGrid email call. The node structure stays identical.

## Required setup

| Secret | Description |
|--------|-------------|
| `SLACK_WEBHOOK_URL` | Your Slack Incoming Webhook URL |

Create an Incoming Webhook at [api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks), then save the URL as a secret in Graph Compose under the name `SLACK_WEBHOOK_URL`.
