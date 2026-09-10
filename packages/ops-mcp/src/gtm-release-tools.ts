import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod/v4';
import {
  gtmReleaseCommandSchema,
  gtmReleaseReviewSchema,
  gtmReleaseResultSchema,
  gtmReleaseRecoverySchema,
  gtmReleasePreviewSchema,
} from '@unisane/growth/gtm';
import {
  assertBoundTarget,
  OpsMcpSafeError,
  type ValidatedLocalOpsMcpBinding,
  type OpsMcpGrowthWorkflows,
} from './contracts.js';
import { createOpsMcpToolResult, createOpsMcpErrorResult } from './tool-result.js';
export function registerGtmReleaseTools(
  server: McpServer,
  binding: ValidatedLocalOpsMcpBinding,
  workflows: OpsMcpGrowthWorkflows,
) {
  server.registerTool(
    'manage_gtm_release',
    {
      description:
        'Compile preview, prepare exact version/publish plans, review, apply a human-approved plan, or recover an attempt. Never grants approval. Creating a version removes its source workspace. Publication does not prove tracking delivery. Default local hosts block production/agent writes without durable state.',
      inputSchema: z
        .object({
          projectId: z.string(),
          environmentId: z.string(),
          operation: z.enum([
            'preview',
            'plan-version',
            'plan-publish',
            'review',
            'apply',
            'recover',
          ]),
          connectionId: z.string().optional(),
          workspaceId: z.string().regex(/^\d+$/).optional(),
          versionId: z.string().regex(/^\d+$/).optional(),
          name: z.string().optional(),
          planHash: z
            .string()
            .regex(/^[a-f0-9]{64}$/)
            .optional(),
          runId: z
            .string()
            .regex(/^gtmrelease\.[a-f0-9]{64}$/)
            .optional(),
        })
        .strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (raw) => {
      try {
        assertBoundTarget(binding, raw);
        const input = gtmReleaseCommandSchema.parse(
          Object.fromEntries(
            Object.entries(raw).filter(([key]) => key !== 'projectId' && key !== 'environmentId'),
          ),
        );
        if (input.operation === 'approve')
          throw new OpsMcpSafeError('human_approval_required', 'Use a human approval interface.');
        if (!workflows.gtmRelease)
          throw new OpsMcpSafeError(
            'gtm_release_unavailable',
            'This host does not supply GTM release workflows.',
          );
        const output = await workflows.gtmRelease(input);
        const result =
          input.operation === 'preview'
            ? gtmReleasePreviewSchema.parse(output)
            : input.operation === 'apply'
              ? gtmReleaseResultSchema.parse(output)
              : input.operation === 'recover'
                ? gtmReleaseRecoverySchema.parse(output)
                : gtmReleaseReviewSchema.parse(output);
        assertBoundTarget(
          binding,
          'plan' in result
            ? { projectId: result.plan.projectId, environmentId: result.plan.environment }
            : 'receipt' in result
              ? { projectId: result.receipt.projectId, environmentId: result.receipt.environment }
              : result,
        );
        if (
          'planHash' in input &&
          ('plan' in result
            ? result.plan.planHash
            : 'receipt' in result
              ? result.receipt.planHash
              : null) !== input.planHash
        )
          throw new Error('Wrong plan');
        if (input.operation === 'recover' && (!('runId' in result) || result.runId !== input.runId))
          throw new Error('Wrong run');
        return createOpsMcpToolResult(result, binding.maximumResultBytes);
      } catch (error) {
        return createOpsMcpErrorResult(error);
      }
    },
  );
}
