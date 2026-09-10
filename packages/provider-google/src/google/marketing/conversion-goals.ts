import {
  marketingGoogleAdsGoalPlanSchema,
  type MarketingGoogleAdsGoalOperation,
  type MarketingGoogleAdsGoalProvider,
  type FetchLike,
} from '@unisane/growth/contracts';
export type GoogleAdsGoalProviderOptions = {
  accessToken: string;
  developerToken: string;
  apiVersion?: string;
  fetch: FetchLike;
};
type ExistingConversionAction = {
  resourceName: string;
  name: string;
  category?: string;
  status?: string;
  primaryForGoal?: boolean;
};

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
  if (response.ok) {
    try {
      return await response.json();
    } catch {
      throw new Error(
        '[GOOGLE_ADS_GOALS_RESPONSE_INVALID] Google returned unreadable evidence. Reconcile state before retrying.',
      );
    }
  }
  throw new Error(
    `[GOOGLE_ADS_GOALS_REQUEST_FAILED] Google Ads request failed (HTTP ${response.status}).`,
  );
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
  const value = await readGoogleAdsResponse(
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
  );
  if (!Array.isArray(value))
    throw new Error(
      '[GOOGLE_ADS_GOALS_INVENTORY_INVALID] Expected complete conversion-action inventory.',
    );
  const byName = new Map<string, ExistingConversionAction>();
  for (const batch of value) {
    if (
      typeof batch !== 'object' ||
      batch === null ||
      Array.isArray(batch) ||
      ('results' in batch && !Array.isArray(batch.results))
    ) {
      throw new Error('[GOOGLE_ADS_GOALS_INVENTORY_INVALID] Invalid conversion inventory batch.');
    }
    for (const result of asArray(asRecord(batch).results)) {
      const action = parseExistingConversionAction(result);
      if (
        !action ||
        !action.resourceName.startsWith(`customers/${input.customerId}/conversionActions/`)
      )
        throw new Error(
          '[GOOGLE_ADS_GOALS_INVENTORY_INVALID] Conversion inventory contains incomplete or foreign identities.',
        );
      if (byName.has(action.name))
        throw new Error(
          '[GOOGLE_ADS_GOALS_AMBIGUOUS] Multiple conversion actions share a name. Select exact resources before applying.',
        );
      byName.set(action.name, action);
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

export function createGoogleAdsGoalProvider(
  options: GoogleAdsGoalProviderOptions,
): MarketingGoogleAdsGoalProvider {
  if (!options.accessToken || !options.developerToken)
    throw new Error(
      '[GOOGLE_ADS_GOALS_CREDENTIALS_REQUIRED] Canonical Google credentials are required.',
    );
  return {
    async apply(input, validateOnly) {
      const plan = marketingGoogleAdsGoalPlanSchema.parse(input);
      const { accessToken, developerToken } = options;
      const fetcher: FetchLike = async (url, init) => {
        try {
          return await options.fetch(url, init);
        } catch {
          throw new Error(
            '[GOOGLE_ADS_GOALS_TRANSPORT_UNKNOWN] Google did not confirm the request outcome. Reconcile before retrying.',
          );
        }
      };
      const apiVersion = options.apiVersion ?? 'v22';
      if (!/^v\d+$/.test(apiVersion))
        throw new Error('[GOOGLE_ADS_GOALS_VERSION_INVALID] Invalid API version.');
      if (plan.operations.length === 0) return { ...plan, nonMutating: validateOnly, validateOnly };
      if (new Set(plan.operations.map((o) => o.actionName)).size !== plan.operations.length)
        throw new Error(
          '[GOOGLE_ADS_GOALS_AMBIGUOUS] Planned conversion action names must be unique.',
        );
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
                validateOnly: validateOnly,
                partialFailure: false,
                operations: mutationOperations,
              }),
            },
          ),
        ),
      );
      const results = asArray(response.results);
      if (
        response.partialFailureError ||
        (!validateOnly &&
          (results.length !== plan.operations.length ||
            results.some(
              (r) =>
                !operationResultResourceName(r)?.startsWith(
                  `customers/${plan.customerId}/conversionActions/`,
                ),
            )))
      )
        throw new Error(
          '[GOOGLE_ADS_GOALS_OUTCOME_UNKNOWN] Google returned incomplete mutation evidence. Reconcile provider state before retrying.',
        );
      return {
        ...plan,
        nonMutating: validateOnly,
        validateOnly: validateOnly,
        operations: plan.operations.map((operation, index) => {
          const existingAction = existing.get(operation.actionName);
          const resourceName =
            operationResultResourceName(results[index]) ??
            (validateOnly ? existingAction?.resourceName : undefined);
          return {
            ...operation,
            resourceName,
            status: validateOnly ? 'validated' : existingAction ? 'updated' : 'created',
            message: validateOnly
              ? 'Google Ads validate-only accepted the conversion action mutation.'
              : existingAction
                ? 'Google Ads conversion action was updated from the canonical registry.'
                : 'Google Ads conversion action was created from the canonical registry.',
          };
        }),
        nextWorkflowStep: validateOnly
          ? 'Review validation before an explicitly approved apply.'
          : 'Read provider state and reconcile the returned conversion actions.',
      };
    },
  };
}
