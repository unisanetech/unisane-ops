import path from 'node:path';
import { exists, readJson, stat, walk } from '../../utils/fs.js';
import { contentBriefIndexSchema } from '../schema/brief.js';
import { internalLinkPlanFileSchema } from '../schema/internal-link.js';
import { keywordCandidateFileSchema } from '../schema/keyword.js';
import { keywordMetricFileSchema } from '../schema/metric.js';
import { pageOpportunityFileSchema } from '../schema/opportunity.js';
import { seoPerformanceFileSchema } from '../schema/performance.js';
import type { SeoResearchConfig } from '../schema/config.js';
import { loadSeoResearchConfig } from '../workspace/config.js';
import { resolveSeoResearchWorkspacePaths } from '../workspace/paths.js';

export type SeoDoctorArtifactKind =
  | 'config'
  | 'manual-seeds'
  | 'keyword-candidates'
  | 'keyword-metrics'
  | 'opportunities'
  | 'briefs'
  | 'internal-links'
  | 'performance'
  | 'reports';

export type SeoDoctorArtifactStatus = 'missing' | 'fresh' | 'stale';

export type SeoDoctorArtifact = {
  kind: SeoDoctorArtifactKind;
  status: SeoDoctorArtifactStatus;
  path?: string;
  updatedAt?: string;
  ageHours?: number;
  count?: number;
};

export type SeoDoctorProvider = {
  id: 'csv-import' | 'google-ads' | 'ga4' | 'search-console';
  enabled: boolean;
  requiredEnv: string[];
  configuredEnv: string[];
  missingEnv: string[];
};

export type SeoDoctorResult = {
  ok: boolean;
  platformId: string;
  configSource: 'file' | 'default';
  configPath: string;
  patternPack: string;
  keywordPatternPack: string;
  providers: SeoDoctorProvider[];
  artifacts: SeoDoctorArtifact[];
  nextStep: string;
};

export type RunSeoDoctorOptions = {
  cwd?: string;
  platformId?: string;
  maxArtifactAgeHours?: number;
  env?: NodeJS.ProcessEnv;
};

type ArtifactProbe = {
  kind: SeoDoctorArtifactKind;
  directory?: string;
  file?: string;
  match?: (filePath: string) => boolean;
  count?: (filePath: string) => Promise<number | undefined>;
};

const DEFAULT_MAX_ARTIFACT_AGE_HOURS = 72;

export async function runSeoDoctor(options: RunSeoDoctorOptions = {}): Promise<SeoDoctorResult> {
  const loaded = await loadSeoResearchConfig({
    cwd: options.cwd,
    platformId: options.platformId,
  });
  const paths = resolveSeoResearchWorkspacePaths(loaded.cwd);
  const maxArtifactAgeHours = options.maxArtifactAgeHours ?? DEFAULT_MAX_ARTIFACT_AGE_HOURS;
  const env = options.env ?? process.env;
  const artifacts = await collectArtifacts({
    cwd: loaded.cwd,
    paths,
    maxArtifactAgeHours,
  });
  const providers = collectProviders(loaded.config, env);
  const nextStep = selectNextStep({
    configSource: loaded.source,
    artifacts,
    providers,
  });

  return {
    ok:
      loaded.source === 'file' &&
      artifacts.every((artifact) => artifact.status === 'fresh') &&
      providers.every((provider) => !provider.enabled || provider.missingEnv.length === 0),
    platformId: loaded.config.platformId,
    configSource: loaded.source,
    configPath: path.relative(loaded.cwd, loaded.configPath),
    patternPack: loaded.config.seoPatternPack,
    keywordPatternPack: loaded.config.keywordPatternPack,
    providers,
    artifacts,
    nextStep,
  };
}

async function collectArtifacts(options: {
  cwd: string;
  paths: ReturnType<typeof resolveSeoResearchWorkspacePaths>;
  maxArtifactAgeHours: number;
}): Promise<SeoDoctorArtifact[]> {
  const probes: ArtifactProbe[] = [
    {
      kind: 'config',
      file: options.paths.config,
    },
    {
      kind: 'manual-seeds',
      file: options.paths.manualSeeds,
    },
    {
      kind: 'keyword-candidates',
      directory: options.paths.normalized,
      match: (filePath) => filePath.endsWith('.json'),
      count: countCandidates,
    },
    {
      kind: 'keyword-metrics',
      directory: options.paths.normalized,
      match: (filePath) => filePath.endsWith('.json'),
      count: countMetrics,
    },
    {
      kind: 'opportunities',
      directory: options.paths.opportunities,
      match: (filePath) => filePath.endsWith('.json'),
      count: countOpportunities,
    },
    {
      kind: 'briefs',
      directory: options.paths.briefs,
      match: (filePath) => filePath.endsWith('briefs.index.json'),
      count: countBriefs,
    },
    {
      kind: 'internal-links',
      directory: options.paths.internalLinks,
      match: (filePath) => filePath.endsWith('.json'),
      count: countInternalLinks,
    },
    {
      kind: 'performance',
      directory: options.paths.normalized,
      match: (filePath) => filePath.endsWith('.json'),
      count: countPerformanceRecords,
    },
    {
      kind: 'reports',
      directory: options.paths.reports,
      match: (filePath) => filePath.endsWith('.md') || filePath.endsWith('.json'),
    },
  ];

  return Promise.all(
    probes.map((probe) =>
      collectArtifact({
        cwd: options.cwd,
        probe,
        maxArtifactAgeHours: options.maxArtifactAgeHours,
      }),
    ),
  );
}

async function collectArtifact(options: {
  cwd: string;
  probe: ArtifactProbe;
  maxArtifactAgeHours: number;
}): Promise<SeoDoctorArtifact> {
  const files = await findProbeFiles(options.probe);
  const candidates = await Promise.all(
    files.map(async (filePath) => ({
      filePath,
      stats: await stat(filePath),
      count: options.probe.count ? await options.probe.count(filePath) : undefined,
    })),
  );
  const usable = candidates
    .filter(
      (candidate) =>
        candidate.stats &&
        (!options.probe.count || candidate.count !== undefined) &&
        candidate.count !== 0,
    )
    .sort((left, right) => (right.stats?.mtimeMs ?? 0) - (left.stats?.mtimeMs ?? 0));
  const latest = usable[0];

  if (!latest?.stats) {
    return {
      kind: options.probe.kind,
      status: 'missing',
    };
  }

  const ageHours = (Date.now() - latest.stats.mtimeMs) / (60 * 60 * 1000);
  return {
    kind: options.probe.kind,
    status: ageHours > options.maxArtifactAgeHours ? 'stale' : 'fresh',
    path: path.relative(options.cwd, latest.filePath),
    updatedAt: latest.stats.mtime.toISOString(),
    ageHours: Math.round(ageHours * 10) / 10,
    count: latest.count,
  };
}

async function findProbeFiles(probe: ArtifactProbe): Promise<string[]> {
  if (probe.file) {
    return (await exists(probe.file)) ? [probe.file] : [];
  }
  if (!probe.directory || !(await exists(probe.directory))) {
    return [];
  }
  const files: string[] = [];
  for await (const filePath of walk(probe.directory)) {
    if (!probe.match || probe.match(filePath)) {
      files.push(filePath);
    }
  }
  return files;
}

async function countCandidates(filePath: string): Promise<number | undefined> {
  return parseCount(filePath, (value) => keywordCandidateFileSchema.parse(value).candidates.length);
}

async function countMetrics(filePath: string): Promise<number | undefined> {
  return parseCount(filePath, (value) => keywordMetricFileSchema.parse(value).metrics.length);
}

async function countOpportunities(filePath: string): Promise<number | undefined> {
  return parseCount(
    filePath,
    (value) => pageOpportunityFileSchema.parse(value).opportunities.length,
  );
}

async function countBriefs(filePath: string): Promise<number | undefined> {
  return parseCount(filePath, (value) => contentBriefIndexSchema.parse(value).briefs.length);
}

async function countInternalLinks(filePath: string): Promise<number | undefined> {
  return parseCount(filePath, (value) => internalLinkPlanFileSchema.parse(value).edges.length);
}

async function countPerformanceRecords(filePath: string): Promise<number | undefined> {
  return parseCount(filePath, (value) => seoPerformanceFileSchema.parse(value).records.length);
}

async function parseCount(
  filePath: string,
  parse: (value: unknown) => number,
): Promise<number | undefined> {
  try {
    return parse(await readJson(filePath));
  } catch {
    return undefined;
  }
}

function collectProviders(config: SeoResearchConfig, env: NodeJS.ProcessEnv): SeoDoctorProvider[] {
  return [
    createProviderStatus('csv-import', config.providers.csvImport.enabled, [], env),
    createProviderStatus(
      'google-ads',
      config.providers.googleAds.enabled,
      [
        config.providers.googleAds.developerTokenEnv,
        config.providers.googleAds.customerIdEnv,
        config.providers.googleAds.clientIdEnv,
        config.providers.googleAds.clientSecretEnv,
        config.providers.googleAds.refreshTokenEnv,
      ],
      env,
    ),
    createProviderStatus(
      'ga4',
      config.providers.ga4.enabled,
      [
        config.providers.ga4.propertyIdEnv,
        config.providers.ga4.clientIdEnv,
        config.providers.ga4.clientSecretEnv,
        config.providers.ga4.refreshTokenEnv,
      ],
      env,
    ),
    createProviderStatus(
      'search-console',
      config.providers.searchConsole.enabled,
      [
        config.providers.searchConsole.siteUrlEnv,
        config.providers.searchConsole.clientIdEnv,
        config.providers.searchConsole.clientSecretEnv,
        config.providers.searchConsole.refreshTokenEnv,
      ],
      env,
    ),
  ];
}

function createProviderStatus(
  id: SeoDoctorProvider['id'],
  enabled: boolean,
  requiredEnv: string[],
  env: NodeJS.ProcessEnv,
): SeoDoctorProvider {
  const configuredEnv = requiredEnv.filter((name) => env[name]?.trim());
  return {
    id,
    enabled,
    requiredEnv,
    configuredEnv,
    missingEnv: enabled ? requiredEnv.filter((name) => !env[name]?.trim()) : [],
  };
}

function selectNextStep(options: {
  configSource: 'file' | 'default';
  artifacts: SeoDoctorArtifact[];
  providers: SeoDoctorProvider[];
}): string {
  if (options.configSource !== 'file') {
    return 'Run seo keywords init to create the SEO research workspace config.';
  }
  const missingProvider = options.providers.find(
    (provider) => provider.enabled && provider.missingEnv.length > 0,
  );
  if (missingProvider) {
    return `Configure ${missingProvider.id} environment variables: ${missingProvider.missingEnv.join(', ')}.`;
  }
  const status = new Map(options.artifacts.map((artifact) => [artifact.kind, artifact.status]));
  if (status.get('manual-seeds') === 'missing') {
    return 'Add seed keywords to docs/seo/keyword-research/seeds/manual.seed.json.';
  }
  if (status.get('keyword-candidates') === 'missing') {
    return 'Run seo keywords expand with the configured keyword pattern pack.';
  }
  if (status.get('keyword-metrics') === 'missing') {
    return 'Import keyword metrics or fetch Google Ads keyword metrics.';
  }
  if (status.get('opportunities') === 'missing') {
    return 'Run seo opportunities plan to create page opportunities.';
  }
  if (status.get('briefs') === 'missing') {
    return 'Run seo briefs generate for approved or candidate opportunities.';
  }
  if (status.get('internal-links') === 'missing') {
    return 'Run seo internal-links plan to create the internal linking map.';
  }
  if (status.get('performance') === 'missing' || status.get('performance') === 'stale') {
    return 'Fetch or import fresh GA4/Search Console performance before optimization.';
  }
  const stale = options.artifacts.find((artifact) => artifact.status === 'stale');
  if (stale) {
    return `Refresh stale ${stale.kind} artifact before making decisions.`;
  }
  return 'Generate or review the SEO report, then choose the next approved opportunity to build.';
}
