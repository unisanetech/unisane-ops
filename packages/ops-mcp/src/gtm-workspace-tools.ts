import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod/v4';
import {
  gtmWorkspaceReviewSchema,
  gtmWorkspaceApplyResultSchema,
  gtmWorkspaceRecoveryResultSchema,
} from '@unisane/growth/gtm';
import {
  assertBoundTarget,
  OpsMcpSafeError,
  type ValidatedLocalOpsMcpBinding,
  type OpsMcpGrowthWorkflows,
} from './contracts.js';
import { createOpsMcpToolResult, createOpsMcpErrorResult } from './tool-result.js';
export function registerGtmWorkspaceTools(
  server: McpServer,
  binding: ValidatedLocalOpsMcpBinding,
  workflows: OpsMcpGrowthWorkflows,
) {
  const target = { projectId: z.string(), environmentId: z.string() };
  const specs = [
    {
      operation: 'plan',
      name: 'plan_gtm_workspace',
      description:
        'Read the selected GTM workspace and persist an exact review plan. Uses the canonical project manifest. Does not approve or apply changes.',
    },
    {
      operation: 'review',
      name: 'review_gtm_workspace',
      description: 'Read a stored exact GTM workspace plan and proposed differences.',
    },
    {
      operation: 'apply',
      name: 'apply_approved_gtm_workspace',
      description:
        'Execute a workspace plan already approved by a human through Ops. Requires host state and a lease. Does not publish; started attempts cannot be replayed.',
    },
    {
      operation: 'recover',
      name: 'recover_gtm_workspace',
      description:
        'Reconcile an existing workspace attempt using provider reads. Records verification; never retries writes or claims browser tracking is verified.',
    },
  ] as const;
  for (const spec of specs) {
    const schema = z
      .object({
        ...target,
        ...(spec.operation === 'plan'
          ? { connectionId: z.string().min(1), workspaceId: z.string().regex(/^\d+$/) }
          : spec.operation === 'recover'
            ? { runId: z.string().regex(/^gtm\.[a-f0-9]{64}$/) }
            : { planHash: z.string().regex(/^[a-f0-9]{64}$/) }),
      })
      .strict();
    server.registerTool(
      spec.name,
      {
        description: spec.description,
        inputSchema: schema,
        annotations: {
          readOnlyHint: spec.operation === 'review',
          destructiveHint: spec.operation === 'apply',
          idempotentHint: spec.operation === 'review',
          openWorldHint: spec.operation !== 'review',
        },
      },
      async (raw) => {
        try {
          const input = schema.parse(raw);
          assertBoundTarget(binding, input);
          if (!workflows.gtmWorkspace)
            throw new OpsMcpSafeError(
              'gtm_workspace_unavailable',
              'This host does not supply GTM workspace execution.',
            );
          const parameters = Object.fromEntries(
            Object.entries(input).filter(([key]) => key !== 'projectId' && key !== 'environmentId'),
          );
          const output = await workflows.gtmWorkspace({ operation: spec.operation, ...parameters });
          const result =
            spec.operation === 'apply'
              ? gtmWorkspaceApplyResultSchema.parse(output)
              : spec.operation === 'recover'
                ? gtmWorkspaceRecoveryResultSchema.parse(output)
                : gtmWorkspaceReviewSchema.parse(output);
          const actual =
            'receipt' in result
              ? { projectId: result.receipt.projectId, environmentId: result.receipt.environment }
              : 'plan' in result
                ? { projectId: result.plan.projectId, environmentId: result.plan.environment }
                : result;
          assertBoundTarget(binding, actual);
          return createOpsMcpToolResult(result, binding.maximumResultBytes);
        } catch (error) {
          return createOpsMcpErrorResult(error);
        }
      },
    );
  }
}
