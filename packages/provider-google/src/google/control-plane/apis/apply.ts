import path from 'node:path';
import {
  assertControlPlaneApproval,
  expectedControlPlaneProductionConfirmation,
  highestControlPlaneMutationRisk,
  providerArtifactRelativePath,
} from '@unisane/ops-engine';
import { enableGoogleService, type GoogleControlPlaneFetch } from '../client.js';
import { asGoogleApisPlan } from './plan.js';
import {
  googleControlPlaneStamp,
  googlePlanHash,
  googleProviderAccessToken,
  googleProviderFetchFromOptions,
  readGoogleJsonFile,
  writeGoogleProviderArtifact,
} from '../shared/runtime.js';
import {
  GOOGLE_CONTROL_PLANE_SCOPE,
  type GoogleProviderApplyReceipt,
  type GoogleProviderCliOptions,
} from '../shared/types.js';

export async function applyGoogleApisPlan(
  options: GoogleProviderCliOptions,
  deps?: { fetch?: GoogleControlPlaneFetch },
): Promise<GoogleProviderApplyReceipt> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  if (!options.plan)
    throw new Error('[GOOGLE_PLAN_REQUIRED] Pass --plan with a Google API plan artifact.');
  const planPath = path.resolve(cwd, options.plan);
  const plan = asGoogleApisPlan(readGoogleJsonFile(options.plan, cwd));
  const risk = highestControlPlaneMutationRisk(plan.actions.map((action) => action.risk));
  assertControlPlaneApproval({ risk, yes: options.yes });
  const production = plan.environment === 'production' || options.env === 'production';
  if (production) {
    const expected = expectedControlPlaneProductionConfirmation({
      environment: plan.environment,
      accountOrProject: plan.projectId,
      operation: 'google-apis-apply',
    });
    if (options.productionConfirm !== expected) {
      throw new Error(
        `[GOOGLE_PRODUCTION_CONFIRM_REQUIRED] Expected --production-confirm ${expected}.`,
      );
    }
  }
  const accessToken = await googleProviderAccessToken(options, GOOGLE_CONTROL_PLANE_SCOPE);
  const providerFetch = googleProviderFetchFromOptions(options, deps?.fetch);
  const enabledServices: GoogleProviderApplyReceipt['enabledServices'] = [];
  const results: GoogleProviderApplyReceipt['results'] = [];
  for (const action of plan.actions) {
    if (action.type !== 'create') {
      results.push({ actionId: action.id, status: 'skipped', message: action.summary });
      continue;
    }
    const serviceName = action.id.replace(/^google\.api\./, '');
    try {
      const result = await enableGoogleService({
        accessToken,
        projectId: plan.projectId,
        serviceName,
        fetch: providerFetch,
      });
      enabledServices.push(result);
      results.push({
        actionId: action.id,
        status: 'succeeded',
        message: result.operationName
          ? `Enable operation started: ${result.operationName}`
          : `Enable request accepted for ${serviceName}.`,
      });
    } catch (error) {
      results.push({
        actionId: action.id,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown Google API enable error.',
      });
    }
  }
  const failed = results.some((result) => result.status === 'failed');
  const completedAt = new Date().toISOString();
  const receipt: GoogleProviderApplyReceipt = {
    schemaVersion: 1,
    kind: 'control-plane.apply-receipt',
    provider: 'google',
    appId: plan.appId,
    environment: plan.environment,
    status: failed ? 'partial' : 'succeeded',
    actor: 'codex',
    risk,
    planPath: path.relative(cwd, planPath),
    planHash: googlePlanHash(plan),
    approvedBy: options.yes ? 'local-operator' : null,
    approvalRef: null,
    appliedAt: completedAt,
    completedAt,
    results,
    projectId: plan.projectId,
    enabledServices,
  };
  return writeGoogleProviderArtifact({
    cwd,
    outputPath: options.receiptOutput,
    defaultRelativePath: providerArtifactRelativePath({
      provider: 'google',
      environment: plan.environment,
      lane: 'receipts',
      family: 'apis',
      filename: `google-apis-apply-receipt-${googleControlPlaneStamp()}.json`,
    }),
    value: receipt,
  });
}
