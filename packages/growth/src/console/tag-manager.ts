import type {
  MarketingConsoleConnection,
  MarketingConsoleConnectionAction,
  MarketingConsoleStatus,
  MarketingConsoleTagManager,
} from './contracts.js';

export type MarketingConsoleTagManagerArtifact = {
  path: string;
  observedAt: string;
  valid?: boolean;
  operationCount?: number;
  resourceCount?: number;
  accountId?: string;
  containerId?: string;
  workspaceId?: string;
  publicId?: string;
  containerPath?: string;
  workspacePath?: string;
};

function timestamp(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function commandAction(
  id: string,
  label: string,
  description: string,
  command: string,
): MarketingConsoleConnectionAction {
  return { id, label, description, command };
}

function statusForAccess(
  service: MarketingConsoleConnection['services'][number] | undefined,
): MarketingConsoleStatus {
  if (!service) return 'missing';
  if (service.state === 'current') return 'ready';
  if (
    service.state === 'failed' ||
    service.state === 'expired-access' ||
    service.state === 'partial-permission'
  ) {
    return 'blocked';
  }
  return 'warn';
}

function identityFrom(
  artifacts: Array<MarketingConsoleTagManagerArtifact | undefined>,
): MarketingConsoleTagManager['technical'] {
  const technical: MarketingConsoleTagManager['technical'] = {};
  for (const artifact of artifacts) {
    if (!artifact) continue;
    if (!technical.accountId && artifact.accountId) technical.accountId = artifact.accountId;
    if (!technical.containerId && artifact.containerId) {
      technical.containerId = artifact.containerId;
    }
    if (!technical.workspaceId && artifact.workspaceId) {
      technical.workspaceId = artifact.workspaceId;
    }
    if (!technical.publicId && artifact.publicId) technical.publicId = artifact.publicId;
    if (!technical.containerPath && artifact.containerPath) {
      technical.containerPath = artifact.containerPath;
    }
    if (!technical.workspacePath && artifact.workspacePath) {
      technical.workspacePath = artifact.workspacePath;
    }
  }
  return technical;
}

export function buildMarketingConsoleTagManager(input: {
  appId: string;
  environment: string;
  manifestChangedAt?: string;
  connection?: MarketingConsoleConnection;
  snapshot?: MarketingConsoleTagManagerArtifact;
  plan?: MarketingConsoleTagManagerArtifact;
  apply?: MarketingConsoleTagManagerArtifact;
  preview?: MarketingConsoleTagManagerArtifact;
  publish?: MarketingConsoleTagManagerArtifact;
}): MarketingConsoleTagManager {
  const tagManagerService = input.connection?.services.find(
    (service) => service.id === 'tag-manager',
  );
  const accessStatus = statusForAccess(tagManagerService);
  const planBoundary = Math.max(
    timestamp(input.snapshot?.observedAt),
    timestamp(input.manifestChangedAt),
  );
  const planCurrent = Boolean(
    input.plan && timestamp(input.plan.observedAt) >= planBoundary && input.plan.valid !== false,
  );
  const pendingChangeCount = planCurrent ? input.plan?.operationCount : undefined;
  const planStatus: MarketingConsoleStatus =
    input.plan?.valid === false
      ? 'blocked'
      : !planCurrent
        ? 'warn'
        : pendingChangeCount && pendingChangeCount > 0
          ? 'warn'
          : 'ready';
  const inventoryStatus: MarketingConsoleStatus = input.snapshot ? 'ready' : 'warn';
  const prepared =
    planCurrent &&
    pendingChangeCount !== undefined &&
    pendingChangeCount > 0 &&
    timestamp(input.apply?.observedAt) >= timestamp(input.plan?.observedAt);
  const previewCurrent =
    prepared && timestamp(input.preview?.observedAt) >= timestamp(input.apply?.observedAt);
  const overallStatus: MarketingConsoleStatus =
    accessStatus === 'blocked' || planStatus === 'blocked'
      ? 'blocked'
      : accessStatus !== 'ready' || inventoryStatus !== 'ready' || planStatus !== 'ready'
        ? 'warn'
        : 'ready';
  const connectionId = input.connection?.connectionId;
  const commandContext = [
    '--cwd .',
    `--app ${input.appId}`,
    `--env ${input.environment}`,
    ...(connectionId ? [`--connection ${connectionId}`] : []),
  ].join(' ');
  const actions = [
    commandAction(
      'gtm.refresh',
      'Refresh Tag Manager',
      'Read the selected Tag Manager workspace without changing it.',
      `unisane-ops growth gtm pull ${commandContext}`,
    ),
    commandAction(
      'gtm.review-changes',
      'Review changes',
      'Compare the project-owned measurement manifest with the current workspace and write a non-mutating plan.',
      `unisane-ops growth gtm plan ${commandContext}`,
    ),
    ...(pendingChangeCount && pendingChangeCount > 0 && !prepared
      ? [
          commandAction(
            'gtm.preview-apply',
            'Preview workspace update',
            'Compute the guarded workspace update without changing Tag Manager.',
            `unisane-ops growth gtm apply ${commandContext} --dry-run`,
          ),
        ]
      : []),
    ...(prepared && !previewCurrent
      ? [
          commandAction(
            'gtm.preview-workspace',
            'Check workspace preview',
            'Run the provider preview after the approved workspace update and record the result.',
            `unisane-ops growth gtm preview ${commandContext}`,
          ),
        ]
      : []),
  ];
  const checks = [
    {
      id: 'tag-manager-access',
      label: 'Tag Manager access',
      status: accessStatus,
      detail:
        tagManagerService?.issue ??
        tagManagerService?.accessLabel ??
        'Connect Google and select the Tag Manager container used by this project.',
    },
    {
      id: 'tag-manager-workspace',
      label: 'Workspace inventory',
      status: inventoryStatus,
      detail: input.snapshot
        ? `${input.snapshot.resourceCount ?? 'Recorded'} managed resources were read from the selected workspace.`
        : 'No current Tag Manager workspace snapshot is available.',
    },
    {
      id: 'tag-manager-drift',
      label: 'Desired versus current state',
      status: planStatus,
      detail:
        input.plan?.valid === false
          ? 'The latest change review failed manifest or policy validation.'
          : !planCurrent
            ? 'Changes have not been reviewed since the latest workspace sync or manifest edit.'
            : pendingChangeCount && pendingChangeCount > 0
              ? `${pendingChangeCount} proposed ${pendingChangeCount === 1 ? 'change needs' : 'changes need'} review before any workspace update.`
              : 'The reviewed desired state matches the current workspace.',
    },
    {
      id: 'tag-manager-preview',
      label: 'Workspace preview',
      status:
        pendingChangeCount && pendingChangeCount > 0
          ? previewCurrent
            ? ('ready' as const)
            : ('warn' as const)
          : input.preview
            ? ('ready' as const)
            : ('missing' as const),
      detail:
        pendingChangeCount && pendingChangeCount > 0
          ? previewCurrent
            ? 'The prepared workspace passed its latest preview check.'
            : 'Preview is required after an approved workspace update and before publication.'
          : input.preview
            ? 'The latest recorded workspace preview passed.'
            : 'No workspace preview has been recorded yet.',
    },
  ];
  const technical = identityFrom([
    input.preview,
    input.apply,
    input.plan,
    input.snapshot,
    input.publish,
  ]);
  if (input.snapshot) technical.snapshotPath = input.snapshot.path;
  if (input.plan) technical.planPath = input.plan.path;
  if (input.preview) technical.previewPath = input.preview.path;
  if (input.publish) technical.publishPath = input.publish.path;

  return {
    status: overallStatus,
    headline:
      overallStatus === 'blocked'
        ? 'Tag Manager needs access or validation repair.'
        : !planCurrent
          ? 'Review Tag Manager changes against the current workspace.'
          : pendingChangeCount && pendingChangeCount > 0
            ? `${pendingChangeCount} Tag Manager ${pendingChangeCount === 1 ? 'change is' : 'changes are'} ready for review.`
            : 'Tag Manager matches the reviewed desired state.',
    detail:
      'The project manifest remains the source of truth. Refresh and review are read-only; provider changes still require explicit approval and guarded commands.',
    ...(input.snapshot?.resourceCount !== undefined
      ? { resourceCount: input.snapshot.resourceCount }
      : {}),
    ...(pendingChangeCount !== undefined ? { pendingChangeCount } : {}),
    ...(input.snapshot ? { lastSyncedAt: input.snapshot.observedAt } : {}),
    ...(input.preview ? { lastPreviewAt: input.preview.observedAt } : {}),
    ...(input.publish ? { lastPublishedAt: input.publish.observedAt } : {}),
    checks,
    actions,
    technical,
  };
}
