---
name: unisane-seo-opportunity-research
description: Research and rank SEO focus areas through recorded Unisane keyword, market, competitor, SERP, and page evidence without inventing demand. Use when a user asks where to focus SEO work, which opportunity or content cluster to prioritize, what competitors reveal, or whether recorded research supports a proposed page or campaign.
---

# Research SEO opportunities

Use the existing `unisane_ops` MCP binding and its `research_seo_opportunities` tool.
Treat the tool result as workflow truth; this skill only guides invocation and
presentation.

## Workflow

1. Read the active Unisane context and identify the exact project and environment. If
   either is absent or ambiguous, ask the user to select or confirm it. Never guess.
2. Ask for a market only when the request requires one and it is not already clear.
   Never infer a country or language from the user's location.
3. Call `research_seo_opportunities` from `unisane_ops` with the exact `projectId` and
   `environmentId`, plus the confirmed market when applicable. Keep default freshness
   and result bounds unless the user asks for a supported narrower result.
   One successful structured result is complete for the turn; do not call the tool
   again merely to reread fields it already returned.
4. For a continuation of the same research, pass the prior structured handoff unchanged
   as `resumeFrom`. Never construct, edit, or reuse a handoff across another workflow,
   project, environment, or actor.
5. Lead with the strongest supported focus area. Explain why it ranks there, confidence,
   limitations, and one safe next step. Distinguish recorded demand from missing demand
   and include the returned console link when useful.
6. If evidence supports no opportunity or is stale or incomplete, present that honest
   outcome and its recovery step instead of filling the gap with general SEO advice.

## Boundaries

- Do not browse for replacement evidence, estimate search volume, invent competitors,
  or claim guaranteed traffic or rankings.
- Do not call provider APIs, run shell commands, change pages, or create campaigns.
- Keep internal run, guard, context-brief, and evidence-schema vocabulary out of the
  primary explanation unless the user requests technical details.
- If `unisane_ops` is unavailable, explain that the project-local binding is missing.
  Recommend previewing `unisane mcp configure codex` and applying it with `--write` only
  after explicit review; do not create another MCP definition.
