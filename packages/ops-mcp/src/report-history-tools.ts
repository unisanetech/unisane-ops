import type { McpServer } from '@modelcontextprotocol/server';
import {
  growthReportEvidenceSchema,
  growthReportHistoryResultSchema,
} from '@unisane/growth/contracts';
import {
  growthReportHistoryToolInputSchema,
  growthReportReadToolInputSchema,
  assertBoundTarget,
  OpsMcpSafeError,
  type ValidatedLocalOpsMcpBinding,
  type OpsMcpGrowthWorkflows,
} from './contracts.js';
import { createOpsMcpToolResult, createOpsMcpErrorResult } from './tool-result.js';
export function registerGrowthReportHistoryTools(
  server: McpServer,
  binding: ValidatedLocalOpsMcpBinding,
  workflows: OpsMcpGrowthWorkflows,
) {
  server.registerTool(
    'collect_growth_report',
    {
      description:
        'Read Meta delivery evidence and save the bounded snapshot locally. No provider mutation. Returns a stable evidence reference.',
      inputSchema: growthReportReadToolInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (raw) => {
      try {
        const input = growthReportReadToolInputSchema.parse(raw);
        assertBoundTarget(binding, input);
        if (!workflows.collectReport)
          throw new OpsMcpSafeError(
            'report_unavailable',
            'This host does not supply report collection.',
          );
        const value = growthReportEvidenceSchema.parse(await workflows.collectReport(input.report));
        assertBoundTarget(binding, value.report);
        return createOpsMcpToolResult(value, binding.maximumResultBytes);
      } catch (error) {
        return createOpsMcpErrorResult(error);
      }
    },
  );
  server.registerTool(
    'read_growth_report_history',
    {
      description:
        'Read saved Meta reports for the selected project, environment and account without provider access. Use an evidence ID to retrieve a snapshot.',
      inputSchema: growthReportHistoryToolInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (raw) => {
      try {
        const input = growthReportHistoryToolInputSchema.parse(raw);
        assertBoundTarget(binding, input);
        if (!workflows.reportHistory)
          throw new OpsMcpSafeError(
            'report_unavailable',
            'This host does not supply report history.',
          );
        const value = growthReportHistoryResultSchema.parse(
          await workflows.reportHistory(input.query),
        );
        assertBoundTarget(binding, value);
        return createOpsMcpToolResult(value, binding.maximumResultBytes);
      } catch (error) {
        return createOpsMcpErrorResult(error);
      }
    },
  );
}
