import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { log } from '../../log.js';
import { resolveControlPlaneWorkingDirectory } from '../../utils/control-plane-working-directory.js';
import {
  evaluateGoogleTagManagerPolicies,
  getGoogleTagManagerDesiredResources,
  validateGoogleTagManagerManifest,
  type GoogleTagManagerApiSnapshot,
  type GoogleTagManagerContainerManifest,
  type GoogleTagManagerIssue,
  type GoogleTagManagerPlan,
  type GoogleTagManagerReadSnapshotOptions,
  type GoogleTagManagerRemoteSnapshot,
  type GoogleTagManagerValidationResult,
} from '../../../gtm/index.js';
import { executeGrowthProviderCommand } from '../../provider-runtime.js';
import { resolveGoogleTagManagerAccessToken } from './auth.js';
import { loadGoogleTagManagerManifest } from './manifest-loader.js';

const GTM_AUTH_PROFILE_ENV = 'UNISANE_GTM_AUTH_PROFILE';

export type GoogleTagManagerCliOptions = {
  app?: string;
  env?: string;
  cwd?: string;
  manifest?: string;
  json?: boolean;
  output?: string;
  snapshot?: string;
  accessTokenEnv?: string;
  authProfile?: string;
  workspaceId?: string;
  workspaceName?: string;
  extended?: boolean;
  rateLimitMs?: string;
  dryRun?: boolean;
  yes?: boolean;
  name?: string;
  notes?: string;
  version?: string;
  fingerprint?: string;
  previewReceipt?: string;
  versionReceipt?: string;
  productionConfirm?: string;
  emergencyReason?: string;
  actor?: string;
  reconciliationTask?: string;
};

export type LoadedCommandContext = {
  cwd: string;
  manifest: GoogleTagManagerContainerManifest;
  manifestPath: string;
  environment: string;
};

export type ValidationSummary = {
  ok: boolean;
  manifest: GoogleTagManagerValidationResult;
  policy: GoogleTagManagerValidationResult;
  issues: readonly GoogleTagManagerIssue[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolveCwd(cwd?: string): string {
  return resolveControlPlaneWorkingDirectory(cwd);
}

function resolveEnvironment(manifest: GoogleTagManagerContainerManifest, env?: string): string {
  if (env && manifest.environments[env]) return env;
  if (env) {
    throw new Error(
      `[GTM_ENVIRONMENT_UNKNOWN] Environment '${env}' is not declared in the GTM manifest.`,
    );
  }
  const environments = Object.keys(manifest.environments);
  if (environments.length === 1 && environments[0]) return environments[0];
  throw new Error('[GTM_ENVIRONMENT_REQUIRED] Pass --env <name> for GTM commands.');
}

export async function loadCommandContext(
  options: GoogleTagManagerCliOptions,
): Promise<LoadedCommandContext> {
  const cwd = resolveCwd(options.cwd);
  const loaded = await loadGoogleTagManagerManifest({
    cwd,
    manifestPath: options.manifest,
    app: options.app,
  });
  if (!options.authProfile && !process.env[GTM_AUTH_PROFILE_ENV]) {
    options.authProfile = loaded.manifest.appId;
  }
  return {
    cwd,
    manifest: loaded.manifest,
    manifestPath: loaded.path,
    environment: resolveEnvironment(loaded.manifest, options.env),
  };
}

export function validationSummary(
  manifest: GoogleTagManagerContainerManifest,
  environment: string,
): ValidationSummary {
  const manifestResult = validateGoogleTagManagerManifest(manifest);
  const policyResult = evaluateGoogleTagManagerPolicies({ manifest, environment });
  const issues = [...manifestResult.issues, ...policyResult.issues];
  return {
    ok: manifestResult.ok && policyResult.ok,
    manifest: manifestResult,
    policy: policyResult,
    issues,
  };
}

export function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export function printIssues(issues: readonly GoogleTagManagerIssue[]): void {
  if (issues.length === 0) {
    log.success('No GTM manifest or policy issues found.');
    return;
  }

  for (const issue of issues) {
    const line = `${issue.severity.toUpperCase()} ${issue.code}${issue.path ? ` (${issue.path})` : ''}: ${issue.message}`;
    if (issue.severity === 'error') log.error(line);
    else log.warn(line);
  }
}

function timestampSegment(): string {
  return new Date().toISOString().replace(/[.:]/g, '-');
}

export function defaultArtifactPath(args: {
  cwd: string;
  appId: string;
  environment: string;
  kind: 'snapshots' | 'plans' | 'receipts' | 'previews' | 'versions' | 'publishes' | 'rollbacks';
  extension: 'json';
}): string {
  const filenameByKind = {
    snapshots: `gtm-snapshot-${timestampSegment()}.${args.extension}`,
    plans: `gtm-plan-${timestampSegment()}.${args.extension}`,
    receipts: `gtm-apply-receipt-${timestampSegment()}.${args.extension}`,
    previews: `gtm-preview-${timestampSegment()}.${args.extension}`,
    versions: `gtm-version-${timestampSegment()}.${args.extension}`,
    publishes: `gtm-publish-${timestampSegment()}.${args.extension}`,
    rollbacks: `gtm-rollback-${timestampSegment()}.${args.extension}`,
  };
  return path.join(
    args.cwd,
    '.unisane',
    'gtm',
    args.appId,
    args.environment,
    args.kind,
    filenameByKind[args.kind],
  );
}

export function writeJsonArtifact(args: {
  outputPath: string;
  value: unknown;
  dryRun?: boolean;
}): void {
  if (args.dryRun) return;
  mkdirSync(path.dirname(args.outputPath), { recursive: true });
  writeFileSync(args.outputPath, `${JSON.stringify(args.value, null, 2)}\n`);
}

export async function accessToken(
  options: GoogleTagManagerCliOptions,
  requiredScope: string,
): Promise<string> {
  return resolveGoogleTagManagerAccessToken({
    accessTokenEnv: options.accessTokenEnv,
    authProfile: options.authProfile,
    requiredScope,
  });
}

export function rateLimitMs(options: GoogleTagManagerCliOptions): number | undefined {
  if (!options.rateLimitMs) return undefined;
  const parsed = Number.parseInt(options.rateLimitMs, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('[GTM_RATE_LIMIT_INVALID] --rate-limit-ms must be a non-negative integer.');
  }
  return parsed;
}

export async function readRemoteSnapshot(args: {
  context: LoadedCommandContext;
  options: GoogleTagManagerCliOptions;
}): Promise<GoogleTagManagerRemoteSnapshot> {
  if (args.options.snapshot) {
    return readSnapshotFile({
      manifest: args.context.manifest,
      snapshotPath: path.resolve(args.context.cwd, args.options.snapshot),
    });
  }

  const options: GoogleTagManagerReadSnapshotOptions = {
    manifest: args.context.manifest,
    environment: args.context.environment,
    workspaceId: args.options.workspaceId,
    workspaceName: args.options.workspaceName,
    includeExtendedResources: args.options.extended,
  };
  return executeGrowthProviderCommand('gtm.provider.read-snapshot', {
    accessToken: await accessToken(args.options, 'tagmanager.readonly'),
    rateLimitMs: rateLimitMs(args.options),
    options: {
      ...options,
      desiredResources: getGoogleTagManagerDesiredResources(args.context.manifest),
    },
  });
}

async function readSnapshotFile(args: {
  manifest: GoogleTagManagerContainerManifest;
  snapshotPath: string;
}): Promise<GoogleTagManagerRemoteSnapshot> {
  const parsed = JSON.parse(readFileSync(args.snapshotPath, 'utf8')) as unknown;
  if (isRemoteSnapshot(parsed)) return parsed;
  if (isApiSnapshot(parsed)) {
    return executeGrowthProviderCommand('gtm.provider.normalize-snapshot', {
      manifest: args.manifest,
      snapshot: parsed,
      desiredResources: getGoogleTagManagerDesiredResources(args.manifest),
    });
  }
  throw new Error(
    `[GTM_SNAPSHOT_INVALID] Snapshot at ${args.snapshotPath} must be a GoogleTagManagerRemoteSnapshot or GoogleTagManagerApiSnapshot.`,
  );
}

function isRemoteSnapshot(value: unknown): value is GoogleTagManagerRemoteSnapshot {
  if (!isRecord(value)) return false;
  return typeof value.containerPath === 'string' && Array.isArray(value.resources);
}

function isApiSnapshot(value: unknown): value is GoogleTagManagerApiSnapshot {
  if (!isRecord(value)) return false;
  const resources = value.resources;
  return (
    typeof value.accountId === 'string' &&
    typeof value.containerId === 'string' &&
    typeof value.workspacePath === 'string' &&
    isRecord(resources) &&
    Array.isArray(resources.tags)
  );
}

export function printPlan(plan: GoogleTagManagerPlan): void {
  if (plan.operations.length === 0) {
    log.success('GTM desired state matches the remote snapshot.');
    return;
  }

  log.info(`GTM plan has ${plan.operations.length} operation(s).`);
  for (const operation of plan.operations) {
    log.dim(`  ${operation.type} ${operation.kind}:${operation.slug}`);
  }
}

export function handleCommandError(error: unknown, options: GoogleTagManagerCliOptions): number {
  const message = error instanceof Error ? error.message : 'Unknown GTM command error';
  if (options.json) printJson({ ok: false, error: message });
  else log.error(message);
  return 1;
}
