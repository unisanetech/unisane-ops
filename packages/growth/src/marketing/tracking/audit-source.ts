import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { OpsReadinessFinding } from '@unisane/ops-engine/readiness';
import { loadMarketingRegistries } from '../registry/load-registries.js';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import { detectMarketingTrackingEmitters } from './audit-emitters.js';
import { auditGoogleTagManagerManifest } from './audit-gtm.js';
import {
  loadMarketingTrackingObservations,
  reconcileMarketingTrackingObservations,
} from './audit-observations.js';
import { auditProviderConversionMappings } from './audit-provider-conversions.js';
import { auditTrackingRequirements } from './audit-requirements.js';
import type {
  MarketingTrackingAuditCheck,
  MarketingTrackingAuditOptions,
  MarketingTrackingAuditReport,
  MarketingTrackingFinding,
  SourceFile,
} from './audit-types.js';
export type {
  MarketingTrackingAuditCheck,
  MarketingTrackingAuditOptions,
  MarketingTrackingAuditReport,
  MarketingTrackingAuditSummary,
  MarketingTrackingAuditStatus,
  MarketingTrackingCoverage,
  MarketingTrackingEmitter,
  MarketingTrackingEmitterId,
  MarketingTrackingFinding,
  MarketingTrackingFindingCategory,
  SourceFile,
} from './audit-types.js';
export {
  marketingTrackingCaptureEvidenceSchema,
  marketingTrackingCommerceEvidenceSchema,
  marketingTrackingConsentEvidenceSchema,
  marketingTrackingCustomerFieldEvidenceSchema,
  marketingTrackingDiagnosticEvidenceSchema,
  marketingTrackingEvidenceStateSchema,
  marketingTrackingIdentityDigestSchema,
  marketingTrackingObservationSchema,
  marketingTrackingObservationArtifactSchema,
  marketingTrackingObservationEmitterSchema,
  marketingTrackingObservationOutcomeSchema,
  marketingTrackingObservationWindowsSchema,
  marketingTrackingParameterEvidenceSchema,
  marketingTrackingParameterTypeSchema,
  marketingTrackingProviderReferenceSchema,
  marketingTrackingTransportFieldEvidenceSchema,
  marketingTrackingValidityStateSchema,
  migrateMarketingTrackingObservationArtifactV1,
  type MarketingTrackingEvidenceState,
  type MarketingTrackingObservation,
  type MarketingTrackingObservationArtifact,
} from './audit-observations.js';

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const IGNORED_DIRECTORIES = new Set([
  '.cache',
  '.git',
  '.next',
  '.turbo',
  '.unisane',
  '__tests__',
  'coverage',
  'dist',
  'node_modules',
  'types',
]);

const VENDOR_GLOBAL_PATTERNS = [
  { id: 'dataLayer', pattern: /\b(?:window\.)?dataLayer(?:\.push)?\b/ },
  { id: 'gtag', pattern: /\b(?:window\.)?gtag\s*\(/ },
  { id: 'fbq', pattern: /\b(?:window\.)?fbq\s*\(/ },
  { id: 'lintrk', pattern: /\b(?:window\.)?lintrk\s*\(/ },
  { id: 'ttq', pattern: /\b(?:window\.)?ttq\b/ },
] as const;

function ensureWithinCwd(cwd: string, resolvedPath: string): void {
  const normalizedCwd = path.resolve(cwd);
  const normalizedPath = path.resolve(resolvedPath);
  const cwdPrefix = normalizedCwd.endsWith(path.sep)
    ? normalizedCwd
    : `${normalizedCwd}${path.sep}`;
  if (normalizedPath !== normalizedCwd && !normalizedPath.startsWith(cwdPrefix)) {
    throw new Error(
      `[MARKETING_AUDIT_SOURCE_ROOT_OUTSIDE_CWD] Source root must stay inside the working directory: ${resolvedPath}`,
    );
  }
}

function collectSourceFiles(root: string): SourceFile[] {
  if (!existsSync(root)) return [];
  const files: SourceFile[] = [];
  const entries = readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        files.push(...collectSourceFiles(entryPath));
      }
      continue;
    }
    if (!entry.isFile() || !SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue;
    if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) continue;
    files.push({
      path: entryPath,
      source: readFileSync(entryPath, 'utf8'),
    });
  }
  return files;
}

function resolveSourceRoots(
  cwd: string,
  config: MarketingExecutionContext,
  options: MarketingTrackingAuditOptions,
): string[] {
  return (options.sourceRoots?.length ? options.sourceRoots : config.paths.sourceRoots)
    .map((sourceRoot) => path.resolve(cwd, sourceRoot))
    .filter((sourceRoot) => {
      ensureWithinCwd(cwd, sourceRoot);
      return existsSync(sourceRoot) && statSync(sourceRoot).isDirectory();
    });
}

function hasImport(files: SourceFile[], importPath: string): boolean {
  return files.some((file) => file.source.includes(importPath));
}

function hasLiteral(files: SourceFile[], literal: string): boolean {
  return files.some((file) => file.source.includes(literal));
}

function directVendorGlobalChecks(files: SourceFile[]): MarketingTrackingAuditCheck[] {
  const checks: MarketingTrackingAuditCheck[] = [];
  for (const file of files) {
    for (const vendor of VENDOR_GLOBAL_PATTERNS) {
      if (vendor.pattern.test(file.source)) {
        checks.push({
          id: `vendorGlobal.${vendor.id}`,
          status: 'error',
          message: `Direct ${vendor.id} usage found; emit through Unisane tracking/conversion surfaces instead.`,
          path: file.path,
        });
      }
    }
  }
  if (checks.length === 0) {
    checks.push({
      id: 'vendorGlobal.none',
      status: 'pass',
      message: 'No direct vendor tracking globals found in scanned source.',
    });
  }
  return checks;
}

function providerTransportChecks(args: {
  files: SourceFile[];
  config: MarketingExecutionContext;
  registries: Awaited<ReturnType<typeof loadMarketingRegistries>>;
}): MarketingTrackingAuditCheck[] {
  const checks: MarketingTrackingAuditCheck[] = [];
  const conversions = args.registries.conversions.value.conversions;
  const hasGoogleAdsMappings = conversions.some((conversion) => conversion.mappings.googleAds);
  const hasMetaCapiMappings = conversions.some(
    (conversion) => conversion.mappings.meta?.capiEventName,
  );

  if (args.config.providers.googleAds.state !== 'disabled' && hasGoogleAdsMappings) {
    checks.push({
      id: 'providers.googleAds.transport',
      status: hasImport(args.files, '@unisane/web-runtime/conversions/google-ads')
        ? 'pass'
        : 'warn',
      message: hasImport(args.files, '@unisane/web-runtime/conversions/google-ads')
        ? 'Google Ads server conversion transport is used in scanned source.'
        : 'Google Ads conversion mappings exist, but the Google Ads server transport was not found in scanned source.',
    });
  }

  if (args.config.providers.metaAds.state !== 'disabled' && hasMetaCapiMappings) {
    checks.push({
      id: 'providers.metaAds.capiTransport',
      status: hasImport(args.files, '@unisane/web-runtime/conversions/meta') ? 'pass' : 'warn',
      message: hasImport(args.files, '@unisane/web-runtime/conversions/meta')
        ? 'Meta CAPI server conversion transport is used in scanned source.'
        : 'Meta CAPI mappings exist, but a Meta CAPI server transport was not found in scanned source.',
    });
  }

  return checks;
}

function stableId(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^[.-]+|[.-]+$/g, '') || 'project'
  );
}

function findingChecks(findings: MarketingTrackingFinding[]): MarketingTrackingAuditCheck[] {
  return findings.map((finding) => ({
    id: finding.id,
    status: finding.severity === 'error' ? 'error' : 'warn',
    message: `${finding.title}. ${finding.detail}`,
    ...(finding.path ? { path: finding.path } : {}),
  }));
}

function buildReadinessFinding(input: {
  config: MarketingExecutionContext;
  generatedAt: string;
  status: 'ready' | 'attention' | 'blocked';
  summary: string;
  observationPath?: string;
  observationObservedAt?: string;
  observationFreshness: 'fresh' | 'stale' | 'unknown';
  scannedFileCount: number;
}): OpsReadinessFinding {
  const state =
    input.status === 'ready' ? 'ready' : input.status === 'blocked' ? 'conflicted' : 'partial';
  return {
    schemaVersion: 1,
    code: `growth.instrumentation.audit.${state}`,
    dimension: 'instrumentation',
    state,
    severity: input.status === 'ready' ? 'info' : input.status === 'blocked' ? 'error' : 'warning',
    projectId: stableId(input.config.platformId),
    environmentId: stableId(input.config.defaultEnvironment),
    summary: input.summary,
    blocking: input.status === 'blocked',
    observedAt: input.generatedAt,
    evidence: [
      {
        kind: 'tracking-audit',
        source: input.observationPath ?? 'project source and manifests',
        observedAt: input.observationObservedAt ?? input.generatedAt,
        freshness: input.observationFreshness,
        summary: `${input.scannedFileCount} source files inspected in audit-only mode.`,
      },
    ],
    ...(input.status !== 'ready'
      ? {
          nextAction: input.observationPath
            ? {
                id: 'growth.instrumentation.audit.review',
                label: 'Review tracking audit findings',
                description:
                  'Repair the named source, payload, consent, or environment issue and rerun the read-only audit.',
                command: {
                  path: ['growth', 'marketing', 'audit'],
                  args: ['--cwd', '.', '--observations', input.observationPath],
                  json: false,
                  maximumEffect: 'offline',
                },
                requiresConfirmation: false,
                requiresApproval: false,
              }
            : {
                id: 'growth.instrumentation.observations.capture',
                label: 'Provide tracking observations',
                description:
                  'Provide a read-only browser and server observation artifact for reconciliation.',
                file: input.config.paths.trackingObservations,
                requiresConfirmation: false,
                requiresApproval: false,
              },
        }
      : {}),
  };
}

export async function auditMarketingTrackingSource(
  config: MarketingExecutionContext,
  options: MarketingTrackingAuditOptions = {},
): Promise<MarketingTrackingAuditReport> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const roots = resolveSourceRoots(cwd, config, options);
  const files = roots.flatMap(collectSourceFiles);
  const registries = await loadMarketingRegistries(config, { cwd });
  const generatedAt = (options.now ?? new Date()).toISOString();
  const observations = loadMarketingTrackingObservations(
    cwd,
    options.observationsPath ?? config.paths.trackingObservations,
  );
  const reconciled = reconcileMarketingTrackingObservations({
    registries,
    loaded: observations,
    projectId: config.platformId,
    environment: config.defaultEnvironment,
    now: options.now,
  });
  const detected = detectMarketingTrackingEmitters({
    cwd,
    files,
    gtmManifestPath: config.paths.gtmManifest,
    observedEmitterIds: reconciled.observedEmitters,
  });
  const browserEvents = registries.events.value.events.filter(
    (event) => event.deliveryExpectation !== 'server-only',
  );
  const serverConversions = registries.conversions.value.conversions.filter(
    (conversion) => conversion.confirmationSource === 'server',
  );
  const checks: MarketingTrackingAuditCheck[] = [
    {
      id: 'sourceRoots',
      status: roots.length > 0 ? 'pass' : 'error',
      message:
        roots.length > 0
          ? `Scanning ${roots.length} source root(s).`
          : 'No configured source roots were found.',
    },
    ...directVendorGlobalChecks(files),
    {
      id: 'webTracking.import',
      status: hasImport(files, '@unisane/web-runtime/tracking') ? 'pass' : 'warn',
      message: hasImport(files, '@unisane/web-runtime/tracking')
        ? '@unisane/web-runtime/tracking is used in scanned source.'
        : '@unisane/web-runtime/tracking is not used in scanned source yet.',
    },
    {
      id: 'webConversions.import',
      status: hasImport(files, '@unisane/web-runtime/conversions') ? 'pass' : 'warn',
      message: hasImport(files, '@unisane/web-runtime/conversions')
        ? '@unisane/web-runtime/conversions is used in scanned source.'
        : '@unisane/web-runtime/conversions is not used in scanned source yet.',
    },
  ];

  for (const event of browserEvents) {
    checks.push({
      id: `events.${event.id}.usage`,
      status: hasLiteral(files, event.name) ? 'pass' : 'warn',
      message: hasLiteral(files, event.name)
        ? `Browser event ${event.name} appears in scanned source.`
        : `Browser event ${event.name} was not found in scanned source.`,
    });
  }

  for (const conversion of serverConversions) {
    checks.push({
      id: `conversions.${conversion.id}.usage`,
      status: hasLiteral(files, conversion.sourceEventId) ? 'pass' : 'warn',
      message: hasLiteral(files, conversion.sourceEventId)
        ? `Server conversion source event ${conversion.sourceEventId} appears in scanned source.`
        : `Server conversion source event ${conversion.sourceEventId} was not found in scanned source.`,
    });
  }

  checks.push(
    ...(await auditGoogleTagManagerManifest({
      config,
      registries,
      options: {
        cwd,
        missingStatus: 'warn',
      },
    })),
    ...auditProviderConversionMappings({
      config,
      registries,
    }),
    ...providerTransportChecks({
      files,
      config,
      registries,
    }),
    ...auditTrackingRequirements({
      registries,
      files,
    }),
    ...findingChecks([...detected.findings, ...reconciled.findings]),
  );

  const findings = [...detected.findings, ...reconciled.findings];
  const errorCount = checks.filter((check) => check.status === 'error').length;
  const warningCount = checks.filter((check) => check.status === 'warn').length;
  const status = errorCount > 0 ? 'blocked' : warningCount > 0 ? 'attention' : 'ready';
  const summary = {
    status,
    emitterCount: detected.emitters.length,
    findingCount: findings.length,
    errorCount,
    warningCount,
  } as const;
  const summaryText =
    status === 'ready'
      ? 'Tracking evidence matches the expected events and conversions.'
      : status === 'blocked'
        ? `${errorCount} tracking error${errorCount === 1 ? '' : 's'} make conversion evidence unreliable.`
        : `${warningCount} tracking warning${warningCount === 1 ? '' : 's'} need review.`;

  return {
    kind: 'unisane.growth.tracking-audit',
    version: 1,
    mode: 'audit-only',
    generatedAt,
    ok: status !== 'blocked',
    cwd,
    environment: config.defaultEnvironment,
    scannedFileCount: files.length,
    ...(observations.path ? { observationArtifactPath: observations.path } : {}),
    summary,
    coverage: reconciled.coverage,
    emitters: detected.emitters,
    findings,
    readiness: buildReadinessFinding({
      config,
      generatedAt,
      status,
      summary: summaryText,
      observationPath: observations.path,
      observationObservedAt: reconciled.evidenceObservedAt,
      observationFreshness: reconciled.evidenceFreshness,
      scannedFileCount: files.length,
    }),
    checks,
  };
}
