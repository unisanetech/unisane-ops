import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ensurePathWithinCwd } from '../reports/paths.js';
import {
  marketingExperimentDecisionReceiptSchema,
  marketingExperimentDecisionSchema,
  marketingRecommendationArtifactSchema,
  type MarketingExperimentDecision,
  type MarketingExperimentDecisionReceipt,
  type MarketingRecommendationArtifact,
  type MarketingRecommendationExperiment,
} from '../schema/recommendation.js';

export type MarketingExperimentDecisionOptions = {
  cwd?: string;
  inputPath: string;
  experimentId: string;
  decision: MarketingExperimentDecision;
  decidedBy: string;
  result: 'won' | 'lost' | 'inconclusive';
  followUpAction: string;
  reason: string;
  out?: string;
  now?: Date;
};

export type MarketingExperimentDecisionResult = {
  ok: boolean;
  path: string;
  receipt: MarketingExperimentDecisionReceipt;
};

function resolveInsideCwd(cwd: string, maybePath: string): string {
  const resolved = path.resolve(cwd, maybePath);
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

function readRecommendationArtifact(inputPath: string): {
  artifact: MarketingRecommendationArtifact;
  hash: string;
} {
  const raw = readFileSync(inputPath, 'utf8');
  return {
    artifact: marketingRecommendationArtifactSchema.parse(JSON.parse(raw)),
    hash: createHash('sha256').update(raw).digest('hex'),
  };
}

function defaultExperimentDecisionPath(
  cwd: string,
  experiment: MarketingRecommendationExperiment,
  generatedAt: string,
): string {
  const safeId = experiment.id.replace(/[^a-zA-Z0-9._-]/g, '-');
  const safeTimestamp = generatedAt.replaceAll(':', '-').replaceAll('.', '-');
  return path.resolve(
    cwd,
    '.unisane',
    'marketing',
    'experiments',
    'decisions',
    `${safeId}-${safeTimestamp}.json`,
  );
}

function nextWorkflowStep(decision: MarketingExperimentDecision): string {
  if (decision === 'ship') {
    return 'Use this experiment decision as evidence for a separate recommendation decision and reviewed apply plan.';
  }
  if (decision === 'iterate' || decision === 'rerun') {
    return 'Create the next experiment draft with the preserved baseline and updated hypothesis.';
  }
  return 'Keep the experiment decision receipt with the recommendation history before regenerating recommendations.';
}

export function buildMarketingExperimentDecisionReceipt(
  options: MarketingExperimentDecisionOptions,
): MarketingExperimentDecisionReceipt {
  const cwd = options.cwd ?? process.cwd();
  const inputPath = resolveInsideCwd(cwd, options.inputPath);
  const { artifact, hash } = readRecommendationArtifact(inputPath);
  const experiment = artifact.experiments.find(
    (candidate) => candidate.id === options.experimentId,
  );
  if (!experiment) {
    throw new Error(
      `[MARKETING_EXPERIMENT_NOT_FOUND] Experiment ${options.experimentId} was not found in ${inputPath}.`,
    );
  }

  const decision = marketingExperimentDecisionSchema.parse(options.decision);
  const decidedBy = options.decidedBy.trim();
  const reason = options.reason.trim();
  const followUpAction = options.followUpAction.trim();
  if (!decidedBy) {
    throw new Error('[MARKETING_EXPERIMENT_DECIDED_BY_REQUIRED] --decided-by is required.');
  }
  if (!reason) {
    throw new Error('[MARKETING_EXPERIMENT_REASON_REQUIRED] --reason is required.');
  }
  if (!followUpAction) {
    throw new Error('[MARKETING_EXPERIMENT_FOLLOW_UP_REQUIRED] --follow-up-action is required.');
  }

  const generatedAt = (options.now ?? new Date()).toISOString();
  return marketingExperimentDecisionReceiptSchema.parse({
    kind: 'unisane.marketing.experiment-decision-receipt',
    version: 1,
    generatedAt,
    platformId: artifact.platformId,
    appId: artifact.appId,
    nonMutating: true,
    recommendationArtifactPath: inputPath,
    recommendationArtifactHash: hash,
    recommendationArtifactGeneratedAt: artifact.generatedAt,
    experimentId: experiment.id,
    decision,
    decidedBy,
    result: options.result,
    followUpAction,
    reason,
    experiment,
    policy: {
      recordsCompletedExperimentDecision: true,
      liveMutationRequiresRecommendationAndApplyReceipts: true,
      preservesBaseline: true,
    },
    nextWorkflowStep: nextWorkflowStep(decision),
  });
}

export function writeMarketingExperimentDecisionReceipt(
  options: MarketingExperimentDecisionOptions,
): MarketingExperimentDecisionResult {
  const cwd = options.cwd ?? process.cwd();
  const receipt = buildMarketingExperimentDecisionReceipt(options);
  const destination = options.out
    ? resolveInsideCwd(cwd, options.out)
    : defaultExperimentDecisionPath(cwd, receipt.experiment, receipt.generatedAt);
  ensurePathWithinCwd(cwd, destination);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return { ok: true, path: destination, receipt };
}
