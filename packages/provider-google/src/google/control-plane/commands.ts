import { log } from '@unisane/cli-core';
import {
  applyGoogleApisPlan,
  buildGoogleApisInventory,
  buildGoogleApisPlan,
  buildGoogleProductsInventory,
  type GoogleProviderCliOptions,
  type GoogleProviderInventoryArtifact,
  type GoogleProviderPlanArtifact,
  type GoogleProviderProductsInventoryArtifact,
} from './model.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function printInventory(inventory: GoogleProviderInventoryArtifact): void {
  const apiCount = inventory.resources.filter((resource) => resource.type === 'api').length;
  log.success('Google API inventory completed');
  log.kv('Project', inventory.projectId);
  log.kv('Enabled APIs', `${apiCount}`);
  if (inventory.artifact) log.kv('Artifact', inventory.artifact.relativePath);
  for (const warning of inventory.warnings) log.warn(warning);
}

function printProductsInventory(inventory: GoogleProviderProductsInventoryArtifact): void {
  const count = (type: string) =>
    inventory.resources.filter((resource) => resource.type === type).length;
  log.success('Google product inventory completed');
  log.kv('GTM containers', `${count('gtmContainer')}`);
  log.kv('GA4 properties', `${count('ga4Property')}`);
  log.kv('Search Console sites', `${count('searchConsoleSite')}`);
  log.kv('Google Ads customers', `${count('googleAdsCustomer')}`);
  if (inventory.artifact) log.kv('Artifact', inventory.artifact.relativePath);
  for (const warning of inventory.warnings) log.warn(warning);
}

function printPlan(plan: GoogleProviderPlanArtifact): void {
  log.success(plan.summary.create > 0 ? 'Google API plan has actions' : 'Google API plan is clean');
  log.kv('Project', plan.projectId);
  log.kv('Enable APIs', `${plan.summary.create}`);
  log.kv('Already enabled', `${plan.summary.noOp}`);
  if (plan.artifact) log.kv('Artifact', plan.artifact.relativePath);
  for (const action of plan.actions.filter((entry) => entry.type === 'create')) {
    log.kv(`  ${action.id}`, `${action.risk}: ${action.summary}`);
  }
}

export async function googleApisInventory(options: GoogleProviderCliOptions): Promise<number> {
  try {
    const inventory = await buildGoogleApisInventory(options);
    if (options.json) printJson(inventory);
    else printInventory(inventory);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Google API inventory error';
    if (options.json) printJson({ ok: false, error: message });
    else log.error(message);
    return 1;
  }
}

export async function googleProductsInventory(options: GoogleProviderCliOptions): Promise<number> {
  try {
    const inventory = await buildGoogleProductsInventory(options);
    if (options.json) printJson(inventory);
    else printProductsInventory(inventory);
    return inventory.warnings.length > 0 ? 1 : 0;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown Google product inventory error';
    if (options.json) printJson({ ok: false, error: message });
    else log.error(message);
    return 1;
  }
}

export async function googleApisPlan(options: GoogleProviderCliOptions): Promise<number> {
  try {
    const plan = await buildGoogleApisPlan(options);
    if (options.json) printJson(plan);
    else printPlan(plan);
    return plan.summary.blocked > 0 ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Google API plan error';
    if (options.json) printJson({ ok: false, error: message });
    else log.error(message);
    return 1;
  }
}

export async function googleApisApply(options: GoogleProviderCliOptions): Promise<number> {
  try {
    const receipt = await applyGoogleApisPlan(options);
    if (options.json) printJson(receipt);
    else {
      log.success(
        receipt.status === 'succeeded'
          ? 'Google API apply completed'
          : 'Google API apply partially completed',
      );
      log.kv('Project', receipt.projectId);
      log.kv('Status', receipt.status);
      log.kv('Receipt', receipt.artifact?.relativePath ?? 'not written');
    }
    return receipt.status === 'succeeded' ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Google API apply error';
    if (options.json) printJson({ ok: false, error: message });
    else log.error(message);
    return 1;
  }
}
