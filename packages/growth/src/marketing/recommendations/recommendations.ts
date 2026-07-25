import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketingConfig } from '../schema/marketing-config.js';
import {
  marketingRecommendationArtifactSchema,
  type MarketingRecommendationArtifact,
} from '../schema/recommendation.js';
import { buildUnifiedMarketingReport } from '../reports/unified-report.js';
import { ensurePathWithinCwd } from '../reports/paths.js';
import {
  buildMarketingRecommendationContent,
  nextMarketingRecommendationWorkflowStep,
} from './recommendation-rules.js';

export type MarketingRecommendationOptions = {
  cwd?: string;
  maxAgeDays?: number;
  targetCpa?: number;
  spendSpikeAmount?: number;
  sourceRoots?: string[];
  out?: string;
  dryRun?: boolean;
  now?: Date;
};

export type MarketingRecommendationResult = {
  ok: boolean;
  dryRun: boolean;
  path?: string;
  artifact: MarketingRecommendationArtifact;
};

const DEFAULT_TARGET_CPA = 100;
const DEFAULT_SPEND_SPIKE_AMOUNT = 500;

function recommendationPath(cwd: string, generatedAt: string, out: string | undefined): string {
  const fallback = path.resolve(
    cwd,
    '.unisane',
    'marketing',
    'recommendations',
    `recommendations-${generatedAt.replaceAll(':', '-').replaceAll('.', '-')}.json`,
  );
  const resolved = out ? path.resolve(cwd, out) : fallback;
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

export async function buildMarketingRecommendations(
  config: MarketingConfig,
  options: MarketingRecommendationOptions = {},
): Promise<MarketingRecommendationArtifact> {
  const now = options.now ?? new Date();
  const maxAgeDays = options.maxAgeDays ?? 3;
  const targetCpa = options.targetCpa ?? DEFAULT_TARGET_CPA;
  const spendSpikeAmount = options.spendSpikeAmount ?? DEFAULT_SPEND_SPIKE_AMOUNT;
  const report = await buildUnifiedMarketingReport(config, {
    cwd: options.cwd,
    maxAgeDays,
    now,
    sourceRoots: options.sourceRoots,
  });
  const content = buildMarketingRecommendationContent({ report, targetCpa, spendSpikeAmount });
  const artifact = marketingRecommendationArtifactSchema.parse({
    kind: 'unisane.marketing.recommendations',
    version: 1,
    generatedAt: now.toISOString(),
    platformId: config.platformId,
    appId: config.appId,
    nonMutating: true,
    sourceReportGeneratedAt: report.generatedAt,
    thresholds: { maxAgeDays, targetCpa, spendSpikeAmount },
    alerts: content.alerts,
    recommendations: content.recommendations,
    experiments: content.experiments,
    blockers: content.blockers,
    decisionPolicy: {
      acceptedRecommendationRequiresReceipt: true,
      rejectedRecommendationAllowsReason: true,
      spendIncreasingRecommendationRequiresStrictApproval: true,
      trackingFixOutranksScaling: true,
    },
    nextWorkflowStep: 'placeholder',
  });
  return { ...artifact, nextWorkflowStep: nextMarketingRecommendationWorkflowStep(artifact) };
}

export async function writeMarketingRecommendations(
  config: MarketingConfig,
  options: MarketingRecommendationOptions = {},
): Promise<MarketingRecommendationResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const artifact = await buildMarketingRecommendations(config, options);
  const destination = recommendationPath(cwd, artifact.generatedAt, options.out);
  if (!options.dryRun) {
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  }
  return {
    ok: artifact.blockers.length === 0,
    dryRun: options.dryRun === true,
    path: options.dryRun ? undefined : destination,
    artifact,
  };
}
