import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/server';
import {
  gtmTrackingSetupInputSchema,
  gtmTrackingSetupInputJsonSchema,
  gtmTrackingSetupAction,
} from '@unisane/growth/gtm';
import { assertBoundTarget, type ValidatedLocalOpsMcpBinding } from './contracts.js';
import { createOpsMcpToolResult, createOpsMcpErrorResult } from './tool-result.js';
export function registerGtmSetupTools(server: McpServer, binding: ValidatedLocalOpsMcpBinding) {
  server.registerTool(
    'generate_gtm_tracking_setup',
    {
      description:
        'Generate a separate GTM manifest proposal for explicitly mapped GA4, Meta and Google Ads events. Requires data-layer paths and consent defaults. Does not replace configuration, contact providers or verify delivery.',
      inputSchema: z.fromJSONSchema(gtmTrackingSetupInputJsonSchema),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (raw) => {
      try {
        const input = gtmTrackingSetupInputSchema.parse(raw);
        assertBoundTarget(binding, {
          projectId: input.projectId,
          environmentId: input.environment,
        });
        const result = await gtmTrackingSetupAction.execute(input, {
          requestId: 'mcp-gtm-setup',
          scopeId: binding.projectId,
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
