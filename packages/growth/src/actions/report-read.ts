import { z } from 'zod';
import {
  defineOpsReadAction,
  OpsActionExecutionError,
  type OpsActionContext,
} from '@unisane/ops-engine/actions';
import {
  growthReportReadInputSchema,
  growthReportReadOutputSchema,
  growthReportBindingSchema,
  growthReportSnapshotSchema,
  type GrowthReportBinding,
  type GrowthReportReadInput,
} from '../reports/contracts.js';
export function createGrowthReportReadAction(dependencies: {
  resolveBinding(context: OpsActionContext): Promise<unknown>;
  read(binding: GrowthReportBinding, input: GrowthReportReadInput): Promise<unknown>;
}) {
  return defineOpsReadAction({
    id: 'growth.reports.read',
    schemaVersion: 1,
    maximumEffect: 'read-network',
    inputSchema: z.custom<GrowthReportReadInput>(
      (value) => growthReportReadInputSchema.safeParse(value).success,
    ),
    outputSchema: growthReportReadOutputSchema,
    async execute(raw, context) {
      const input = growthReportReadInputSchema.parse(raw);
      const binding = growthReportBindingSchema.parse(await dependencies.resolveBinding(context));
      const fail = () => {
        throw new OpsActionExecutionError(
          'growth.reports.evidence-mismatch',
          'The report does not match the selected project, environment, account or requested window.',
        );
      };
      if (
        binding.projectId !== context.projectId ||
        binding.environmentId !== context.environmentId
      )
        fail();
      const snapshot = growthReportSnapshotSchema.parse(await dependencies.read(binding, input));
      if (
        (['projectId', 'environmentId', 'connectionId', 'accountId'] as const).some(
          (key) => snapshot.binding[key] !== binding[key],
        ) ||
        snapshot.reportType !== input.reportType ||
        snapshot.startDate !== input.startDate ||
        snapshot.endDate !== input.endDate ||
        snapshot.rows.some((row) => row.accountId !== binding.accountId)
      )
        fail();
      const rows = snapshot.rows.slice(0, input.rowLimit);
      return growthReportReadOutputSchema.parse({
        schemaVersion: 1,
        actionId: 'growth.reports.read',
        ...binding,
        reportType: snapshot.reportType,
        startDate: snapshot.startDate,
        endDate: snapshot.endDate,
        capturedAt: snapshot.capturedAt,
        timeZone: input.timeZone,
        timeZoneBasis: input.timeZone ? 'requested-not-verified' : 'unavailable',
        attributionBasis: 'provider-default-not-verified',
        persisted: false,
        partial: snapshot.partial,
        observedRowCount: snapshot.rows.length,
        rowsTruncated: rows.length < snapshot.rows.length,
        rows,
        presentation: {
          headline: `Read ${snapshot.rows.length} Meta ${input.reportType} ${snapshot.rows.length === 1 ? 'row' : 'rows'}${snapshot.partial ? ' from a partial collection' : ''}.`,
          whyItMatters:
            'Meta action types are separate provider-reported measurements, not canonical orders or an additive conversion total. Account timezone and attribution settings were not verified. This snapshot is not saved to history.',
        },
      });
    },
  });
}
