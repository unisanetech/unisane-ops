import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type {
  MarketingConversion,
  MarketingConversionRegistry,
} from '../schema/conversion-registry.js';
import {
  marketingGoogleAdsGoalPlanSchema,
  type MarketingGoogleAdsGoalOperation,
  type MarketingGoogleAdsGoalPlan,
  type MarketingGoogleAdsGoalsOptions,
} from './contracts.js';
export * from './contracts.js';

function normalizeCustomerId(value: string | undefined): string | undefined {
  const normalized = value?.replaceAll('-', '').trim();
  return normalized || undefined;
}

function conversionOperation(
  conversion: MarketingConversion,
): MarketingGoogleAdsGoalOperation | undefined {
  const mapping = conversion.mappings.googleAds;
  if (!mapping) return undefined;
  return {
    conversionId: conversion.id,
    sourceEventId: conversion.sourceEventId,
    actionName: mapping.conversionActionName,
    category: mapping.category,
    primaryForGoal: mapping.primary,
    lifecycle: conversion.lifecycle,
    reportingGoal: conversion.reportingGoal,
    status: 'planned',
    intent: 'create_or_update_conversion_action',
    message: 'Conversion action is planned from the canonical conversion registry.',
  };
}

function buildOperations(registry: MarketingConversionRegistry): MarketingGoogleAdsGoalOperation[] {
  return registry.conversions
    .map(conversionOperation)
    .filter((entry): entry is MarketingGoogleAdsGoalOperation => Boolean(entry));
}

function plannedStep(validateOnly: boolean, live: boolean): string {
  if (live)
    return 'Pull the Google Ads conversion report and reconcile the returned actions with the selected connection resources.';
  if (validateOnly)
    return 'Review validate-only result, then rerun with --yes and exact account confirmation.';
  return 'Run ads goals google --dry-run to validate the planned conversion action mutations.';
}

export function buildMarketingGoogleAdsGoalPlan(input: {
  registry: MarketingConversionRegistry;
  accountId?: string;
  managerCustomerId?: string;
  now?: Date;
}): MarketingGoogleAdsGoalPlan {
  const customerId = normalizeCustomerId(input.accountId);
  if (!customerId) {
    throw new Error(
      '[GOOGLE_ADS_GOALS_CUSTOMER_MISSING] Select a Google Ads customer through the canonical Google connection.',
    );
  }
  const loginCustomerId = normalizeCustomerId(input.managerCustomerId);
  return {
    kind: 'unisane.marketing.google-ads-goals',
    version: 1,
    generatedAt: (input.now ?? new Date()).toISOString(),
    nonMutating: true,
    validateOnly: false,
    customerId,
    loginCustomerId,
    operations: buildOperations(input.registry),
    nextWorkflowStep: plannedStep(false, false),
  };
}

export async function applyMarketingGoogleAdsGoals(
  registry: MarketingConversionRegistry,
  options: MarketingGoogleAdsGoalsOptions,
): Promise<MarketingGoogleAdsGoalPlan> {
  if (!options.validateOnly && !options.live)
    throw new Error(
      '[GOOGLE_ADS_GOALS_MODE_REQUIRED] Select validation or explicit live execution.',
    );
  const plan = marketingGoogleAdsGoalPlanSchema.parse(
    buildMarketingGoogleAdsGoalPlan({
      registry,
      accountId: options.accountId,
      managerCustomerId: options.managerCustomerId,
      now: options.now,
    }),
  );
  const result = marketingGoogleAdsGoalPlanSchema.parse(
    await options.provider.apply(plan, Boolean(options.validateOnly)),
  );
  if (
    result.operations.length !== plan.operations.length ||
    result.operations.some((o, i) => {
      const expected = plan.operations[i]!;
      return (
        o.conversionId !== expected.conversionId ||
        o.actionName !== expected.actionName ||
        o.primaryForGoal !== expected.primaryForGoal ||
        o.category !== expected.category
      );
    }) ||
    result.customerId !== plan.customerId ||
    result.loginCustomerId !== plan.loginCustomerId ||
    result.validateOnly !== Boolean(options.validateOnly) ||
    result.nonMutating !== Boolean(options.validateOnly)
  )
    throw new Error(
      '[GOOGLE_ADS_GOALS_RESULT_MISMATCH] Provider result does not match the selected target and execution mode.',
    );
  return result;
}

export function writeMarketingGoogleAdsGoalPlan(
  plan: MarketingGoogleAdsGoalPlan,
  outPath: string,
): string {
  const resolved = path.resolve(outPath);
  mkdirSync(path.dirname(resolved), { recursive: true });
  writeFileSync(resolved, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return resolved;
}
