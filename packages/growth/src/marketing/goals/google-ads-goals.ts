import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketingConfig } from '../schema/marketing-config.js';
import type {
  MarketingConversion,
  MarketingConversionRegistry,
} from '../schema/conversion-registry.js';
import type { FetchLike } from '../providers/api-pull-types.js';

export type MarketingGoogleAdsGoalOperationStatus =
  | 'planned'
  | 'validated'
  | 'created'
  | 'updated'
  | 'skipped'
  | 'error';

export type MarketingGoogleAdsGoalOperation = {
  conversionId: string;
  sourceEventId: string;
  actionName: string;
  category: string;
  primaryForGoal: boolean;
  lifecycle: string;
  reportingGoal: string;
  status: MarketingGoogleAdsGoalOperationStatus;
  intent: 'create_or_update_conversion_action';
  resourceName?: string;
  message: string;
};

export type MarketingGoogleAdsGoalPlan = {
  kind: 'unisane.marketing.google-ads-goals';
  version: 1;
  generatedAt: string;
  nonMutating: boolean;
  validateOnly: boolean;
  customerId: string;
  loginCustomerId?: string;
  operations: MarketingGoogleAdsGoalOperation[];
  nextWorkflowStep: string;
};

export type MarketingGoogleAdsGoalsOptions = {
  accessToken?: string;
  accountId?: string;
  managerCustomerId?: string;
  env?: Record<string, string | undefined>;
  fetch?: FetchLike;
  apiVersion?: string;
  now?: Date;
  validateOnly?: boolean;
  live?: boolean;
};

type ExistingConversionAction = {
  resourceName: string;
  name: string;
  category?: string;
  status?: string;
  primaryForGoal?: boolean;
};

function normalizeCustomerId(value: string | undefined): string | undefined {
  const normalized = value?.replaceAll('-', '').trim();
  return normalized || undefined;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function requiredEnv(
  env: Record<string, string | undefined>,
  name: string | undefined,
  label: string,
): string {
  if (!name)
    throw new Error(
      `[GOOGLE_ADS_GOALS_${label}_ENV_MISSING] Marketing config does not define ${label}.`,
    );
  const value = env[name]?.trim();
  if (!value)
    throw new Error(
      `[GOOGLE_ADS_GOALS_${label}_MISSING] Set ${name} before running Google Ads goals setup.`,
    );
  return value;
}

function headers(input: {
  accessToken: string;
  developerToken: string;
  loginCustomerId?: string;
}): Record<string, string> {
  return {
    authorization: `Bearer ${input.accessToken}`,
    'content-type': 'application/json',
    'developer-token': input.developerToken,
    ...(input.loginCustomerId ? { 'login-customer-id': input.loginCustomerId } : {}),
  };
}

async function readGoogleAdsResponse(response: Response): Promise<unknown> {
  if (response.ok) return response.json();
  let body = '';
  try {
    body = await response.text();
  } catch {
    body = '';
  }
  throw new Error(body || `${response.status} ${response.statusText}`);
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

function envCustomerId(
  config: MarketingConfig,
  env: Record<string, string | undefined>,
): string | undefined {
  const accountEnv = config.providers.googleAds.accountIdEnv;
  return normalizeCustomerId(accountEnv ? env[accountEnv] : undefined);
}

function envLoginCustomerId(
  config: MarketingConfig,
  env: Record<string, string | undefined>,
): string | undefined {
  const loginEnv = config.providers.googleAds.loginCustomerIdEnv;
  return normalizeCustomerId(loginEnv ? env[loginEnv] : undefined);
}

function plannedStep(validateOnly: boolean, live: boolean): string {
  if (live)
    return 'Pull the Google Ads conversion report and wire returned conversion action ids into app env.';
  if (validateOnly)
    return 'Review validate-only result, then rerun with --yes and exact account confirmation.';
  return 'Run ads goals google --dry-run to validate the planned conversion action mutations.';
}

export function buildMarketingGoogleAdsGoalPlan(input: {
  config: MarketingConfig;
  registry: MarketingConversionRegistry;
  accountId?: string;
  managerCustomerId?: string;
  env?: Record<string, string | undefined>;
  now?: Date;
}): MarketingGoogleAdsGoalPlan {
  const env = input.env ?? process.env;
  const customerId = normalizeCustomerId(input.accountId) ?? envCustomerId(input.config, env);
  if (!customerId) {
    throw new Error(
      '[GOOGLE_ADS_GOALS_CUSTOMER_MISSING] Pass --account-id or set the configured Google Ads customer env.',
    );
  }
  const loginCustomerId =
    normalizeCustomerId(input.managerCustomerId) ?? envLoginCustomerId(input.config, env);
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

function parseExistingConversionAction(entry: unknown): ExistingConversionAction | undefined {
  const conversionAction = asRecord(asRecord(entry).conversionAction);
  const resourceName = optionalString(conversionAction.resourceName);
  const name = optionalString(conversionAction.name);
  if (!resourceName || !name) return undefined;
  return {
    resourceName,
    name,
    category: optionalString(conversionAction.category),
    status: optionalString(conversionAction.status),
    primaryForGoal: optionalBoolean(conversionAction.primaryForGoal),
  };
}

async function listExistingConversionActions(input: {
  fetch: FetchLike;
  apiVersion: string;
  accessToken: string;
  developerToken: string;
  customerId: string;
  loginCustomerId?: string;
}): Promise<Map<string, ExistingConversionAction>> {
  const value = asArray(
    await readGoogleAdsResponse(
      await input.fetch(
        `https://googleads.googleapis.com/${input.apiVersion}/customers/${input.customerId}/googleAds:searchStream`,
        {
          method: 'POST',
          headers: headers(input),
          body: JSON.stringify({
            query:
              'SELECT conversion_action.resource_name, conversion_action.name, conversion_action.category, conversion_action.status, conversion_action.primary_for_goal FROM conversion_action',
          }),
        },
      ),
    ),
  );
  const byName = new Map<string, ExistingConversionAction>();
  for (const batch of value) {
    for (const result of asArray(asRecord(batch).results)) {
      const action = parseExistingConversionAction(result);
      if (action) byName.set(action.name, action);
    }
  }
  return byName;
}

function mutateOperation(
  operation: MarketingGoogleAdsGoalOperation,
  existing?: ExistingConversionAction,
) {
  if (existing) {
    return {
      update: {
        resourceName: existing.resourceName,
        status: 'ENABLED',
        primaryForGoal: operation.primaryForGoal,
      },
      updateMask: 'status,primary_for_goal',
    };
  }
  return {
    create: {
      name: operation.actionName,
      type: 'WEBPAGE',
      category: operation.category,
      status: 'ENABLED',
      primaryForGoal: operation.primaryForGoal,
    },
  };
}

function operationResultResourceName(result: unknown): string | undefined {
  return optionalString(asRecord(result).resourceName);
}

export async function applyMarketingGoogleAdsGoals(
  config: MarketingConfig,
  registry: MarketingConversionRegistry,
  options: MarketingGoogleAdsGoalsOptions,
): Promise<MarketingGoogleAdsGoalPlan> {
  const env = options.env ?? process.env;
  const accessToken = options.accessToken;
  if (!accessToken)
    throw new Error(
      '[GOOGLE_ADS_GOALS_ACCESS_TOKEN_MISSING] Google Ads OAuth access token is required.',
    );
  const developerToken = requiredEnv(
    env,
    config.providers.googleAds.developerTokenEnv,
    'DEVELOPER_TOKEN',
  );
  const plan = buildMarketingGoogleAdsGoalPlan({
    config,
    registry,
    accountId: options.accountId,
    managerCustomerId: options.managerCustomerId,
    env,
    now: options.now,
  });
  const fetcher = options.fetch ?? fetch;
  const apiVersion = options.apiVersion ?? 'v22';
  const existing = await listExistingConversionActions({
    fetch: fetcher,
    apiVersion,
    accessToken,
    developerToken,
    customerId: plan.customerId,
    loginCustomerId: plan.loginCustomerId,
  });
  const mutationOperations = plan.operations.map((operation) =>
    mutateOperation(operation, existing.get(operation.actionName)),
  );
  const response = asRecord(
    await readGoogleAdsResponse(
      await fetcher(
        `https://googleads.googleapis.com/${apiVersion}/customers/${plan.customerId}/conversionActions:mutate`,
        {
          method: 'POST',
          headers: headers({
            accessToken,
            developerToken,
            loginCustomerId: plan.loginCustomerId,
          }),
          body: JSON.stringify({
            validateOnly: Boolean(options.validateOnly),
            partialFailure: false,
            operations: mutationOperations,
          }),
        },
      ),
    ),
  );
  const results = asArray(response.results);
  return {
    ...plan,
    nonMutating: Boolean(options.validateOnly),
    validateOnly: Boolean(options.validateOnly),
    operations: plan.operations.map((operation, index) => {
      const existingAction = existing.get(operation.actionName);
      const resourceName =
        operationResultResourceName(results[index]) ?? existingAction?.resourceName ?? undefined;
      return {
        ...operation,
        resourceName,
        status: options.validateOnly ? 'validated' : existingAction ? 'updated' : 'created',
        message: options.validateOnly
          ? 'Google Ads validate-only accepted the conversion action mutation.'
          : existingAction
            ? 'Google Ads conversion action was updated from the canonical registry.'
            : 'Google Ads conversion action was created from the canonical registry.',
      };
    }),
    nextWorkflowStep: plannedStep(Boolean(options.validateOnly), Boolean(options.live)),
  };
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
