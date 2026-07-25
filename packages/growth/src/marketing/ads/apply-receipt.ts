import { createHash } from 'node:crypto';
import path from 'node:path';
import {
  marketingAdsApplyReceiptSchema,
  type MarketingAdsApplyPreview,
  type MarketingAdsApplyReceipt,
} from '../schema/ads-apply.js';
import type { MarketingAdsPlanArtifact } from '../schema/ads-plan.js';

export function defaultMarketingAdsApplyReceiptPath(
  cwd: string,
  environment: string,
  generatedAt: string,
): string {
  const safeTimestamp = generatedAt.replaceAll(':', '-').replaceAll('.', '-');
  return path.resolve(
    cwd,
    '.unisane',
    'marketing',
    environment,
    'receipts',
    `ads-apply-${safeTimestamp}.json`,
  );
}

export function hashMarketingAdsPlan(plan: MarketingAdsPlanArtifact): string {
  return createHash('sha256').update(JSON.stringify(plan)).digest('hex');
}

export function buildMarketingAdsApplyReceipt(input: {
  generatedAt: string;
  planHash: string;
  preview: MarketingAdsApplyPreview;
  previewPath: string;
}): MarketingAdsApplyReceipt {
  return marketingAdsApplyReceiptSchema.parse({
    kind: 'unisane.marketing.ads-apply-receipt',
    version: 1,
    generatedAt: input.generatedAt,
    status: input.preview.status === 'ready' ? 'previewed' : 'blocked',
    dryRun: true,
    liveMutationAllowed: false,
    platformId: input.preview.platformId,
    appId: input.preview.appId,
    environment: input.preview.environment,
    planPath: input.preview.planPath,
    planHash: input.planHash,
    previewPath: input.previewPath,
    previewStatus: input.preview.status,
    actor: {
      kind: 'devtools-cli',
      actorRef: 'redacted',
      secretValues: 'redacted',
    },
    providerAccounts: input.preview.confirmations
      .filter((confirmation) => confirmation.type === 'account' && confirmation.provider)
      .map((confirmation) => ({
        provider: confirmation.provider,
        accountRef: confirmation.expected.split(':')[2] ?? 'redacted',
        confirmationExpected: confirmation.expected,
        confirmationStatus: confirmation.status,
      })),
    blockers: input.preview.blockers,
    operationResults: input.preview.operations.map((operation) => ({
      operationId: operation.id,
      provider: operation.provider,
      strategyObjectId: operation.strategyObjectId,
      actionType: operation.actionType,
      attemptedAt: input.generatedAt,
      environment: input.preview.environment,
      safety: operation.safety,
      mutationIntent: operation.mutationIntent,
      approvalTier: operation.approvalTier,
      status:
        input.preview.status === 'ready' && operation.firstApplyEligible ? 'previewed' : 'blocked',
      message:
        input.preview.status === 'ready' && operation.firstApplyEligible
          ? 'Dry-run previewed as a first-apply-safe operation; no provider mutation was sent.'
          : 'Not eligible for first dry-run apply execution; live provider mutation remains disabled.',
    })),
  });
}
