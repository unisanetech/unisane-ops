---
name: unisane-growth-measurement-audit
description: Audit whether Growth numbers are trustworthy by reconciling canonical outcomes, tracking evidence, freshness, and provider-attributed conversions through Unisane Ops. Use when users ask whether metrics can be trusted, why Analytics and Ads disagree, whether tracking is missing or duplicated, or whether it is safe to optimize or increase spend.
---

# Audit Growth measurement

Use the existing `unisane_ops` MCP binding and its `audit_growth_measurement` tool. Treat
the tool result as workflow truth; this skill only guides invocation and presentation.

## Workflow

1. Read the active Unisane context and identify the exact project and environment. If
   either is absent or ambiguous, ask the user to select or confirm it. Never guess.
2. Use an explicit date range only when the user provides or confirms it. Do not invent
   comparison periods.
3. Call `audit_growth_measurement` from `unisane_ops` with the exact `projectId` and
   `environmentId`, plus confirmed dates when applicable. Keep default freshness and
   result bounds unless the user asks for a supported narrower result.
   One successful structured result is complete for the turn; do not call the tool
   again merely to reread fields it already returned.
4. For a continuation of the same audit, pass the prior structured handoff unchanged as
   `resumeFrom`. Never construct, edit, or reuse a handoff across another workflow,
   project, environment, or actor.
5. State first whether the numbers are trustworthy enough for the requested decision.
   Separate canonical outcomes from provider-attributed conversions, then summarize
   conflicts, freshness, limitations, and one safe repair or review step. Include the
   returned console link when useful.
6. If measurement is not ready, explicitly gate optimization or increased-spend advice.
   If it is ready, do not claim more precision than the evidence provides.

## Boundaries

- Do not merge canonical and attributed conversions into one number or treat an ad
  platform's report as canonical truth.
- Do not call provider APIs, inspect secrets, run shell commands, change tags, or adjust
  spend.
- Keep internal run, guard, context-brief, and evidence-schema vocabulary out of the
  primary explanation unless the user requests technical details.
- If `unisane_ops` is unavailable, explain that the project-local binding is missing.
  Recommend previewing `unisane mcp configure codex` and applying it with `--write` only
  after explicit review; do not create another MCP definition.
