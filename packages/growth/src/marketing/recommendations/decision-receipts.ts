import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  marketingRecommendationArtifactSchema,
  marketingRecommendationDecisionReceiptSchema,
  type MarketingRecommendationArtifact,
  type MarketingRecommendationDecision,
  type MarketingRecommendationDecisionReceipt,
} from '../schema/recommendation.js';
import { ensurePathWithinCwd } from '../reports/paths.js';

export type MarketingRecommendationDecisionOptions = {
  cwd?: string;
  inputPath: string;
  recommendationId: string;
  decision: MarketingRecommendationDecision;
  decidedBy?: string;
  approvalReference?: string;
  reason?: string;
  out?: string;
  now?: Date;
};

export type MarketingRecommendationDecisionResult = {
  ok: boolean;
  path: string;
  receipt: MarketingRecommendationDecisionReceipt;
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

function defaultDecisionReceiptPath(
  cwd: string,
  recommendationId: string,
  generatedAt: string,
): string {
  const safeId = recommendationId.replace(/[^a-zA-Z0-9._-]/g, '-');
  const safeTimestamp = generatedAt.replaceAll(':', '-').replaceAll('.', '-');
  return path.resolve(
    cwd,
    '.unisane',
    'marketing',
    'recommendations',
    'receipts',
    `recommendation-decision-${safeId}-${safeTimestamp}.json`,
  );
}

function nextWorkflowStep(
  decision: MarketingRecommendationDecision,
  approvalReferenceRequired: boolean,
): string {
  if (decision === 'rejected') {
    return 'Keep the rejection receipt with the recommendation history and regenerate recommendations after inputs or strategy change.';
  }
  if (approvalReferenceRequired) {
    return 'Use this strict-approval receipt only as input to a separate reviewed plan/apply workflow; live provider mutation still requires its own receipt.';
  }
  return 'Use this accepted recommendation receipt as input to the next reviewed plan; live provider mutation still requires a separate apply receipt.';
}

export function buildMarketingRecommendationDecisionReceipt(
  options: MarketingRecommendationDecisionOptions,
): MarketingRecommendationDecisionReceipt {
  const cwd = options.cwd ?? process.cwd();
  const inputPath = resolveInsideCwd(cwd, options.inputPath);
  const { artifact, hash } = readRecommendationArtifact(inputPath);
  const recommendation = artifact.recommendations.find(
    (candidate) => candidate.id === options.recommendationId,
  );
  if (!recommendation) {
    throw new Error(
      `[MARKETING_RECOMMENDATION_NOT_FOUND] Recommendation ${options.recommendationId} was not found in ${inputPath}.`,
    );
  }

  const reason = options.reason?.trim();
  const decidedBy = options.decidedBy?.trim();
  const approvalReference = options.approvalReference?.trim();
  const approverRequired =
    options.decision === 'accepted' && recommendation.approvalTier !== 'none';
  const approvalReferenceRequired =
    options.decision === 'accepted' && recommendation.approvalTier === 'strict';

  if (options.decision === 'rejected' && !reason) {
    throw new Error(
      '[MARKETING_RECOMMENDATION_REJECTION_REASON_REQUIRED] Rejected recommendations require --reason.',
    );
  }
  if (approverRequired && !decidedBy) {
    throw new Error(
      '[MARKETING_RECOMMENDATION_APPROVER_REQUIRED] Accepted standard/strict recommendations require --decided-by.',
    );
  }
  if (approvalReferenceRequired && !approvalReference) {
    throw new Error(
      '[MARKETING_RECOMMENDATION_APPROVAL_REF_REQUIRED] Accepted strict recommendations require --approval-ref.',
    );
  }

  const generatedAt = (options.now ?? new Date()).toISOString();
  return marketingRecommendationDecisionReceiptSchema.parse({
    kind: 'unisane.marketing.recommendation-decision-receipt',
    version: 1,
    generatedAt,
    platformId: artifact.platformId,
    appId: artifact.appId,
    nonMutating: true,
    liveMutationAllowed: false,
    recommendationArtifactPath: inputPath,
    recommendationArtifactHash: hash,
    recommendationArtifactGeneratedAt: artifact.generatedAt,
    recommendationId: recommendation.id,
    decision: options.decision,
    decidedBy: decidedBy || undefined,
    approvalReference: approvalReference || undefined,
    reason: reason || undefined,
    recommendation,
    linkedAlertIds: recommendation.alertIds,
    linkedExperimentIds: recommendation.experimentIds,
    policy: {
      acceptedRecommendationRequiresReceipt: true,
      rejectedRecommendationReasonRequired: options.decision === 'rejected',
      approverRequired,
      approvalReferenceRequired,
      liveMutationRequiresSeparatePlanApplyReceipt: true,
    },
    nextWorkflowStep: nextWorkflowStep(options.decision, approvalReferenceRequired),
  });
}

export function writeMarketingRecommendationDecisionReceipt(
  options: MarketingRecommendationDecisionOptions,
): MarketingRecommendationDecisionResult {
  const cwd = options.cwd ?? process.cwd();
  const receipt = buildMarketingRecommendationDecisionReceipt(options);
  const destination = options.out
    ? resolveInsideCwd(cwd, options.out)
    : defaultDecisionReceiptPath(cwd, receipt.recommendationId, receipt.generatedAt);
  ensurePathWithinCwd(cwd, destination);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return {
    ok: true,
    path: destination,
    receipt,
  };
}
