import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { opsPrincipalSchema, OpsActionExecutionError } from '@unisane/ops-engine/actions';
import { createGrowthReportReadAction, growthReportReadInputSchema } from '@unisane/growth/actions';
import { resolveMetaConnectionRecord, resolveSelectedMetaAdsAccount } from './meta-context.js';
import type { GrowthProviderOperationDependencies } from './growth.js';

export async function readLocalMetaReport(
  cwd: string,
  input: unknown,
  dependencies: GrowthProviderOperationDependencies,
) {
  const request = z
    .object({
      projectId: z.string().min(1),
      environmentId: z.string().min(1),
      principal: opsPrincipalSchema,
      report: z.custom<import('@unisane/growth/contracts').GrowthReportReadInput>(
        (value) => growthReportReadInputSchema.safeParse(value).success,
      ),
    })
    .strict()
    .parse(input);
  const now = dependencies.now ?? (() => new Date());
  const action = createGrowthReportReadAction({
    resolveBinding: (context) => resolveLocalMetaReportBinding(cwd, context.environmentId),
    async read(binding, report) {
      if (!dependencies.metaCredentialResolver)
        throw new OpsActionExecutionError(
          'growth.reports.unavailable',
          'The host has no Meta credential callback.',
        );
      const { connection, environment, provider } = await resolveMetaConnectionRecord(cwd, {
        environment: binding.environmentId,
        connection: binding.connectionId,
      });
      const selected = connection.resources.find(
        (resource) =>
          resource.service === 'ads-insights' &&
          resource.resourceType === 'ad-account' &&
          resource.state === 'selected',
      );
      const accountId = resolveSelectedMetaAdsAccount({
        connection,
        environment,
        requestedAccountId: selected?.resourceId ?? '',
      });
      if (
        connection.projectId !== binding.projectId ||
        `act_${accountId.replace(/^act_/, '')}` !== binding.accountId
      )
        throw new OpsActionExecutionError(
          'growth.reports.target-changed',
          'The selected account changed; review the connection and retry.',
        );
      try {
        const options = growthReportReadInputSchema.parse(report);
        const payload = await provider.pullMetaAdsReportWithHostCredential({
          connection,
          resolver: dependencies.metaCredentialResolver,
          accountId,
          options: {
            startDate: options.startDate,
            endDate: options.endDate,
            reportType: options.reportType,
            maxPages: options.maxPages,
            pageSize: options.pageSize,
            timeZone: options.timeZone,
          },
          fetch: dependencies.fetch ?? fetch,
        });
        return provider.normalizeMetaReportSnapshot({
          binding,
          request: options,
          payload,
          capturedAt: now().toISOString(),
        });
      } catch {
        throw new OpsActionExecutionError(
          'growth.reports.read-failed',
          'Meta report reading failed. Check connection access and the requested dates, then retry. No report was saved.',
        );
      }
    },
  });
  return action.execute(request.report, {
    requestId: `report.${randomUUID()}`,
    scopeId: `scope.${request.projectId}`,
    projectId: request.projectId,
    environmentId: request.environmentId,
    principal: request.principal,
    requestedAt: now().toISOString(),
  });
}

export async function resolveLocalMetaReportBinding(cwd: string, environmentIdInput: string) {
  const { connection, environment, environmentId } = await resolveMetaConnectionRecord(cwd, {
    environment: environmentIdInput,
  });
  const selected = connection.resources.find(
    (resource) =>
      resource.service === 'ads-insights' &&
      resource.resourceType === 'ad-account' &&
      resource.state === 'selected',
  );
  const accountId = resolveSelectedMetaAdsAccount({
    connection,
    environment,
    requestedAccountId: selected?.resourceId ?? '',
  });
  return {
    projectId: connection.projectId,
    environmentId,
    connectionId: connection.connectionId,
    accountId: accountId.startsWith('act_') ? accountId : `act_${accountId}`,
  };
}
