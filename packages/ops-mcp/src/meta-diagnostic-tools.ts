import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod/v4';
import {
  metaDiagnosticImportJsonSchema,
  metaDiagnosticObservationSchema,
  metaDiagnosticReviewJsonSchema,
  metaDiagnosticReviewInputSchema,
  metaDiagnosticImportResultSchema,
  metaDiagnosticReviewResultSchema,
} from '@unisane/growth/contracts';
import {
  assertBoundTarget,
  OpsMcpSafeError,
  type ValidatedLocalOpsMcpBinding,
  type OpsMcpGrowthWorkflows,
} from './contracts.js';
import { createOpsMcpToolResult, createOpsMcpErrorResult } from './tool-result.js';
const target = { projectId: z.string().min(1).max(100), environmentId: z.string().min(1).max(100) };
const importInput = z
  .object({
    ...target,
    observation: z
      .fromJSONSchema(metaDiagnosticImportJsonSchema)
      .transform((value) => metaDiagnosticObservationSchema.parse(value)),
  })
  .strict();
const reviewInput = z
  .object({
    ...target,
    query: z
      .fromJSONSchema(metaDiagnosticReviewJsonSchema)
      .transform((value) => metaDiagnosticReviewInputSchema.parse(value)),
  })
  .strict();
export function registerMetaDiagnosticTools(
  server: McpServer,
  binding: ValidatedLocalOpsMcpBinding,
  workflows: OpsMcpGrowthWorkflows,
) {
  server.registerTool(
    'import_meta_diagnostics',
    {
      description:
        'Save labelled historical Meta event diagnostic evidence locally for the selected dataset. No provider access or verification. Excludes raw customer data.',
      inputSchema: importInput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (raw) => {
      try {
        const input = importInput.parse(raw);
        assertBoundTarget(binding, input);
        assertBoundTarget(binding, input.observation);
        if (!workflows.importMetaDiagnostics)
          throw new OpsMcpSafeError(
            'diagnostics_unavailable',
            'This host does not supply diagnostic imports.',
          );
        const result = metaDiagnosticImportResultSchema.parse(
          await workflows.importMetaDiagnostics(input.observation),
        );
        assertBoundTarget(binding, result);
        if (
          result.datasetId !== input.observation.datasetId ||
          result.connectionId !== input.observation.connectionId
        )
          throw new OpsMcpSafeError(
            'diagnostics_mismatch',
            'Imported diagnostics belong to another event source.',
          );
        return createOpsMcpToolResult(result, binding.maximumResultBytes);
      } catch (error) {
        return createOpsMcpErrorResult(error);
      }
    },
  );
  server.registerTool(
    'review_meta_diagnostics',
    {
      description:
        'Inspect imported Meta events and issues, source freshness, unknown fields and unverified repair handoffs. Filter by eventName such as Purchase. Does not apply repairs or claim live tracking health.',
      inputSchema: reviewInput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (raw) => {
      try {
        const input = reviewInput.parse(raw);
        assertBoundTarget(binding, input);
        if (!workflows.reviewMetaDiagnostics)
          throw new OpsMcpSafeError(
            'diagnostics_unavailable',
            'This host does not supply diagnostic review.',
          );
        const result = metaDiagnosticReviewResultSchema.parse(
          await workflows.reviewMetaDiagnostics(input.query),
        );
        assertBoundTarget(binding, result);
        return createOpsMcpToolResult(result, binding.maximumResultBytes);
      } catch (error) {
        return createOpsMcpErrorResult(error);
      }
    },
  );
}
