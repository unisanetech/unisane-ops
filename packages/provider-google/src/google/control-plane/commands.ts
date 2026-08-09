import { providerOutput } from '../../cli-output.js';
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
  providerOutput.success('Google API inventory completed');
  providerOutput.kv('Project', inventory.projectId);
  providerOutput.kv('Enabled APIs', `${apiCount}`);
  if (inventory.artifact) providerOutput.kv('Artifact', inventory.artifact.relativePath);
  for (const warning of inventory.warnings) providerOutput.warn(warning);
}

function printProductsInventory(inventory: GoogleProviderProductsInventoryArtifact): void {
  const count = (type: string) =>
    inventory.resources.filter((resource) => resource.type === type).length;
  providerOutput.success('Google product inventory completed');
  providerOutput.kv('GTM containers', `${count('gtmContainer')}`);
  providerOutput.kv('GA4 properties', `${count('ga4Property')}`);
  providerOutput.kv('Search Console sites', `${count('searchConsoleSite')}`);
  providerOutput.kv('Google Ads customers', `${count('googleAdsCustomer')}`);
  if (inventory.artifact) providerOutput.kv('Artifact', inventory.artifact.relativePath);
  for (const warning of inventory.warnings) providerOutput.warn(warning);
}

function printPlan(plan: GoogleProviderPlanArtifact): void {
  providerOutput.success(plan.summary.create > 0 ? 'Google API plan has actions' : 'Google API plan is clean');
  providerOutput.kv('Project', plan.projectId);
  providerOutput.kv('Enable APIs', `${plan.summary.create}`);
  providerOutput.kv('Already enabled', `${plan.summary.noOp}`);
  if (plan.artifact) providerOutput.kv('Artifact', plan.artifact.relativePath);
  for (const action of plan.actions.filter((entry) => entry.type === 'create')) {
    providerOutput.kv(`  ${action.id}`, `${action.risk}: ${action.summary}`);
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
    else providerOutput.error(message);
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
    else providerOutput.error(message);
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
    else providerOutput.error(message);
    return 1;
  }
}

export async function googleApisApply(options: GoogleProviderCliOptions): Promise<number> {
  try {
    const receipt = await applyGoogleApisPlan(options);
    if (options.json) printJson(receipt);
    else {
      providerOutput.success(
        receipt.status === 'succeeded'
          ? 'Google API apply completed'
          : 'Google API apply partially completed',
      );
      providerOutput.kv('Project', receipt.projectId);
      providerOutput.kv('Status', receipt.status);
      providerOutput.kv('Receipt', receipt.artifact?.relativePath ?? 'not written');
    }
    return receipt.status === 'succeeded' ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Google API apply error';
    if (options.json) printJson({ ok: false, error: message });
    else providerOutput.error(message);
    return 1;
  }
}
