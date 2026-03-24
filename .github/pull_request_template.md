## Description

<!-- Describe your changes in detail. -->

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] New recipe
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Checklist

- [ ] Tests are passing
- [ ] Documentation has been updated (if applicable)
- [ ] OpenAPI spec updated (if applicable)
- [ ] CLA signed (the CLA Assistant bot will prompt you automatically)

### Recipe PRs only
- [ ] `recipe.json` parses as valid JSON
- [ ] Slug matches directory name
- [ ] All secrets use `{{ secrets.NAME }}` placeholders (no hardcoded keys)
- [ ] All secrets listed in both `requiredSecrets` and `workflow.context`
- [ ] `content.md` covers all nodes in the workflow
