import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ensurePathWithinCwd } from '../reports/paths.js';
import {
  marketingRecommendationArtifactSchema,
  type MarketingRecommendationAlert,
  type MarketingRecommendationArtifact,
} from '../schema/recommendation.js';
import {
  marketingAlertAcknowledgementReceiptSchema,
  type MarketingAlertAcknowledgementReceipt,
} from '../schema/alert.js';

export type MarketingAlertAcknowledgementOptions = {
  cwd?: string;
  inputPath: string;
  alertId: string;
  acknowledgedBy: string;
  reason?: string;
  out?: string;
  now?: Date;
};

export type MarketingAlertAcknowledgementResult = {
  ok: boolean;
  path: string;
  receipt: MarketingAlertAcknowledgementReceipt;
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

function defaultAcknowledgementPath(
  cwd: string,
  alert: MarketingRecommendationAlert,
  generatedAt: string,
): string {
  const safeId = alert.id.replace(/[^a-zA-Z0-9._-]/g, '-');
  const safeTimestamp = generatedAt.replaceAll(':', '-').replaceAll('.', '-');
  return path.resolve(
    cwd,
    '.unisane',
    'marketing',
    'alerts',
    'acknowledgements',
    `${safeId}-${safeTimestamp}.json`,
  );
}

function nextWorkflowStep(alert: MarketingRecommendationAlert): string {
  if (alert.severity === 'critical' || alert.severity === 'high') {
    return 'Keep the acknowledgement receipt, then resolve the root cause or regenerate recommendations before spend changes.';
  }
  return 'Keep the acknowledgement receipt with alert history and refresh recommendations after the underlying data changes.';
}

export function buildMarketingAlertAcknowledgementReceipt(
  options: MarketingAlertAcknowledgementOptions,
): MarketingAlertAcknowledgementReceipt {
  const cwd = options.cwd ?? process.cwd();
  const inputPath = resolveInsideCwd(cwd, options.inputPath);
  const { artifact, hash } = readRecommendationArtifact(inputPath);
  const alert = artifact.alerts.find((candidate) => candidate.id === options.alertId);
  if (!alert) {
    throw new Error(
      `[MARKETING_ALERT_NOT_FOUND] Alert ${options.alertId} was not found in ${inputPath}.`,
    );
  }

  const acknowledgedBy = options.acknowledgedBy.trim();
  const reason = options.reason?.trim();
  const highSeverityReasonRequired = alert.severity === 'critical' || alert.severity === 'high';
  if (!acknowledgedBy) {
    throw new Error('[MARKETING_ALERT_ACKNOWLEDGED_BY_REQUIRED] --acknowledged-by is required.');
  }
  if (highSeverityReasonRequired && !reason) {
    throw new Error(
      '[MARKETING_ALERT_ACK_REASON_REQUIRED] High and critical alerts require --reason.',
    );
  }

  const generatedAt = (options.now ?? new Date()).toISOString();
  return marketingAlertAcknowledgementReceiptSchema.parse({
    kind: 'unisane.marketing.alert-acknowledgement-receipt',
    version: 1,
    generatedAt,
    platformId: artifact.platformId,
    appId: artifact.appId,
    nonMutating: true,
    recommendationArtifactPath: inputPath,
    recommendationArtifactHash: hash,
    recommendationArtifactGeneratedAt: artifact.generatedAt,
    alertId: alert.id,
    status: 'acknowledged',
    acknowledgedBy,
    reason: reason || undefined,
    severity: alert.severity,
    rootCauseKey: alert.rootCauseKey,
    alert,
    policy: {
      deletesEvidence: false,
      highSeverityReasonRequired,
      recurringAlertsGroupedByRootCause: true,
    },
    nextWorkflowStep: nextWorkflowStep(alert),
  });
}

export function writeMarketingAlertAcknowledgementReceipt(
  options: MarketingAlertAcknowledgementOptions,
): MarketingAlertAcknowledgementResult {
  const cwd = options.cwd ?? process.cwd();
  const receipt = buildMarketingAlertAcknowledgementReceipt(options);
  const destination = options.out
    ? resolveInsideCwd(cwd, options.out)
    : defaultAcknowledgementPath(cwd, receipt.alert, receipt.generatedAt);
  ensurePathWithinCwd(cwd, destination);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return { ok: true, path: destination, receipt };
}
