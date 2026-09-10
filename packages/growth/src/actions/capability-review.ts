import {
  defineOpsReadAction,
  OpsActionExecutionError,
  type OpsActionContext,
} from '@unisane/ops-engine/actions';
import { assessMarketingMetaConnection } from '../marketing/connections/meta.js';
import {
  growthCapabilityReviewInputSchema,
  growthCapabilityReviewOutputSchema,
  growthCapabilitySnapshotSchema,
  type GrowthCapabilitySnapshot,
  type GrowthCapabilityAccountState,
} from '../capabilities/contracts.js';

function assessAccount(
  snapshot: GrowthCapabilitySnapshot,
  assessment: GrowthCapabilitySnapshot['capabilities'][number]['assessment'],
  now: Date,
  maxAgeHours: number,
): { state: GrowthCapabilityAccountState; reasons: string[] } {
  const blocked = (state: GrowthCapabilityAccountState, reason: string) => ({
    state,
    reasons: [reason],
  });
  if (assessment === 'unmapped')
    return blocked('not-evaluated', 'Account requirements for this capability are not yet mapped.');
  const connection = snapshot.connection;
  if (!connection)
    return blocked('connection-missing', 'Connect Meta and select the intended resources.');
  if (snapshot.connectionId !== connection.connectionId)
    return blocked('connection-mismatch', 'The connection does not match project configuration.');
  const requiredServices = assessment === 'connection' ? [] : [assessment];
  const result = assessMarketingMetaConnection(connection, { now, requiredServices });
  if (!result.ready) return { state: result.state, reasons: result.issues.slice(0, 20) };
  const timestamps = [
    connection.lastVerifiedAt,
    ...(connection.grants ?? [])
      .filter((item) => requiredServices.includes(item.service))
      .map((item) => item.observedAt),
    ...result.services.flatMap((service) =>
      service.selectedResources.map((resource) => resource.observedAt),
    ),
  ];
  if (
    timestamps.some(
      (value) =>
        !value ||
        Date.parse(value) > now.getTime() ||
        now.getTime() - Date.parse(value) > maxAgeHours * 3_600_000,
    )
  ) {
    return blocked(
      'evidence-stale',
      'Refresh Meta connection verification; recorded access evidence is missing, stale or future-dated.',
    );
  }
  for (const service of result.services) {
    const selected = service.selectedResources.filter((item) =>
      ['ad-account', 'pixel', 'dataset'].includes(item.resourceType),
    );
    const configured = snapshot.configuredResources.filter(
      (item) =>
        item.service === service.service &&
        ['ad-account', 'pixel', 'dataset'].includes(item.resourceType),
    );
    const key = (item: (typeof selected)[number]) => `${item.resourceType}:${item.resourceId}`;
    if (
      !configured.length ||
      configured.length !== selected.length ||
      configured.some(
        (item) => item.state !== 'selected' || !selected.some((other) => key(item) === key(other)),
      ) ||
      new Set(configured.map(key)).size !== configured.length
    ) {
      return blocked(
        'resource-mismatch',
        'Configured resources and verified connection resources do not match exactly.',
      );
    }
  }
  return { state: 'recorded-ready', reasons: [] };
}

export function createGrowthCapabilityReviewAction(dependencies: {
  loadSnapshot(context: OpsActionContext): Promise<unknown> | unknown;
  now?: () => Date;
}) {
  return defineOpsReadAction({
    id: 'growth.capabilities.review',
    schemaVersion: 1,
    maximumEffect: 'offline',
    inputSchema: growthCapabilityReviewInputSchema,
    outputSchema: growthCapabilityReviewOutputSchema,
    async execute(input, context) {
      const snapshot = growthCapabilitySnapshotSchema.parse(
        await dependencies.loadSnapshot(context),
      );
      if (
        snapshot.projectId !== context.projectId ||
        snapshot.environmentId !== context.environmentId
      ) {
        throw new OpsActionExecutionError(
          'growth.capabilities.target-mismatch',
          'Capability evidence belongs to a different project or environment.',
        );
      }
      const now = (dependencies.now ?? (() => new Date()))();
      const capabilities = snapshot.capabilities.map((fact) => {
        const account = assessAccount(snapshot, fact.assessment, now, input.maxAgeHours);
        const reasons = [
          ...(fact.implementation !== 'implemented' ? [fact.nextStep] : []),
          ...(fact.hostState !== 'bound' ? [fact.hostReason] : []),
          ...account.reasons,
          ...(fact.executionSurfaces.length === 0
            ? ['No execution interface is exposed for this capability.']
            : []),
          ...(fact.effect === 'write-network'
            ? ['This review does not authorize provider changes.']
            : []),
        ].slice(0, 20);
        const status =
          fact.implementation === 'not-implemented'
            ? ('not-implemented' as const)
            : fact.implementation === 'implemented' &&
                fact.hostState === 'bound' &&
                account.state === 'recorded-ready' &&
                fact.effect === 'read-network' &&
                fact.executionSurfaces.length > 0
              ? ('ready-to-read' as const)
              : ('blocked' as const);
        return { ...fact, status, accountState: account.state, reasons };
      });
      const ready = capabilities.filter((item) => item.status === 'ready-to-read').length;
      return growthCapabilityReviewOutputSchema.parse({
        schemaVersion: 1,
        actionId: 'growth.capabilities.review',
        projectId: context.projectId,
        environmentId: context.environmentId,
        provider: 'meta',
        observedAt: now.toISOString(),
        connectionId: snapshot.connectionId,
        liveVerified: false,
        capabilities,
        presentation: {
          headline: `${ready} Meta capabilities have recorded prerequisites for reading.`,
          whyItMatters:
            'This is an offline review of configuration and recorded access. Actual execution rechecks credentials and provider state; no live request or change was made.',
        },
      });
    },
  });
}
