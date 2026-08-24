---
name: unisane-seo-opportunity-research
description: Research and rank SEO focus areas, prepare one explicitly selected opportunity for implementation, or verify an already human-recorded publication through bounded Unisane evidence. Use when a user asks where to focus SEO work, wants a coding or content packet for a chosen opportunity, or wants to measure a published SEO change without inventing demand or causation.
---

# Research, prepare, and verify SEO work

Use the existing `unisane_ops` MCP binding and its `research_seo_opportunities`,
`prepare_seo_implementation`, and `verify_seo_publication` tools. Treat their results
as workflow truth; this skill only guides invocation and presentation.

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
7. Call `prepare_seo_implementation` only after the user explicitly selects one exact
   returned opportunity id and asks to prepare it. Pass the same exact `projectId` and
   `environmentId`; choose the requested audience or default to `coding-agent`. Explain
   that the result is an evidence-bound local packet, not an edit, approval, or
   publication. Do not automatically prepare the top-ranked result.
8. Call `verify_seo_publication` only when the user provides or confirms the exact
   publication id from an already human-recorded publication artifact. Report waiting,
   late, not-measurable, mixed, or changed results exactly as returned. State that
   causation is not established and use the returned next step.

## Boundaries

- Do not browse for replacement evidence, estimate search volume, invent competitors,
  or claim guaranteed traffic or rankings.
- Do not call provider APIs, run shell commands, change pages, publish content, record
  publication, grant approval, or create campaigns. This MCP surface intentionally
  cannot record the human publication decision.
- Do not infer an opportunity id or publication id from labels, routes, titles, or rank.
- Keep internal run, guard, context-brief, and evidence-schema vocabulary out of the
  primary explanation unless the user requests technical details.
- If `unisane_ops` is unavailable, explain that the project-local binding is missing.
  Recommend previewing `unisane-ops mcp configure codex` and applying it with `--write` only
  after explicit review; do not create another MCP definition.
