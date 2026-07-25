import { log } from '@unisane/cli-core';
import {
  buildMetaAdsInventory,
  buildMetaSetupStatus,
  type MetaProviderCliOptions,
  type MetaProviderInventoryArtifact,
  type MetaProviderSetupStatusReport,
} from './model.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function printSetupStatus(report: MetaProviderSetupStatusReport): void {
  log.success(report.setupStatus.ready ? 'Meta setup is ready' : 'Meta setup needs action');
  log.kv('Auth profile', `${report.authProfile.profile} (${report.authProfile.status})`);
  log.kv('Env guidance', `${report.envReport.entries.length} secret-free entries`);
  log.info('Checks');
  for (const check of report.setupStatus.checks) {
    log.kv(`  ${check.title}`, `${check.status}: ${check.message}`);
  }
  log.info('Next actions');
  for (const action of report.setupStatus.nextActions) {
    log.kv(`  ${action.title}`, `${action.owner}/${action.risk}: ${action.message}`);
    if (action.command) log.kv('    command', action.command);
  }
}

function printInventory(inventory: MetaProviderInventoryArtifact): void {
  const accountCount = inventory.resources.filter(
    (resource) => resource.type === 'adAccount',
  ).length;
  const pixelCount = inventory.resources.filter((resource) => resource.type === 'pixel').length;
  const businessCount = inventory.resources.filter(
    (resource) => resource.type === 'business',
  ).length;
  const pageCount = inventory.resources.filter((resource) => resource.type === 'page').length;
  const instagramCount = inventory.resources.filter(
    (resource) => resource.type === 'instagramActor',
  ).length;
  log.success('Meta inventory completed');
  log.kv('Ad accounts', `${accountCount}`);
  log.kv('Pixels', `${pixelCount}`);
  log.kv('Businesses', `${businessCount}`);
  log.kv('Pages', `${pageCount}`);
  log.kv('Instagram actors', `${instagramCount}`);
  if (inventory.artifact) log.kv('Artifact', inventory.artifact.relativePath);
  for (const warning of inventory.warnings) log.warn(warning);
}

export async function metaDoctor(options: MetaProviderCliOptions): Promise<number> {
  try {
    const report = await buildMetaSetupStatus(options);
    if (options.json) printJson(report);
    else printSetupStatus(report);
    return report.setupStatus.ready ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Meta doctor error';
    if (options.json) printJson({ ok: false, error: message });
    else log.error(message);
    return 1;
  }
}

export async function metaSetupStatus(options: MetaProviderCliOptions): Promise<number> {
  return metaDoctor(options);
}

export async function metaAdsInventory(options: MetaProviderCliOptions): Promise<number> {
  try {
    const inventory = await buildMetaAdsInventory(options, { includePixels: true });
    if (options.json) printJson(inventory);
    else printInventory(inventory);
    return inventory.warnings.length > 0 ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Meta inventory error';
    if (options.json) printJson({ ok: false, error: message });
    else log.error(message);
    return 1;
  }
}

export async function metaPixelsInventory(options: MetaProviderCliOptions): Promise<number> {
  return metaAdsInventory(options);
}
