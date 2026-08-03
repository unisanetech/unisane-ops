---
name: unisane-campaign-pause
description: Plan, review, apply an already human-approved, and verify one exact Google Ads or Meta Ads campaign pause through the project-bound Unisane Ops MCP lifecycle. Use when a founder, marketer, operator, or agent asks to pause, stop, or temporarily hold one campaign; stop further spend while investigating; review an existing pause plan; continue after human approval; or verify that the provider reports the campaign as paused.
---

# Pause one campaign safely

Use the existing `unisane_ops` MCP binding and only its `plan_campaign_pause`,
`review_campaign_pause`, `apply_approved_campaign_pause`, and
`verify_campaign_pause` tools. Treat their result as workflow truth. This skill guides
the sequence and explanation; it never grants approval.

## Workflow

1. Identify the exact `projectId`, `environmentId`, provider, provider account,
   campaign, and current evidence revision. Ask the user to confirm anything absent or
   ambiguous. Never infer an identifier, substitute an account, or invent an evidence
   revision.
2. Call `plan_campaign_pause` once with that exact target and `evidenceRevision`. Keep
   the default plan and verification windows unless the user has a supported reason to
   change them.
3. Explain that nothing has been paused yet. Present the exact target, effect,
   reversibility, evidence revision, plan expiry, plan hash, and returned next step in
   plain language. Do not describe a pause as deletion or automatic rollback.
4. Tell the human reviewer to approve the exact stored plan outside MCP. For the local
   developer workflow, provide this command with the returned values, but do not run it:

   ```sh
   unisane growth campaign pause approve --cwd <project-root> --environment <environmentId> --run-id <runId> --plan-hash <planHash> --approved-by <human-identity>
   ```

5. When the user asks to continue after approval, call `review_campaign_pause` with the
   unchanged `runId`. Do not trust a conversational approval claim. Continue only when
   the canonical review says the same plan and target are ready to apply.
6. Call `apply_approved_campaign_pause` only after that review. Use
   `review.evidence.currentRevision` as `currentEvidenceRevision`. Build
   `confirmTarget` only from the unchanged reviewed target as
   `<provider>:<providerAccountId>:<campaignId>`; do not infer or transform any segment.
   Present the receipt state and returned next step. Never call apply again merely
   because the provider outcome is pending or unknown.
7. Call `verify_campaign_pause` only when the returned verification window permits it.
   Report `verified`, `needs-attention`, or `outcome-unknown` exactly and explain the
   returned recovery step. Stop when verification is complete.

## Boundaries

- Never call or invent an approval tool. The agent principal is the executor, not the
  human approver.
- Never accept provider tokens, credentials, approval tokens, or secrets in arguments
  or conversation.
- Never change the project, environment, provider account, campaign, plan hash,
  evidence revision, or confirmation target between stages.
- If the plan or approval expired, evidence changed, the target differs, or policy
  blocks the action, stop. Re-plan only after the user confirms the current evidence and
  exact target again.
- If apply returns an error or ambiguous result, review the same run and follow its safe
  next step. Do not create a replacement plan or retry a provider write automatically.
- This is a local private-development workflow. Do not present it as hosted,
  multi-process, scheduled, remote MCP, or public marketplace support.
- If `unisane_ops` is unavailable, explain that the project-local binding is missing.
  Recommend previewing `unisane mcp configure codex` and applying it with `--write` only
  after explicit review; do not create another MCP definition.
