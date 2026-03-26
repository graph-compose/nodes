# SerpAPI Trend Radar Digest

Track what people are talking about across Google web + Google News + Reddit-indexed pages, turn mixed search results into structured insights, and push a ready-to-read summary directly to Slack. This recipe is useful for product discovery, founder research, content planning, and GTM signal detection.

It runs five steps: three parallel SerpAPI searches, one LLM summarization pass, and one Slack delivery step.

## Node breakdown

### `search_google_web`: [serpapi/search](https://github.com/graph-compose/nodes/tree/main/nodes/src/nodes/routes/serpapi)

Searches Google web for `context.topic` using location/language settings and a recency window.

### `search_google_news`: [serpapi/search](https://github.com/graph-compose/nodes/tree/main/nodes/src/nodes/routes/serpapi)

Searches Google News (`tbm=nws`) for the same topic and recency period so you capture fresh media/editorial angles.

### `search_reddit_web_index`: [serpapi/search](https://github.com/graph-compose/nodes/tree/main/nodes/src/nodes/routes/serpapi)

Searches Google for Reddit-indexed discussions using a site query (`site:reddit.com/r/`) so you still get community signal without depending on native Reddit API ranking.

All three search nodes run in parallel, which keeps the workflow fast while still giving a broad signal surface.

### `summarize_trends`: [llm/query](https://github.com/graph-compose/nodes/tree/main/python/src/routes/llm)

Combines all three result sets and prompts GPT-4o to produce a concise markdown brief with:

- Top Signals
- Pain Points
- Opportunity Angles
- 3 Content Ideas

This makes the output directly actionable for product and marketing teams.

### `post_digest_to_slack`: Incoming Webhook POST

Posts the generated markdown digest to Slack via your webhook URL so the team gets a daily or on-demand trend snapshot.

---

## Key patterns

- **Parallel acquisition:** multiple search surfaces in parallel reduce total runtime.
- **Single synthesis pass:** one LLM node analyzes web, news, and Reddit-indexed community signals together.
- **Slack-ready output:** the summary is formatted for immediate team consumption.

## Customizing

**Change verticals:** Duplicate one of the `search_*` nodes and adjust query, `tbm`, or engine.

**Tune signal quality:** Adjust:

- `context.recency` (`hour`, `day`, `week`, `month`, `year`)
- `context.resultCount`
- `context.location`, `context.gl`, `context.hl`
- optional advanced SerpAPI parameters (`tbs`, `safe`, `filter`, `nfpr`, etc.)

**Swap delivery channel:** Replace `post_digest_to_slack` with email, Notion, Google Sheets, or CRM endpoint.

**Run on schedule:** Trigger this workflow daily/weekly to create a standing trend report.

## Required setup

| Secret | Description |
|--------|-------------|
| `SERPAPI_API_KEY` | SerpAPI key for all search requests |
| `OPENAI_API_KEY` | API key for GPT summarization |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL for digest delivery |

Required services:

- Graph Compose Nodes Service
- SerpAPI
- OpenAI API
- Slack Incoming Webhook
