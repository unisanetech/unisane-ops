import { McpServer } from '@modelcontextprotocol/server';
import { randomUUID } from 'node:crypto';
import {
  executeGrowthHealthReview,
  executeGrowthMeasurementAudit,
  executeGrowthSeoOpportunityResearch,
} from '@unisane/growth';
import {
  assertBoundTarget,
  growthCampaignPauseApplyToolInputSchema,
  growthCampaignPausePlanToolInputSchema,
  growthCampaignPauseReviewToolInputSchema,
  growthCampaignPauseVerifyToolInputSchema,
  growthHealthReviewToolInputSchema,
  growthMeasurementAuditToolInputSchema,
  growthSeoOpportunityToolInputSchema,
  prepareBoundWorkflowResume,
  validateLocalOpsMcpBinding,
  type LocalOpsMcpBinding,
  type OpsMcpGrowthExecutors,
  type OpsMcpGrowthWorkflows,
  OpsMcpSafeError,
} from './contracts.js';
import { attachWorkflowResume } from './resume.js';
import { createOpsMcpErrorResult, createOpsMcpToolResult } from './tool-result.js';

export const OPS_MCP_TOOL_NAMES = Object.freeze([
  'review_growth_health',
  'research_seo_opportunities',
  'audit_growth_measurement',
  'plan_campaign_pause',
  'review_campaign_pause',
  'apply_approved_campaign_pause',
  'verify_campaign_pause',
] as const);

const defaultExecutors: OpsMcpGrowthExecutors = {
  reviewHealth: executeGrowthHealthReview,
  researchSeo: executeGrowthSeoOpportunityResearch,
  auditMeasurement: executeGrowthMeasurementAudit,
};

const readAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const planAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

const applyAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: true,
} as const;

const verifyAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

export const OPS_MCP_WORKFLOW_CONTRACTS = Object.freeze({
  review_growth_health: {
    goal: { id: 'growth.health', version: 1 },
    playbook: { id: 'growth.health-review', version: 1 },
  },
  research_seo_opportunities: {
    goal: { id: 'growth.opportunity-discovery', version: 1 },
    playbook: { id: 'growth.seo-opportunity-research', version: 1 },
  },
  audit_growth_measurement: {
    goal: { id: 'growth.measurement-trust', version: 1 },
    playbook: { id: 'growth.measurement-audit', version: 1 },
  },
} as const);

export function createLocalOpsMcpServer(
  bindingInput: LocalOpsMcpBinding,
  workflows: OpsMcpGrowthWorkflows,
  executors: OpsMcpGrowthExecutors = defaultExecutors,
): McpServer {
  const binding = validateLocalOpsMcpBinding(bindingInput);
  const server = new McpServer({ name: 'unisane-ops', version: '0.1.0' });

  server.registerTool(
    'review_growth_health',
    {
      title: 'Review Growth health',
      description:
        'Explain what is ready, what needs attention, and the safest next step using current evidence for the bound project.',
      inputSchema: growthHealthReviewToolInputSchema,
      annotations: readAnnotations,
    },
    async (input) => {
      try {
        assertBoundTarget(binding, input);
        const resume = prepareBoundWorkflowResume({
          binding,
          handoff: input.resumeFrom,
          ...OPS_MCP_WORKFLOW_CONTRACTS.review_growth_health,
        });
        const output = await executors.reviewHealth({
          cwd: binding.projectRoot,
          config: binding.growthConfig,
          projectId: binding.projectId,
          environmentId: binding.environmentId,
          principal: binding.principal,
          maxAgeDays: input.maxAgeDays,
          findingLimit: input.findingLimit,
          ...(resume.requestId ? { requestId: resume.requestId } : {}),
        });
        return createOpsMcpToolResult(
          attachWorkflowResume(output, resume.handoff),
          binding.maximumResultBytes,
        );
      } catch (error) {
        return createOpsMcpErrorResult(error);
      }
    },
  );

  server.registerTool(
    'research_seo_opportunities',
    {
      title: 'Research SEO opportunities',
      description:
        'Rank evidence-backed SEO focus areas for the bound project without inventing demand or unsupported recommendations.',
      inputSchema: growthSeoOpportunityToolInputSchema,
      annotations: readAnnotations,
    },
    async (input) => {
      try {
        assertBoundTarget(binding, input);
        const resume = prepareBoundWorkflowResume({
          binding,
          handoff: input.resumeFrom,
          ...OPS_MCP_WORKFLOW_CONTRACTS.research_seo_opportunities,
        });
        const output = await executors.researchSeo({
          cwd: binding.projectRoot,
          ...(binding.researchRoot ? { researchRoot: binding.researchRoot } : {}),
          projectId: binding.projectId,
          environmentId: binding.environmentId,
          principal: binding.principal,
          ...(input.market ? { market: input.market } : {}),
          maxAgeDays: input.maxAgeDays,
          opportunityLimit: input.opportunityLimit,
          ...(resume.requestId ? { requestId: resume.requestId } : {}),
        });
        return createOpsMcpToolResult(
          attachWorkflowResume(output, resume.handoff),
          binding.maximumResultBytes,
        );
      } catch (error) {
        return createOpsMcpErrorResult(error);
      }
    },
  );

  server.registerTool(
    'audit_growth_measurement',
    {
      title: 'Audit Growth measurement',
      description:
        'Check whether Growth numbers can be trusted by reconciling canonical outcomes, tracking, and provider attribution for the bound project.',
      inputSchema: growthMeasurementAuditToolInputSchema,
      annotations: readAnnotations,
    },
    async (input) => {
      try {
        assertBoundTarget(binding, input);
        const resume = prepareBoundWorkflowResume({
          binding,
          handoff: input.resumeFrom,
          ...OPS_MCP_WORKFLOW_CONTRACTS.audit_growth_measurement,
        });
        const output = await executors.auditMeasurement({
          cwd: binding.projectRoot,
          config: binding.marketingConfig,
          principal: binding.principal,
          ...(input.startDate ? { startDate: input.startDate } : {}),
          ...(input.endDate ? { endDate: input.endDate } : {}),
          maxAgeDays: input.maxAgeDays,
          comparisonLimit: input.comparisonLimit,
          ...(resume.requestId ? { requestId: resume.requestId } : {}),
        });
        return createOpsMcpToolResult(
          attachWorkflowResume(output, resume.handoff),
          binding.maximumResultBytes,
        );
      } catch (error) {
        return createOpsMcpErrorResult(error);
      }
    },
  );

  server.registerTool(
    'plan_campaign_pause',
    {
      title: 'Plan a campaign pause',
      description:
        'Prepare an evidence-bound pause plan for one exact Google Ads or Meta Ads campaign. This does not approve or contact the provider.',
      inputSchema: growthCampaignPausePlanToolInputSchema,
      annotations: planAnnotations,
    },
    async (input) => {
      try {
        assertBoundTarget(binding, input);
        const output = await workflows.campaignPause.plan({
          context: {
            requestId: `request.campaign-pause.${randomUUID()}`,
            scopeId: `scope.${binding.projectId}`,
            projectId: binding.projectId,
            environmentId: binding.environmentId,
            targetId: input.campaignId,
            principal: binding.principal,
            requestedAt: new Date().toISOString(),
          },
          parameters: {
            provider: input.provider,
            providerAccountId: input.providerAccountId,
            campaignId: input.campaignId,
            evidenceRevision: input.evidenceRevision,
            verificationDelayMs: input.verificationDelayMs,
            verificationTtlMs: input.verificationTtlMs,
          },
          currentEvidenceRevision: input.evidenceRevision,
          planTtlMs: input.planTtlMs,
        });
        return createOpsMcpToolResult(output, binding.maximumResultBytes);
      } catch (error) {
        return createOpsMcpErrorResult(campaignPauseSafeError(error));
      }
    },
  );

  server.registerTool(
    'review_campaign_pause',
    {
      title: 'Review a campaign pause',
      description:
        'Inspect the canonical plan, approval, receipt, verification state, and safe next step for one campaign-pause run.',
      inputSchema: growthCampaignPauseReviewToolInputSchema,
      annotations: readAnnotations,
    },
    async (input) => {
      try {
        assertBoundTarget(binding, input);
        const output = await workflows.campaignPause.show(input.runId);
        if (!output) {
          throw new OpsMcpSafeError(
            'campaign_pause_run_not_found',
            'The campaign-pause run was not found in this project and environment.',
          );
        }
        return createOpsMcpToolResult(output, binding.maximumResultBytes);
      } catch (error) {
        return createOpsMcpErrorResult(campaignPauseSafeError(error));
      }
    },
  );

  server.registerTool(
    'apply_approved_campaign_pause',
    {
      title: 'Apply an approved campaign pause',
      description:
        'Apply one exact campaign pause only after a separately recorded authoritative approval matches the current plan and evidence.',
      inputSchema: growthCampaignPauseApplyToolInputSchema,
      annotations: applyAnnotations,
    },
    async (input) => {
      try {
        assertBoundTarget(binding, input);
        const output = await workflows.campaignPause.apply({
          runId: input.runId,
          currentEvidenceRevision: input.currentEvidenceRevision,
          confirmTarget: input.confirmTarget,
          principal: binding.principal,
        });
        return createOpsMcpToolResult(output, binding.maximumResultBytes);
      } catch (error) {
        return createOpsMcpErrorResult(campaignPauseSafeError(error));
      }
    },
  );

  server.registerTool(
    'verify_campaign_pause',
    {
      title: 'Verify a campaign pause',
      description:
        'Read the provider campaign state inside the recorded verification window and update the canonical run review.',
      inputSchema: growthCampaignPauseVerifyToolInputSchema,
      annotations: verifyAnnotations,
    },
    async (input) => {
      try {
        assertBoundTarget(binding, input);
        const output = await workflows.campaignPause.verify({
          runId: input.runId,
          principal: binding.principal,
        });
        return createOpsMcpToolResult(output, binding.maximumResultBytes);
      } catch (error) {
        return createOpsMcpErrorResult(campaignPauseSafeError(error));
      }
    },
  );

  return server;
}

const campaignPauseErrors = Object.freeze([
  {
    marker: 'GROWTH_CAMPAIGN_PAUSE_MUTATION_DISABLED',
    code: 'campaign_pause_mutation_disabled',
    message: 'Campaign changes are disabled by the current Growth policy.',
  },
  {
    marker: 'GROWTH_CAMPAIGN_PAUSE_APPLY_DISABLED',
    code: 'campaign_pause_apply_disabled',
    message: 'The current Growth policy does not allow approved campaign changes.',
  },
  {
    marker: 'GROWTH_CAMPAIGN_PAUSE_RUN_NOT_FOUND',
    code: 'campaign_pause_run_not_found',
    message: 'The campaign-pause run was not found in this project and environment.',
  },
  {
    marker: 'GROWTH_CAMPAIGN_PAUSE_APPROVAL_REQUIRED',
    code: 'campaign_pause_approval_required',
    message:
      'A separately recorded exact-plan approval is required before this campaign can be paused.',
  },
  {
    marker: 'GROWTH_CAMPAIGN_PAUSE_TARGET_CONFIRMATION_MISMATCH',
    code: 'campaign_pause_target_confirmation_mismatch',
    message: 'Confirm the exact provider, account, and campaign returned by the run review.',
  },
  {
    marker: 'GROWTH_CAMPAIGN_PAUSE_LOCK_UNAVAILABLE',
    code: 'campaign_pause_lock_unavailable',
    message: 'Another campaign operation is active. Review the run before retrying.',
  },
  {
    marker: 'GROWTH_CAMPAIGN_PAUSE_RECEIPT_REQUIRED',
    code: 'campaign_pause_receipt_required',
    message: 'The approved pause must be applied before it can be verified.',
  },
] as const);

function campaignPauseSafeError(error: unknown): unknown {
  if (error instanceof OpsMcpSafeError) return error;
  const message = error instanceof Error ? error.message : '';
  const known = campaignPauseErrors.find((entry) => message.includes(entry.marker));
  return known ? new OpsMcpSafeError(known.code, known.message) : error;
}
