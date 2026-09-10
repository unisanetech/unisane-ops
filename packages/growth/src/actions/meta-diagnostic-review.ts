import { z } from 'zod';
import { defineOpsReadAction, type OpsActionContext } from '@unisane/ops-engine/actions';
import {
  metaDiagnosticBindingSchema,
  metaDiagnosticReviewInputSchema,
  metaDiagnosticReviewResultSchema,
  type MetaDiagnosticBinding,
  type MetaDiagnosticReviewInput,
  type MetaDiagnosticReviewResult,
} from '../measurement/meta-diagnostics/contracts.js';
import { reviewMetaDiagnosticEvidence } from '../measurement/meta-diagnostics/service.js';
export function createMetaDiagnosticReviewAction(dependencies: {
  resolveBinding(context: OpsActionContext): Promise<unknown>;
  load(binding: MetaDiagnosticBinding): Promise<unknown | undefined>;
  now: () => Date;
}) {
  return defineOpsReadAction({
    id: 'growth.meta.diagnostics.review',
    schemaVersion: 1,
    maximumEffect: 'offline',
    inputSchema: z.custom<MetaDiagnosticReviewInput>(
      (value) => metaDiagnosticReviewInputSchema.safeParse(value).success,
    ),
    outputSchema: z.custom<MetaDiagnosticReviewResult>(
      (value) => metaDiagnosticReviewResultSchema.safeParse(value).success,
    ),
    async execute(raw, context) {
      const input = metaDiagnosticReviewInputSchema.parse(raw);
      const binding = metaDiagnosticBindingSchema.parse(await dependencies.resolveBinding(context));
      if (
        binding.projectId !== context.projectId ||
        binding.environmentId !== context.environmentId
      )
        throw new Error('Diagnostic action target mismatch.');
      return reviewMetaDiagnosticEvidence(
        binding,
        await dependencies.load(binding),
        input,
        dependencies.now(),
      );
    },
  });
}
