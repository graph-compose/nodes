# Contributing Recipes

This guide explains how to add or update recipes so they appear correctly in Graph Compose.

For deeper internal context, see:

- `docs/ai/features/ui/blog-and-recipes.md`
- `docs/guides/how-to-write-recipes.md`

## How Recipes Show Up In The Product

Recipes are file-based and loaded directly from this directory by the UI.

- Catalog page: `/recipes`
- Recipe detail page: `/recipes/[slug]`
- Import action: "Open in Builder" uses `workflow` from `recipe.json`

No database sync is required for recipes. If files are valid and merged, they are discoverable by the product.

## Required Directory Structure

Each recipe must live in its own folder:

```text
cloud-run/graph-compose-nodes/recipes/
  <slug>/
    recipe.json
    content.md
```

Rules:

- Folder name must match `recipe.json.slug`
- `content.md` is optional in product behavior, but required by project convention for contributor-authored recipes

## `recipe.json` Requirements

Required fields:

- `slug`
- `title`
- `description`
- `author`
- `tags`
- `difficulty` (`beginner` | `intermediate` | `advanced`)
- `publishedAt` (`YYYY-MM-DD`)
- `imageSrc`
- `imageAlt`
- `requiredSecrets`
- `requiredServices`
- `relatedRecipes`
- `relatedBlogPosts`
- `workflow`

Authoring rules:

- Put credentials in `requiredSecrets`, then reference them via `{{ secrets.NAME }}` in `workflow.context`
- Use realistic but safe placeholder values for non-secret context data
- Keep node IDs snake_case and descriptive
- Keep `requiredServices` human-readable (for example `OpenAI API`, `Slack Incoming Webhook`)
- External contributors should leave `imageSrc` and `imageAlt` empty (`""`); maintainers will provide header images

## `content.md` Requirements

Use this structure:

1. `# <Recipe title>`
2. Short overview (1-2 paragraphs)
3. `## Node breakdown`
4. One `###` section per major node
5. `## Key patterns`
6. `## Customizing`
7. `## Required setup`

When referencing node implementations, use markdown links so docs are clickable:

```md
### `node_id`: [`provider/action`](../../src/nodes/routes/<provider>)
```

Example:

```md
### summarize: [llm/query](../../src/nodes/routes/llm)
```

## Validation Checklist (Before PR)

- `recipe.json` is valid JSON
- Folder name matches `slug`
- All node IDs referenced in `content.md` exist in `workflow.nodes`
- All required secrets are represented in both:
  - `requiredSecrets`
  - `workflow.context` usage
- Links in `content.md` are valid markdown links
- If `imageSrc` is set, the image exists under `ui/graph-compose/public/images/recipes/`

## Quick Test In UI

After updating recipes:

1. Run the Graph Compose UI locally
2. Open `/recipes` and confirm your recipe appears
3. Open `/recipes/<slug>` and confirm metadata + article rendering
4. Click "Open in Builder" and verify workflow imports cleanly
