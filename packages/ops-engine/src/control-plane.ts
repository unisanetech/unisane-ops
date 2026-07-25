import path from 'node:path';

export type ControlPlaneFreshnessStatus = 'fresh' | 'stale' | 'missing' | 'unknown';
export interface ControlPlaneArtifactFreshness {
  status: ControlPlaneFreshnessStatus;
  generatedAt: string | null;
  checkedAt: string;
  ageMs: number | null;
  maxAgeMs: number | null;
  message: string;
}

export function assessControlPlaneArtifactFreshness(args: {
  generatedAt?: string | null;
  maxAgeMs?: number | null;
  now?: Date;
}): ControlPlaneArtifactFreshness {
  const checkedAt = args.now ?? new Date();
  const generatedAt = args.generatedAt?.trim() ? args.generatedAt : null;
  const maxAgeMs =
    typeof args.maxAgeMs === 'number' && Number.isFinite(args.maxAgeMs) ? args.maxAgeMs : null;
  if (!generatedAt) {
    return {
      status: 'missing',
      generatedAt: null,
      checkedAt: checkedAt.toISOString(),
      ageMs: null,
      maxAgeMs,
      message: 'No artifact timestamp is available.',
    };
  }
  const generatedTime = Date.parse(generatedAt);
  if (!Number.isFinite(generatedTime)) {
    return {
      status: 'unknown',
      generatedAt,
      checkedAt: checkedAt.toISOString(),
      ageMs: null,
      maxAgeMs,
      message: `Artifact timestamp is not parseable: ${generatedAt}`,
    };
  }
  const ageMs = Math.max(0, checkedAt.getTime() - generatedTime);
  const stale = maxAgeMs !== null && ageMs > maxAgeMs;
  return {
    status: stale ? 'stale' : 'fresh',
    generatedAt,
    checkedAt: checkedAt.toISOString(),
    ageMs,
    maxAgeMs,
    message: stale
      ? `Artifact is stale by ${ageMs - maxAgeMs}ms.`
      : 'Artifact freshness is acceptable.',
  };
}

export type ControlPlaneArtifactLane =
  | 'inventory'
  | 'plans'
  | 'receipts'
  | 'setup'
  | 'drift'
  | 'env'
  | 'cache'
  | 'proof';
export interface ControlPlaneJsonArtifact {
  path: string;
  relativePath: string;
}

export function ensureControlPlanePathInsideCwd(args: {
  cwd: string;
  candidate: string;
  errorCode?: string;
  label?: string;
}): string {
  const resolved = path.resolve(args.cwd, args.candidate);
  const normalizedCwd = path.resolve(args.cwd);
  const prefix = normalizedCwd.endsWith(path.sep) ? normalizedCwd : `${normalizedCwd}${path.sep}`;
  if (resolved !== normalizedCwd && !resolved.startsWith(prefix)) {
    throw new Error(
      `[${args.errorCode ?? 'CONTROL_PLANE_ARTIFACT_PATH_OUTSIDE_CWD'}] ${args.label ?? 'Artifact path'} must stay inside the working directory: ${args.candidate}`,
    );
  }
  return resolved;
}

export function resolveControlPlaneArtifactPath(args: {
  cwd: string;
  outputPath?: string;
  defaultRelativePath: string;
  errorCode?: string;
  label?: string;
}): ControlPlaneJsonArtifact {
  const artifactPath = ensureControlPlanePathInsideCwd({
    cwd: args.cwd,
    candidate: args.outputPath ?? args.defaultRelativePath,
    errorCode: args.errorCode,
    label: args.label,
  });
  return {
    path: artifactPath,
    relativePath: path.relative(path.resolve(args.cwd), artifactPath),
  };
}

function safeSegment(value: string, label: string): string {
  const trimmed = value.trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(trimmed)) {
    throw new Error(
      `[CONTROL_PLANE_INVALID_PATH_SEGMENT] ${label} must be a simple path segment: ${value}`,
    );
  }
  return trimmed;
}

export function providerArtifactRelativePath(args: {
  provider: string;
  environment: string;
  lane: ControlPlaneArtifactLane;
  filename: string;
  family?: string;
}): string {
  return path.join(
    '.unisane',
    'provider',
    safeSegment(args.provider, 'provider'),
    safeSegment(args.environment, 'environment'),
    safeSegment(args.lane, 'lane'),
    ...(args.family ? [safeSegment(args.family, 'family')] : []),
    safeSegment(args.filename, 'filename'),
  );
}

export function suiteArtifactRelativePath(args: {
  suite: string;
  environment: string;
  lane: ControlPlaneArtifactLane;
  filename: string;
  family?: string;
}): string {
  return path.join(
    '.unisane',
    safeSegment(args.suite, 'suite'),
    safeSegment(args.environment, 'environment'),
    safeSegment(args.lane, 'lane'),
    ...(args.family ? [safeSegment(args.family, 'family')] : []),
    safeSegment(args.filename, 'filename'),
  );
}

export function controlPlaneSafeArtifactStamp(date: Date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

export type ControlPlaneMutationRisk = 'none' | 'low' | 'medium' | 'high' | 'blocked';
export type ControlPlaneMutationIntent =
  | 'read'
  | 'verify'
  | 'create'
  | 'update'
  | 'delete'
  | 'spend_decrease'
  | 'pause_or_archive'
  | 'spend_increase'
  | 'launch_or_expand'
  | 'publish'
  | 'rollback'
  | 'blocked';

export function classifyControlPlaneMutationRisk(args: {
  intent: ControlPlaneMutationIntent;
  production?: boolean;
  destructive?: boolean;
  spendIncrease?: boolean;
}): ControlPlaneMutationRisk {
  if (args.intent === 'blocked') return 'blocked';
  if (args.intent === 'read' || args.intent === 'verify') return 'none';
  if (args.destructive) return args.production ? 'high' : 'medium';
  if (
    args.spendIncrease ||
    args.intent === 'spend_increase' ||
    args.intent === 'launch_or_expand'
  ) {
    return 'high';
  }
  if (args.intent === 'publish' || args.intent === 'rollback') return 'high';
  if (args.production) return 'medium';
  if (args.intent === 'spend_decrease' || args.intent === 'pause_or_archive') return 'medium';
  return 'low';
}

export function highestControlPlaneMutationRisk(
  risks: readonly ControlPlaneMutationRisk[],
): ControlPlaneMutationRisk {
  const rank: Record<ControlPlaneMutationRisk, number> = {
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
    blocked: 4,
  };
  return risks.reduce<ControlPlaneMutationRisk>(
    (highest, risk) => (rank[risk] > rank[highest] ? risk : highest),
    'none',
  );
}

export type ControlPlaneActor = 'codex' | 'developer' | 'automation' | 'unknown';
export interface ControlPlaneProviderContext {
  cwd: string;
  appId: string;
  provider: string;
  environment: string;
  configPath: string | null;
  profile: string | null;
  actor: ControlPlaneActor;
  generatedAt: string;
}

export function resolveControlPlaneProviderContext(args: {
  cwd?: string;
  appId?: string | null;
  provider: string;
  environment?: string | null;
  configPath?: string | null;
  profile?: string | null;
  actor?: ControlPlaneActor;
  now?: Date;
}): ControlPlaneProviderContext {
  const cwd = path.resolve(args.cwd ?? process.cwd());
  const configPath = args.configPath?.trim()
    ? ensureControlPlanePathInsideCwd({
        cwd,
        candidate: args.configPath,
        errorCode: 'CONTROL_PLANE_CONFIG_PATH_OUTSIDE_CWD',
        label: 'Config path',
      })
    : null;
  return {
    cwd,
    appId: args.appId?.trim() || path.basename(cwd),
    provider: args.provider,
    environment: args.environment?.trim() || 'dev',
    configPath,
    profile: args.profile?.trim() || null,
    actor: args.actor ?? 'codex',
    generatedAt: (args.now ?? new Date()).toISOString(),
  };
}

export type ControlPlaneAuthStatus =
  | 'ready'
  | 'missing'
  | 'expired'
  | 'insufficient_scope'
  | 'error';
export interface ControlPlaneAuthProfile {
  provider: string;
  profile: string;
  status: ControlPlaneAuthStatus;
  scopes: string[];
  requiredScopes: string[];
  expiresAt: string | null;
  secretStore: string;
  message: string;
}

export function hasRequiredControlPlaneScopes(args: {
  scopes: readonly string[];
  requiredScopes: readonly string[];
}): boolean {
  const granted = new Set(args.scopes);
  return args.requiredScopes.every((scope) => granted.has(scope));
}

export function createControlPlaneAuthProfile(args: {
  provider: string;
  profile: string;
  configured: boolean;
  credentialStored: boolean;
  scopes?: readonly string[];
  requiredScopes?: readonly string[];
  expiresAt?: string | null;
  secretStore?: string;
  missingMessage?: string;
  expired?: boolean;
}): ControlPlaneAuthProfile {
  const scopes = [...(args.scopes ?? [])];
  const requiredScopes = [...(args.requiredScopes ?? [])];
  const status: ControlPlaneAuthStatus = !args.configured
    ? 'missing'
    : args.expired
      ? 'expired'
      : !args.credentialStored
        ? 'missing'
        : !hasRequiredControlPlaneScopes({ scopes, requiredScopes })
          ? 'insufficient_scope'
          : 'ready';
  return {
    provider: args.provider,
    profile: args.profile,
    status,
    scopes,
    requiredScopes,
    expiresAt: args.expiresAt ?? null,
    secretStore: args.secretStore ?? 'local',
    message:
      status === 'ready'
        ? 'Auth profile is ready.'
        : (args.missingMessage ??
          'Login or token setup is required before provider API calls can run.'),
  };
}

export function missingControlPlaneAuthProfile(args: {
  provider: string;
  profile: string;
  requiredScopes?: string[];
  secretStore?: string;
  message?: string;
}): ControlPlaneAuthProfile {
  return {
    provider: args.provider,
    profile: args.profile,
    status: 'missing',
    scopes: [],
    requiredScopes: [...(args.requiredScopes ?? [])],
    expiresAt: null,
    secretStore: args.secretStore ?? 'local',
    message: args.message ?? 'Login is required before provider API calls can run.',
  };
}

export type ControlPlaneEnvValueKind =
  | 'bootstrap-local-secret'
  | 'local-devtool-config'
  | 'runtime-production'
  | 'provider-resource-ref'
  | 'fallback-debug';
export interface ControlPlaneEnvEntry {
  name: string;
  kind: ControlPlaneEnvValueKind;
  required: boolean;
  secret: boolean;
  configured: boolean;
  description: string;
  example: string | null;
}
export interface ControlPlaneEnvReport {
  schemaVersion: 1;
  kind: 'control-plane.env-report';
  provider: string;
  appId: string;
  environment: string;
  generatedAt: string;
  entries: ControlPlaneEnvEntry[];
}
export function publicControlPlaneEnvEntry(
  entry: Omit<ControlPlaneEnvEntry, 'configured'> & { value?: string | null },
): ControlPlaneEnvEntry {
  return {
    name: entry.name,
    kind: entry.kind,
    required: entry.required,
    secret: entry.secret,
    configured: Boolean(entry.value?.trim()),
    description: entry.description,
    example: entry.secret ? null : entry.example,
  };
}

export interface ControlPlaneInventoryArtifact<TResource = unknown> {
  schemaVersion: 1;
  kind: 'control-plane.inventory';
  provider: string;
  appId: string;
  environment: string;
  generatedAt: string;
  configPath: string | null;
  profile: string | null;
  resources: TResource[];
  warnings: string[];
  artifact?: ControlPlaneJsonArtifact;
}
export function createControlPlaneInventoryArtifact<TResource>(args: {
  provider: string;
  appId: string;
  environment: string;
  generatedAt?: string;
  configPath?: string | null;
  profile?: string | null;
  resources: TResource[];
  warnings?: string[];
}): ControlPlaneInventoryArtifact<TResource> {
  return {
    schemaVersion: 1,
    kind: 'control-plane.inventory',
    provider: args.provider,
    appId: args.appId,
    environment: args.environment,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    configPath: args.configPath ?? null,
    profile: args.profile ?? null,
    resources: args.resources,
    warnings: [...(args.warnings ?? [])],
  };
}

export type ControlPlanePlanActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'verify'
  | 'blocked'
  | 'no-op';
export interface ControlPlanePlanAction {
  id: string;
  type: ControlPlanePlanActionType;
  risk: ControlPlaneMutationRisk;
  summary: string;
  current: unknown;
  desired: unknown;
  requiresApproval: boolean;
  blocksApply: boolean;
}
export interface ControlPlanePlanArtifact {
  schemaVersion: 1;
  kind: 'control-plane.plan';
  provider: string;
  appId: string;
  environment: string;
  generatedAt: string;
  inventoryPath: string | null;
  actions: ControlPlanePlanAction[];
  summary: {
    create: number;
    update: number;
    delete: number;
    verify: number;
    blocked: number;
    noOp: number;
  };
  artifact?: ControlPlaneJsonArtifact;
}
export function summarizeControlPlanePlanActions(
  actions: readonly ControlPlanePlanAction[],
): ControlPlanePlanArtifact['summary'] {
  return actions.reduce<ControlPlanePlanArtifact['summary']>(
    (summary, action) => {
      if (action.type === 'create') summary.create += 1;
      if (action.type === 'update') summary.update += 1;
      if (action.type === 'delete') summary.delete += 1;
      if (action.type === 'verify') summary.verify += 1;
      if (action.type === 'blocked') summary.blocked += 1;
      if (action.type === 'no-op') summary.noOp += 1;
      return summary;
    },
    { create: 0, update: 0, delete: 0, verify: 0, blocked: 0, noOp: 0 },
  );
}

export type ControlPlaneReceiptStatus = 'succeeded' | 'failed' | 'partial' | 'dry-run';
export interface ControlPlaneReceiptActionResult {
  actionId: string;
  status: 'succeeded' | 'failed' | 'skipped';
  message: string;
}
export interface ControlPlaneApplyReceipt {
  schemaVersion: 1;
  kind: 'control-plane.apply-receipt';
  provider: string;
  appId: string;
  environment: string;
  status: ControlPlaneReceiptStatus;
  actor: ControlPlaneActor;
  risk: ControlPlaneMutationRisk;
  planPath: string;
  planHash: string;
  approvedBy: string | null;
  approvalRef: string | null;
  appliedAt: string;
  completedAt: string;
  results: ControlPlaneReceiptActionResult[];
  artifact?: ControlPlaneJsonArtifact;
}

export type ControlPlaneDriftSeverity = 'info' | 'warn' | 'error' | 'blocked';
export interface ControlPlaneDriftFinding {
  id: string;
  severity: ControlPlaneDriftSeverity;
  provider: string;
  resource: string;
  message: string;
  current: unknown;
  desired: unknown;
}
export interface ControlPlaneDriftReport {
  schemaVersion: 1;
  kind: 'control-plane.drift';
  provider: string;
  appId: string;
  environment: string;
  generatedAt: string;
  findings: ControlPlaneDriftFinding[];
}

export type ControlPlaneSetupCheckStatus = 'pass' | 'warn' | 'fail' | 'blocked' | 'unknown';
export type ControlPlaneActionOwner = 'codex' | 'developer' | 'provider' | 'automation';
export interface ControlPlaneSetupCheck {
  id: string;
  status: ControlPlaneSetupCheckStatus;
  title: string;
  message: string;
}
export interface ControlPlaneNextAction {
  id: string;
  owner: ControlPlaneActionOwner;
  title: string;
  message: string;
  command: string | null;
  risk: 'none' | 'low' | 'medium' | 'high' | 'blocked';
}
export interface ControlPlaneSetupStatus {
  schemaVersion: 1;
  kind: 'control-plane.setup-status';
  provider: string;
  appId: string;
  environment: string;
  generatedAt: string;
  ready: boolean;
  checks: ControlPlaneSetupCheck[];
  nextActions: ControlPlaneNextAction[];
}
export function controlPlaneSetupReady(checks: readonly ControlPlaneSetupCheck[]): boolean {
  return checks.every((check) => check.status === 'pass' || check.status === 'warn');
}

export type ControlPlaneApprovalRequirement =
  | 'none'
  | 'reviewed-plan'
  | 'exact-confirmation'
  | 'blocked';
export interface ControlPlaneApprovalPolicy {
  risk: ControlPlaneMutationRisk;
  requirement: ControlPlaneApprovalRequirement;
  receiptRequired: boolean;
  reason: string;
}
export function approvalPolicyForControlPlaneRisk(
  risk: ControlPlaneMutationRisk,
): ControlPlaneApprovalPolicy {
  if (risk === 'blocked') {
    return {
      risk,
      requirement: 'blocked',
      receiptRequired: true,
      reason: 'The requested mutation is blocked by control-plane policy.',
    };
  }
  if (risk === 'high') {
    return {
      risk,
      requirement: 'exact-confirmation',
      receiptRequired: true,
      reason: 'High-risk mutations require exact confirmation and a receipt.',
    };
  }
  if (risk === 'medium' || risk === 'low') {
    return {
      risk,
      requirement: 'reviewed-plan',
      receiptRequired: true,
      reason: 'Mutations require a reviewed plan and a receipt.',
    };
  }
  return {
    risk,
    requirement: 'none',
    receiptRequired: false,
    reason: 'Read-only or verification actions do not require mutation approval.',
  };
}
export function assertControlPlaneApproval(args: {
  risk: ControlPlaneMutationRisk;
  yes?: boolean;
  exactConfirm?: string | null;
  expectedExactConfirm?: string | null;
}): void {
  const policy = approvalPolicyForControlPlaneRisk(args.risk);
  if (policy.requirement === 'blocked') {
    throw new Error('[CONTROL_PLANE_APPLY_BLOCKED] This operation is blocked by policy.');
  }
  if (policy.requirement === 'reviewed-plan' && !args.yes) {
    throw new Error(
      '[CONTROL_PLANE_REVIEWED_PLAN_REQUIRED] Re-run with --yes after reviewing the plan.',
    );
  }
  if (policy.requirement === 'exact-confirmation') {
    if (!args.yes) {
      throw new Error(
        '[CONTROL_PLANE_REVIEWED_PLAN_REQUIRED] Re-run with --yes after reviewing the plan.',
      );
    }
    if (!args.expectedExactConfirm || args.exactConfirm !== args.expectedExactConfirm) {
      throw new Error(
        `[CONTROL_PLANE_EXACT_CONFIRMATION_REQUIRED] Expected confirmation '${args.expectedExactConfirm ?? '<missing>'}'.`,
      );
    }
  }
}

export function expectedControlPlaneProductionConfirmation(args: {
  environment: string;
  accountOrProject: string;
  operation: string;
}): string {
  return `${args.environment}:${args.accountOrProject}:${args.operation}`;
}
export function assertControlPlaneProductionConfirmation(args: {
  production: boolean;
  provided?: string | null;
  expected: string;
}): void {
  if (args.production && args.provided !== args.expected) {
    throw new Error(
      `[CONTROL_PLANE_PRODUCTION_CONFIRM_REQUIRED] Expected --production-confirm ${args.expected}.`,
    );
  }
}

const SECRET_NAME_PATTERN =
  /(secret|token|password|private[_-]?key|credential|developer[_-]?token|client[_-]?secret)/i;
export function isControlPlaneSecretName(name: string): boolean {
  return SECRET_NAME_PATTERN.test(name);
}
export function redactControlPlaneSecret(value: string | null | undefined): string | null {
  return value ? '<REDACTED>' : null;
}
export function redactControlPlaneObject<T>(value: T): T {
  if (Array.isArray(value)) {
    const entries: readonly unknown[] = value;
    return entries.map((entry) => redactControlPlaneObject(entry)) as T;
  }
  if (typeof value !== 'object' || value === null) return value;
  const redacted: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    redacted[key] = isControlPlaneSecretName(key)
      ? redactControlPlaneSecret(String(entry ?? ''))
      : redactControlPlaneObject(entry);
  }
  return redacted as T;
}
