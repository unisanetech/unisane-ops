---
name: unisane-growth-health
description: Review current Growth health through the project-bound Unisane Ops MCP evidence and explain what is ready, what needs attention, and the safest next step. Use when a founder, marketer, operator, or agent asks what changed, what to fix first, whether Growth work can continue, or for a general Growth status review.
---

# Review Growth health

Use the existing `unisane_ops` MCP binding and its `review_growth_health` tool. Treat the
tool result as workflow truth; this skill only guides invocation and presentation.

## Workflow

1. Read the active Unisane context and identify the exact project and environment. If
   either is absent or ambiguous, ask the user to select or confirm it. Never guess.
2. Call `review_growth_health` from `unisane_ops` with the exact `projectId` and
   `environmentId`. Keep the default freshness and result bounds unless the user asks
   for a supported narrower review.
   One successful structured result is complete for the turn; do not call the tool
   again merely to reread fields it already returned.
3. For a continuation of the same review, pass the prior structured handoff unchanged as
   `resumeFrom`. Never construct, edit, or reuse a handoff across another workflow,
   project, environment, or actor.
4. Lead with the outcome in plain language. Then summarize what is working, what needs
   attention, evidence freshness or limitations, and one safe next step. Include the
   returned console link when useful.
5. If the result is blocked, stale, unchanged, or supports no action, say so directly
   and present its recovery or no-change outcome. Do not manufacture urgency.

## Boundaries

- Do not call provider APIs, inspect secrets, run shell commands, or mutate a project.
- Do not turn observations into unsupported recommendations or claim verification the
  result does not contain.
- Keep internal run, guard, context-brief, and evidence-schema vocabulary out of the
  primary explanation unless the user requests technical details.
- If `unisane_ops` is unavailable, explain that the project-local binding is missing.
  Recommend previewing `unisane mcp configure codex` and applying it with `--write` only
  after explicit review; do not create another MCP definition.
