import { z } from 'zod';
import { defineOpsReadAction, type OpsActionContext } from '@unisane/ops-engine/actions';
import { growthReportBindingSchema, type GrowthReportBinding } from '../reports/contracts.js';
import {
  growthReportHistoryInputSchema,
  growthReportHistoryResultSchema,
  type GrowthReportHistoryInput,
} from '../reports/history.js';
import { buildGrowthReportHistory } from '../reports/history-service.js';
export function createGrowthReportHistoryAction(dependencies: {
  resolveBinding(context: OpsActionContext): Promise<unknown>;
  load(binding: GrowthReportBinding): Promise<unknown[]>;
}) {
  return defineOpsReadAction({
    id: 'growth.reports.history',
    schemaVersion: 1,
    maximumEffect: 'offline',
    inputSchema: z.custom<GrowthReportHistoryInput>(
      (value) => growthReportHistoryInputSchema.safeParse(value).success,
    ),
    outputSchema: growthReportHistoryResultSchema,
    async execute(raw, context) {
      const input = growthReportHistoryInputSchema.parse(raw);
      const binding = growthReportBindingSchema.parse(await dependencies.resolveBinding(context));
      if (
        binding.projectId !== context.projectId ||
        binding.environmentId !== context.environmentId
      )
        throw new Error('Report history target mismatch.');
      return buildGrowthReportHistory(binding, await dependencies.load(binding), input);
    },
  });
}
