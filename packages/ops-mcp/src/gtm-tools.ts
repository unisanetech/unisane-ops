import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod/v4';
import { googleTagManagerDiagnosisAction } from '@unisane/growth/actions';
import { googleTagManagerDiagnosisInputSchema } from '@unisane/growth/gtm';
import { assertBoundTarget, type ValidatedLocalOpsMcpBinding } from './contracts.js';
import { createOpsMcpErrorResult, createOpsMcpToolResult } from './tool-result.js';
export function registerGtmTools(server: McpServer, binding: ValidatedLocalOpsMcpBinding) {
  server.registerTool(
    'diagnose_gtm',
    {
      description:
        'Offline GTM desired-state and workspace diagnosis. Supply the project GTM manifest and optional normalized snapshot. Reports policy and ownership issues, proposed operation summaries and verification gaps. Does not contact Google or approve changes.',
      inputSchema: z
        .object({
          projectId: z.string(),
          environmentId: z.string(),
          manifest: z.record(z.string(), z.unknown()),
          snapshot: z.record(z.string(), z.unknown()).optional(),
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => {
      try {
        assertBoundTarget(binding, input);
        if (Buffer.byteLength(JSON.stringify(input)) > 1024 * 1024)
          throw new Error('GTM input exceeds 1 MiB.');
        const parsed = googleTagManagerDiagnosisInputSchema.parse({
          projectId: input.projectId,
          manifest: input.manifest,
          environment: input.environmentId,
          snapshot: input.snapshot,
        });
        const result = await googleTagManagerDiagnosisAction.execute(parsed, {
          requestId: 'gtm-diagnose',
          scopeId: `scope.${binding.projectId}`,
          projectId: binding.projectId,
          environmentId: binding.environmentId,
          principal: binding.principal,
          requestedAt: new Date().toISOString(),
        });
        return createOpsMcpToolResult(result, binding.maximumResultBytes);
      } catch (error) {
        return createOpsMcpErrorResult(error);
      }
    },
  );
}
