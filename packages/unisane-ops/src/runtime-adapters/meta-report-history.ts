import { loadUnisaneOpsConfig } from '../config/loader.js';
import { z } from 'zod';
import { OpsActionExecutionError, opsPrincipalSchema } from '@unisane/ops-engine/actions';
import {
  createGrowthReportHistoryAction,
  createGrowthReportEvidence,
} from '@unisane/growth/actions';
import { growthReportHistoryInputSchema } from '@unisane/growth/contracts';
import { readLocalMetaReport, resolveLocalMetaReportBinding } from './meta-report-read.js';
import { LocalMetaReportStore } from './meta-report-store.js';
import type { GrowthProviderOperationDependencies } from './growth.js';
export async function collectLocalMetaReport(
  cwd: string,
  input: unknown,
  dependencies: GrowthProviderOperationDependencies,
) {
  const report = await readLocalMetaReport(cwd, input, dependencies);
  const { projectRoot } = await loadUnisaneOpsConfig(cwd);
  const binding = {
    projectId: report.projectId,
    environmentId: report.environmentId,
    connectionId: report.connectionId,
    accountId: report.accountId,
  };
  try {
    return await new LocalMetaReportStore(projectRoot, binding).put(
      createGrowthReportEvidence(report, (dependencies.now?.() ?? new Date()).toISOString()),
    );
  } catch {
    throw new OpsActionExecutionError(
      'growth.reports.storage-failed',
      'The report was read but could not be safely saved. Inspect local report storage before retrying.',
    );
  }
}
export async function readLocalMetaReportHistory(cwd: string, input: unknown) {
  const request = z
    .object({
      projectId: z.string(),
      environmentId: z.string(),
      principal: opsPrincipalSchema,
      query: z.unknown(),
    })
    .strict()
    .parse(input);
  const query = growthReportHistoryInputSchema.parse(request.query);
  const { projectRoot } = await loadUnisaneOpsConfig(cwd);
  const action = createGrowthReportHistoryAction({
    resolveBinding: (context) => resolveLocalMetaReportBinding(projectRoot, context.environmentId),
    load: (binding) => new LocalMetaReportStore(projectRoot, binding).list(),
  });
  try {
    return await action.execute(query, {
      requestId: 'report-history',
      scopeId: `scope.${request.projectId}`,
      projectId: request.projectId,
      environmentId: request.environmentId,
      principal: request.principal,
      requestedAt: new Date().toISOString(),
    });
  } catch {
    throw new OpsActionExecutionError(
      'growth.reports.history-failed',
      'Report history is missing, invalid or belongs to another project, or exceeds storage limits. Check the evidence reference and local storage.',
    );
  }
}
