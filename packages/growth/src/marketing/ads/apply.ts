import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import {
  marketingAdsPlanArtifactSchema,
  type MarketingAdsPlanArtifact,
  type MarketingAdsPlanProvider,
} from '../schema/ads-plan.js';
import {
  marketingAdsApplyPreviewSchema,
  marketingAdsApplyReceiptSchema,
  marketingAdsLiveExecutionReceiptSchema,
  type MarketingAdsApplyConfirmation,
  type MarketingAdsApplyOperation,
  type MarketingAdsApplyPreview,
  type MarketingAdsApplyReceipt,
  type MarketingAdsLiveExecutionReceipt,
  type MarketingAdsLiveExecutorMode,
} from '../schema/ads-apply.js';
import type { FetchLike } from '../providers/api-pull-types.js';
import { ensurePathWithinCwd } from '../reports/paths.js';
import { withMarketingAdsApplyLock } from './apply-lock.js';
import {
  buildMarketingAdsApplyOperations,
  uniqueMarketingAdsPlanProviders,
} from './apply-policy.js';
import {
  buildMarketingAdsApplyReceipt,
  defaultMarketingAdsApplyReceiptPath,
  hashMarketingAdsPlan,
} from './apply-receipt.js';
import {
  executeMarketingAdsLiveOperation,
  type MarketingAdsLiveProviderExecutors,
} from './executors.js';

export type MarketingAdsApplyOptions = {
  cwd?: string;
  planPath: string;
  dryRun?: boolean;
  yes?: boolean;
  accountConfirm?: string;
  productionConfirm?: string;
  out?: string;
  now?: Date;
};

export type MarketingAdsLiveApplyOptions = {
  cwd?: string;
  planPath: string;
  receiptPath: string;
  yes?: boolean;
  accountConfirm?: string;
  productionConfirm?: string;
  operationConfirm?: string;
  approvalRef?: string;
  liveExecutorMode?: MarketingAdsLiveExecutorMode;
  providerExecutors?: MarketingAdsLiveProviderExecutors;
  providerCredentials?: Parameters<
    typeof executeMarketingAdsLiveOperation
  >[0]['providerCredentials'];
  out?: string;
  env?: Record<string, string | undefined>;
  fetch?: FetchLike;
  now?: Date;
  apiVersion?: string;
};

export type MarketingAdsApplyResult = {
  ok: boolean;
  dryRun: true;
  path?: string;
  receiptPath?: string;
  preview: MarketingAdsApplyPreview;
  receipt?: MarketingAdsApplyReceipt;
};

export type MarketingAdsLiveApplyResult = {
  ok: boolean;
  path?: string;
  receipt: MarketingAdsLiveExecutionReceipt;
};

function resolveInsideCwd(cwd: string, maybePath: string): string {
  const resolved = path.resolve(cwd, maybePath);
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

function readAdsPlan(
  cwd: string,
  planPath: string,
): { resolvedPath: string; plan: MarketingAdsPlanArtifact } {
  const resolvedPath = resolveInsideCwd(cwd, planPath);
  if (!existsSync(resolvedPath)) {
    throw new Error(`[ADS_APPLY_PLAN_NOT_FOUND] Ads plan was not found at ${resolvedPath}.`);
  }
  return {
    resolvedPath,
    plan: marketingAdsPlanArtifactSchema.parse(JSON.parse(readFileSync(resolvedPath, 'utf8'))),
  };
}

function readDryRunReceipt(
  cwd: string,
  receiptPath: string,
): { resolvedPath: string; receipt: MarketingAdsApplyReceipt } {
  const resolvedPath = resolveInsideCwd(cwd, receiptPath);
  if (!existsSync(resolvedPath)) {
    throw new Error(
      `[ADS_LIVE_RECEIPT_NOT_FOUND] Ads apply receipt was not found at ${resolvedPath}.`,
    );
  }
  return {
    resolvedPath,
    receipt: marketingAdsApplyReceiptSchema.parse(JSON.parse(readFileSync(resolvedPath, 'utf8'))),
  };
}

function defaultApplyPreviewPath(cwd: string, environment: string, generatedAt: string): string {
  const safeTimestamp = generatedAt.replaceAll(':', '-').replaceAll('.', '-');
  return path.resolve(
    cwd,
    '.unisane',
    'marketing',
    environment,
    'apply-previews',
    `ads-apply-${safeTimestamp}.json`,
  );
}

function outputPath(cwd: string, fallback: string, out: string | undefined): string {
  const resolved = out ? path.resolve(cwd, out) : fallback;
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

function confirmationValues(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function providerAccountConfirmation(args: {
  config: MarketingExecutionContext;
  provider: MarketingAdsPlanProvider;
  provided: Set<string>;
}): MarketingAdsApplyConfirmation {
  const provider = args.config.providers[args.provider];
  const accountRef = provider.accountIdEnv ?? `${args.provider}.accountIdEnv`;
  const expected = `${args.config.defaultEnvironment}:${args.provider}:${accountRef}:ads-apply`;
  const confirmed = args.provided.has(expected);
  return {
    type: 'account',
    provider: args.provider,
    expected,
    provided: confirmed,
    status: confirmed ? 'confirmed' : 'missing',
  };
}

function productionConfirmation(args: {
  config: MarketingExecutionContext;
  provided: string | undefined;
}): MarketingAdsApplyConfirmation | undefined {
  const environment = args.config.environments[args.config.defaultEnvironment];
  if (!environment?.production) return undefined;
  const expected = `${args.config.defaultEnvironment}:${args.config.platformId}:${args.config.appId}:ads-apply`;
  const confirmed = args.provided === expected;
  return {
    type: 'production',
    expected,
    provided: confirmed,
    status: confirmed ? 'confirmed' : 'missing',
  };
}

function blockersFor(args: {
  plan: MarketingAdsPlanArtifact;
  confirmations: MarketingAdsApplyConfirmation[];
  operations: MarketingAdsApplyOperation[];
}): string[] {
  const blockers = new Set<string>();
  if (args.plan.status === 'draft') blockers.add('plan_status_not_reviewed');
  for (const blocker of args.plan.blockers) blockers.add(`plan_blocker:${blocker}`);
  for (const candidate of args.plan.candidates) {
    for (const blocker of candidate.blockers) {
      blockers.add(
        `candidate_blocker:${candidate.provider}:${candidate.strategyObjectId}:${blocker}`,
      );
    }
  }
  for (const confirmation of args.confirmations) {
    if (confirmation.status === 'missing') {
      blockers.add(
        confirmation.type === 'account'
          ? `missing_account_confirmation:${confirmation.provider}`
          : 'missing_production_confirmation',
      );
    }
  }
  if (!args.operations.some((operation) => operation.firstApplyEligible)) {
    blockers.add('no_first_apply_safe_operations');
  }
  return [...blockers].sort();
}

function nextWorkflowStep(preview: MarketingAdsApplyPreview): string {
  if (preview.blockers.includes('plan_status_not_reviewed')) {
    return 'Review the ads plan, set status to reviewed or approved, then rerun dry-run apply.';
  }
  if (preview.blockers.length > 0) {
    return 'Resolve apply blockers and rerun `unisane-ops growth ads apply --dry-run`.';
  }
  return 'Dry-run apply is ready; live provider mutation remains disabled until receipt-backed executors are implemented.';
}

function liveReceiptPath(cwd: string, environment: string, generatedAt: string): string {
  const safeTimestamp = generatedAt.replaceAll(':', '-').replaceAll('.', '-');
  return path.resolve(
    cwd,
    '.unisane',
    'marketing',
    environment,
    'receipts',
    `ads-live-${safeTimestamp}.json`,
  );
}

function liveOperationConfirmation(args: {
  environment: string;
  operation: MarketingAdsApplyOperation;
  approvalRef: string;
}): string {
  return `live:${args.environment}:${args.operation.provider}:${args.operation.id}:${args.approvalRef}`;
}

function isLiveExecutableOperation(operation: MarketingAdsApplyOperation): boolean {
  return (
    (operation.provider === 'googleAds' || operation.provider === 'metaAds') &&
    operation.actionType === 'create_campaign' &&
    operation.approvalTier === 'strict' &&
    operation.mutationIntent === 'launch_or_expand' &&
    operation.safety === 'spend_or_launch' &&
    !operation.blocksApply &&
    !operation.destructiveAllowed
  );
}

function liveNextWorkflowStep(receipt: MarketingAdsLiveExecutionReceipt): string {
  if (receipt.blockers.length > 0) {
    return 'Resolve live apply blockers, rerun dry-run apply if anything changed, then request a new approval reference.';
  }
  if (receipt.operationResults.some((operation) => operation.status === 'failed')) {
    return 'Review failed provider mutations in provider dashboards and reconcile before another live apply attempt.';
  }
  if (receipt.operationResults.some((operation) => operation.status === 'sent')) {
    return 'Live provider mutation was sent; pull provider reports and verify status before making another change.';
  }
  return 'No live mutation was sent.';
}

function liveBlockersFor(args: {
  plan: MarketingAdsPlanArtifact;
  planHash: string;
  receipt: MarketingAdsApplyReceipt;
  config: MarketingExecutionContext;
  yes?: boolean;
  accountConfirm?: string;
  productionConfirm?: string;
  operationConfirm?: string;
  approvalRef?: string;
  executableOperations: MarketingAdsApplyOperation[];
}): string[] {
  const blockers = new Set<string>();
  if (!args.yes) blockers.add('missing_yes_confirmation');
  if (!args.approvalRef?.trim()) blockers.add('missing_approval_ref');
  if (args.receipt.previewStatus !== 'ready' || args.receipt.status !== 'previewed') {
    blockers.add('dry_run_receipt_not_ready');
  }
  if (args.receipt.planHash !== args.planHash) blockers.add('plan_hash_mismatch');
  if (args.plan.status !== 'reviewed' && args.plan.status !== 'approved') {
    blockers.add('plan_status_not_reviewed');
  }
  const accountConfirmations = confirmationValues(args.accountConfirm);
  for (const account of args.receipt.providerAccounts) {
    if (account.confirmationStatus !== 'confirmed') {
      blockers.add(`dry_run_account_not_confirmed:${account.provider}`);
    }
    if (!accountConfirmations.has(account.confirmationExpected)) {
      blockers.add(`missing_live_account_confirmation:${account.provider}`);
    }
  }
  const environment = args.config.environments[args.config.defaultEnvironment];
  if (environment?.production) {
    const expected = `${args.config.defaultEnvironment}:${args.config.platformId}:${args.config.appId}:ads-apply`;
    if (args.productionConfirm !== expected) blockers.add('missing_live_production_confirmation');
  }
  if (args.executableOperations.length === 0) blockers.add('no_live_executable_operations');
  const operationConfirmations = confirmationValues(args.operationConfirm);
  for (const operation of args.executableOperations) {
    const expected = liveOperationConfirmation({
      environment: args.config.defaultEnvironment,
      operation,
      approvalRef: args.approvalRef ?? '<approval-ref>',
    });
    if (!operationConfirmations.has(expected)) {
      blockers.add(`missing_live_operation_confirmation:${operation.id}`);
    }
  }
  return [...blockers].sort();
}

export function buildMarketingAdsApplyPreview(
  config: MarketingExecutionContext,
  options: MarketingAdsApplyOptions,
): MarketingAdsApplyResult {
  if (!options.dryRun) {
    throw new Error('[ADS_APPLY_LIVE_NOT_SUPPORTED] Ads apply currently supports --dry-run only.');
  }
  if (options.yes) {
    throw new Error(
      '[ADS_APPLY_YES_NOT_SUPPORTED] --yes is reserved for live apply and is disabled.',
    );
  }

  const cwd = path.resolve(options.cwd ?? process.cwd());
  const generatedAt = (options.now ?? new Date()).toISOString();
  const { resolvedPath, plan } = readAdsPlan(cwd, options.planPath);
  const providedAccounts = confirmationValues(options.accountConfirm);
  const confirmations = [
    ...uniqueMarketingAdsPlanProviders(plan).map((provider) =>
      providerAccountConfirmation({ config, provider, provided: providedAccounts }),
    ),
    productionConfirmation({ config, provided: options.productionConfirm }),
  ].filter(
    (confirmation): confirmation is MarketingAdsApplyConfirmation => confirmation !== undefined,
  );
  const operations = buildMarketingAdsApplyOperations(plan);
  const environment = config.defaultEnvironment;
  const previewSeed = {
    kind: 'unisane.marketing.ads-apply-preview',
    version: 1,
    generatedAt,
    platformId: config.platformId,
    appId: config.appId,
    environment,
    planPath: path.relative(cwd, resolvedPath),
    planGeneratedAt: plan.generatedAt,
    planStatus: plan.status,
    dryRun: true,
    liveMutationAllowed: false,
    status: 'blocked',
    blockers: [],
    confirmations,
    operations,
    nextWorkflowStep: 'placeholder',
  } satisfies Omit<MarketingAdsApplyPreview, 'status' | 'nextWorkflowStep'> & {
    status: 'blocked';
    nextWorkflowStep: string;
  };
  const blockers = blockersFor({ plan, confirmations, operations });
  const preview = marketingAdsApplyPreviewSchema.parse({
    ...previewSeed,
    status: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    nextWorkflowStep: 'placeholder',
  });
  const finalPreview = {
    ...preview,
    nextWorkflowStep: nextWorkflowStep(preview),
  };
  return {
    ok: finalPreview.status === 'ready',
    dryRun: true,
    preview: finalPreview,
  };
}

export async function writeMarketingAdsApplyPreview(
  config: MarketingExecutionContext,
  options: MarketingAdsApplyOptions,
): Promise<MarketingAdsApplyResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const result = buildMarketingAdsApplyPreview(config, options);
  const previewDestination = outputPath(
    cwd,
    defaultApplyPreviewPath(cwd, config.defaultEnvironment, result.preview.generatedAt),
    options.out,
  );
  const receiptDestination = outputPath(
    cwd,
    defaultMarketingAdsApplyReceiptPath(cwd, config.defaultEnvironment, result.preview.generatedAt),
    undefined,
  );
  const { plan } = readAdsPlan(cwd, options.planPath);
  return await withMarketingAdsApplyLock({
    cwd,
    environment: config.defaultEnvironment,
    run: async () => {
      const receipt = buildMarketingAdsApplyReceipt({
        generatedAt: result.preview.generatedAt,
        planHash: hashMarketingAdsPlan(plan),
        preview: result.preview,
        previewPath: path.relative(cwd, previewDestination),
      });
      mkdirSync(path.dirname(previewDestination), { recursive: true });
      mkdirSync(path.dirname(receiptDestination), { recursive: true });
      writeFileSync(previewDestination, `${JSON.stringify(result.preview, null, 2)}\n`, 'utf8');
      writeFileSync(receiptDestination, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
      return {
        ...result,
        path: previewDestination,
        receiptPath: receiptDestination,
        receipt,
      };
    },
  });
}

export async function writeMarketingAdsLiveApplyReceipt(
  config: MarketingExecutionContext,
  options: MarketingAdsLiveApplyOptions,
): Promise<MarketingAdsLiveApplyResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const generatedAt = (options.now ?? new Date()).toISOString();
  const { resolvedPath: resolvedPlanPath, plan } = readAdsPlan(cwd, options.planPath);
  const { resolvedPath: resolvedReceiptPath, receipt: dryRunReceipt } = readDryRunReceipt(
    cwd,
    options.receiptPath,
  );
  const planHash = hashMarketingAdsPlan(plan);
  const operations = buildMarketingAdsApplyOperations(plan).filter(isLiveExecutableOperation);
  const blockers = liveBlockersFor({
    plan,
    planHash,
    receipt: dryRunReceipt,
    config,
    yes: options.yes,
    accountConfirm: options.accountConfirm,
    productionConfirm: options.productionConfirm,
    operationConfirm: options.operationConfirm,
    approvalRef: options.approvalRef,
    executableOperations: operations,
  });
  const environment = config.defaultEnvironment;
  const mode = options.liveExecutorMode ?? 'disabled';
  const destination = outputPath(cwd, liveReceiptPath(cwd, environment, generatedAt), options.out);
  return await withMarketingAdsApplyLock({
    cwd,
    environment,
    run: async () => {
      const operationResults =
        blockers.length > 0
          ? operations.map((operation) => ({
              operationId: operation.id,
              provider: operation.provider,
              strategyObjectId: operation.strategyObjectId,
              actionType: operation.actionType,
              attemptedAt: generatedAt,
              environment,
              safety: operation.safety,
              mutationIntent: operation.mutationIntent,
              approvalTier: operation.approvalTier,
              status: 'blocked' as const,
              liveMutationSent: false,
              message: 'Live operation blocked before provider mutation.',
            }))
          : await Promise.all(
              operations.map((operation) =>
                executeMarketingAdsLiveOperation({
                  config,
                  plan,
                  operation,
                  mode,
                  providerExecutors: options.providerExecutors,
                  providerCredentials: options.providerCredentials,
                  env: options.env,
                  fetch: options.fetch,
                  now: options.now,
                  apiVersion: options.apiVersion,
                }),
              ),
            );
      const receipt = marketingAdsLiveExecutionReceiptSchema.parse({
        kind: 'unisane.marketing.ads-live-execution-receipt',
        version: 1,
        generatedAt,
        status:
          blockers.length > 0
            ? 'blocked'
            : operationResults.some((operation) => operation.status === 'failed')
              ? 'failed'
              : operationResults.some((operation) => operation.status === 'sent')
                ? 'executed'
                : 'blocked',
        dryRun: false,
        liveMutationAllowed: true,
        liveExecutorMode: mode,
        platformId: config.platformId,
        appId: config.appId,
        environment,
        planPath: path.relative(cwd, resolvedPlanPath),
        planHash,
        dryRunReceiptPath: path.relative(cwd, resolvedReceiptPath),
        approvalRef: options.approvalRef ?? '<missing>',
        actor: {
          kind: 'devtools-cli',
          actorRef: 'redacted',
          secretValues: 'redacted',
        },
        confirmations: [
          ...dryRunReceipt.providerAccounts.map((account) => ({
            type: 'account' as const,
            provider: account.provider,
            expected: account.confirmationExpected,
            provided: confirmationValues(options.accountConfirm).has(account.confirmationExpected),
            status: confirmationValues(options.accountConfirm).has(account.confirmationExpected)
              ? 'confirmed'
              : 'missing',
          })),
          ...(config.environments[environment]?.production
            ? [
                {
                  type: 'production' as const,
                  expected: `${environment}:${config.platformId}:${config.appId}:ads-apply`,
                  provided:
                    options.productionConfirm ===
                    `${environment}:${config.platformId}:${config.appId}:ads-apply`,
                  status:
                    options.productionConfirm ===
                    `${environment}:${config.platformId}:${config.appId}:ads-apply`
                      ? 'confirmed'
                      : 'missing',
                },
              ]
            : []),
        ],
        blockers,
        operationResults,
        nextWorkflowStep: 'placeholder',
      });
      const finalReceipt = {
        ...receipt,
        nextWorkflowStep: liveNextWorkflowStep(receipt),
      };
      mkdirSync(path.dirname(destination), { recursive: true });
      writeFileSync(destination, `${JSON.stringify(finalReceipt, null, 2)}\n`, 'utf8');
      return {
        ok: finalReceipt.status === 'executed',
        path: destination,
        receipt: finalReceipt,
      };
    },
  });
}
