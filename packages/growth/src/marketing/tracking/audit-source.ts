import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { loadMarketingRegistries } from '../registry/load-registries.js';
import type { MarketingConfig } from '../schema/marketing-config.js';
import { auditGoogleTagManagerManifest } from './audit-gtm.js';
import { auditProviderConversionMappings } from './audit-provider-conversions.js';
import { auditTrackingRequirements } from './audit-requirements.js';
import type {
  MarketingTrackingAuditCheck,
  MarketingTrackingAuditOptions,
  MarketingTrackingAuditReport,
  SourceFile,
} from './audit-types.js';
export type {
  MarketingTrackingAuditCheck,
  MarketingTrackingAuditOptions,
  MarketingTrackingAuditReport,
  MarketingTrackingAuditStatus,
  SourceFile,
} from './audit-types.js';

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
  config: MarketingConfig,
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
  config: MarketingConfig;
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

export async function auditMarketingTrackingSource(
  config: MarketingConfig,
  options: MarketingTrackingAuditOptions = {},
): Promise<MarketingTrackingAuditReport> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const roots = resolveSourceRoots(cwd, config, options);
  const files = roots.flatMap(collectSourceFiles);
  const registries = await loadMarketingRegistries(config, { cwd });
  const browserEvents = registries.events.value.events.filter(
    (event) => event.source === 'browser',
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
  );

  return {
    ok: checks.every((check) => check.status !== 'error'),
    cwd,
    scannedFileCount: files.length,
    checks,
  };
}
