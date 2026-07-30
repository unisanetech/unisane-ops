import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  assertPackCommandResult,
  resolvePackCommand,
  validatePackGraph,
  verifyPackManifestIntegrity,
  type PackCommandDescriptor,
  type PackCommandHandler,
  type PackCommandResult,
  type PackCommandRuntime,
  type PackManifest,
} from '@unisane/ops-engine/pack';
import { createCanonicalPackRuntime } from './runtime-adapters/cloud-dns.js';

const TRUSTED_PACKAGES = [
  'unisane',
  '@unisane/cloud',
  '@unisane/framework-ops',
  '@unisane/growth',
  '@unisane/ops-console',
  '@unisane/provider-aws',
  '@unisane/provider-cloudflare',
  '@unisane/provider-google',
  '@unisane/provider-meta',
] as const;
const require = createRequire(import.meta.url);

interface PackageIdentity {
  name: string;
  version: string;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function readIdentity(path: string): PackageIdentity {
  const value = readJson(path);
  if (
    typeof value !== 'object' ||
    value === null ||
    !('name' in value) ||
    typeof value.name !== 'string' ||
    !('version' in value) ||
    typeof value.version !== 'string'
  ) {
    throw new Error(`[OPS_PACK_PACKAGE_INVALID] Invalid package identity at ${path}.`);
  }
  return { name: value.name, version: value.version };
}

function loadVerifiedManifest(manifestPath: string, packagePath: string): PackManifest {
  const identity = readIdentity(packagePath);
  return verifyPackManifestIntegrity(readJson(manifestPath), {
    packageName: identity.name,
    installedVersion: identity.version,
    trustedPackageNames: TRUSTED_PACKAGES,
  });
}

export function loadFirstPartyPackGraph(): readonly PackManifest[] {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const cloudManifestPath = require.resolve('@unisane/cloud/pack-manifest');
  const cloudflareManifestPath = require.resolve('@unisane/provider-cloudflare/pack-manifest');
  const growthManifestPath = require.resolve('@unisane/growth/pack-manifest');
  const manifests = [
    loadVerifiedManifest(
      resolve(packageRoot, 'core.manifest.json'),
      resolve(packageRoot, 'package.json'),
    ),
    loadVerifiedManifest(cloudManifestPath, resolve(dirname(cloudManifestPath), 'package.json')),
    loadVerifiedManifest(
      cloudflareManifestPath,
      resolve(dirname(cloudflareManifestPath), 'package.json'),
    ),
    loadVerifiedManifest(growthManifestPath, resolve(dirname(growthManifestPath), 'package.json')),
  ];
  for (const packageName of [
    '@unisane/ops-console',
    '@unisane/provider-aws',
    '@unisane/provider-google',
  ] as const) {
    try {
      const manifestPath = require.resolve(`${packageName}/pack-manifest`);
      manifests.push(
        loadVerifiedManifest(manifestPath, resolve(dirname(manifestPath), 'package.json')),
      );
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !('code' in error) ||
        (error.code !== 'MODULE_NOT_FOUND' && error.code !== 'ERR_MODULE_NOT_FOUND')
      ) {
        throw error;
      }
    }
  }
  try {
    const frameworkManifestPath = require.resolve('@unisane/framework-ops/pack-manifest');
    manifests.push(
      loadVerifiedManifest(
        frameworkManifestPath,
        resolve(dirname(frameworkManifestPath), 'package.json'),
      ),
    );
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !('code' in error) ||
      (error.code !== 'MODULE_NOT_FOUND' && error.code !== 'ERR_MODULE_NOT_FOUND')
    ) {
      throw error;
    }
  }
  return validatePackGraph(manifests);
}

async function loadExactHandler(command: PackCommandDescriptor): Promise<PackCommandHandler> {
  if (
    command.handler.exportPath === './handlers/init' &&
    command.handler.exportName === 'runOpsInit'
  ) {
    const module = await import('./handlers/init.js');
    return module.runOpsInit;
  }
  if (command.handler.exportPath === './handlers/add' && command.handler.exportName === 'runAdd') {
    const module = await import('./handlers/add.js');
    return module.runAdd;
  }
  if (
    command.handler.exportPath === './handlers/connect' &&
    command.handler.exportName === 'runConnect'
  ) {
    const module = await import('./handlers/connect.js');
    return module.runConnect;
  }
  if (
    command.handler.exportPath === './handlers/disconnect' &&
    command.handler.exportName === 'runDisconnect'
  ) {
    const module = await import('./handlers/disconnect.js');
    return module.runDisconnect;
  }
  if (
    command.handler.exportPath === './handlers/check' &&
    command.handler.exportName === 'runCheck'
  ) {
    const module = await import('./handlers/check.js');
    return module.runCheck;
  }
  if (
    command.handler.exportPath === './handlers/migrate-growth-config' &&
    command.handler.exportName === 'runMigrateGrowthConfig'
  ) {
    const module = await import('./handlers/migrate-growth-config.js');
    return module.runMigrateGrowthConfig;
  }
  if (
    command.handler.exportPath === './handlers/status' &&
    command.handler.exportName === 'runStatus'
  ) {
    const module = await import('./handlers/status.js');
    return module.runStatus;
  }
  if (
    command.handler.exportPath === './handlers/inspect-packs' &&
    command.handler.exportName === 'runInspectPacks'
  ) {
    const module = await import('./handlers/inspect-packs.js');
    return module.runInspectPacks;
  }
  if (command.handler.exportPath === './handlers/dns') {
    const module = await import('@unisane/cloud/handlers/dns');
    if (command.handler.exportName === 'runCloudDnsInventory') {
      return module.runCloudDnsInventory;
    }
    if (command.handler.exportName === 'runCloudDnsImport') {
      return module.runCloudDnsImport;
    }
    if (command.handler.exportName === 'runCloudDnsPlan') {
      return module.runCloudDnsPlan;
    }
    if (command.handler.exportName === 'runCloudDnsApply') {
      return module.runCloudDnsApply;
    }
    if (command.handler.exportName === 'runProviderCloudflareDnsInventory') {
      return module.runProviderCloudflareDnsInventory;
    }
    if (command.handler.exportName === 'runProviderCloudflareDnsPlan') {
      return module.runProviderCloudflareDnsPlan;
    }
    if (command.handler.exportName === 'runProviderCloudflareDnsApply') {
      return module.runProviderCloudflareDnsApply;
    }
  }
  if (command.handler.exportPath === './handlers/cloudflare-resources') {
    const module = await import('@unisane/cloud/handlers/cloudflare-resources');
    switch (command.handler.exportName) {
      case 'runCloudInventory':
        return module.runCloudInventory;
      case 'runCloudCheck':
        return module.runCloudCheck;
      case 'runCloudEnv':
        return module.runCloudEnv;
      case 'runCloudQueuesInventory':
        return module.runCloudQueuesInventory;
      case 'runCloudQueuesPlan':
        return module.runCloudQueuesPlan;
      case 'runCloudQueuesApply':
        return module.runCloudQueuesApply;
      case 'runCloudWorkersInventory':
        return module.runCloudWorkersInventory;
      case 'runCloudWorkersPlan':
        return module.runCloudWorkersPlan;
      case 'runCloudWorkersApply':
        return module.runCloudWorkersApply;
      case 'runCloudCronInventory':
        return module.runCloudCronInventory;
      case 'runCloudCronPlan':
        return module.runCloudCronPlan;
      case 'runCloudCronApply':
        return module.runCloudCronApply;
      case 'runProviderCloudflareInventory':
        return module.runProviderCloudflareInventory;
      case 'runProviderCloudflareQueuesInventory':
        return module.runProviderCloudflareQueuesInventory;
      case 'runProviderCloudflareQueuesPlan':
        return module.runProviderCloudflareQueuesPlan;
      case 'runProviderCloudflareQueuesApply':
        return module.runProviderCloudflareQueuesApply;
      case 'runProviderCloudflareWorkersInventory':
        return module.runProviderCloudflareWorkersInventory;
      case 'runProviderCloudflareWorkersPlan':
        return module.runProviderCloudflareWorkersPlan;
      case 'runProviderCloudflareWorkersApply':
        return module.runProviderCloudflareWorkersApply;
      case 'runProviderCloudflareCronInventory':
        return module.runProviderCloudflareCronInventory;
      case 'runProviderCloudflareCronPlan':
        return module.runProviderCloudflareCronPlan;
      case 'runProviderCloudflareCronApply':
        return module.runProviderCloudflareCronApply;
    }
  }
  if (
    command.handler.exportPath === './handlers/connection' &&
    command.handler.exportName === 'runCloudflareConnectionCheck'
  ) {
    const module = await import('@unisane/provider-cloudflare/handlers/connection');
    return module.runCloudflareConnectionCheck;
  }
  if (
    command.handler.exportPath === './handlers/framework' &&
    command.handler.exportName === 'runFrameworkCommand'
  ) {
    const module = await import('@unisane/framework-ops/handlers/framework');
    return module.runFrameworkCommand;
  }
  if (
    command.handler.exportPath === './handlers/growth' &&
    command.handler.exportName === 'runGrowthCommand'
  ) {
    const module = await import('@unisane/growth/handlers/growth');
    return module.runGrowthCommand;
  }
  if (
    command.handler.exportPath === './handlers/console' &&
    command.handler.exportName === 'runGrowthConsole'
  ) {
    const handlerPath = require.resolve('@unisane/ops-console/handlers/console');
    const module = (await import(pathToFileURL(handlerPath).href)) as Record<string, unknown>;
    const handler = module.runGrowthConsole;
    if (typeof handler !== 'function') {
      throw new Error(
        '[OPS_PACK_HANDLER_INVALID] @unisane/ops-console does not export runGrowthConsole.',
      );
    }
    return handler as PackCommandHandler;
  }
  if (
    command.handler.exportPath === './handlers/provider-aws' &&
    command.handler.exportName === 'runProviderAwsCommand'
  ) {
    const module = await import('@unisane/provider-aws/handlers/provider-aws');
    return module.runProviderAwsCommand;
  }
  if (
    command.handler.exportPath === './handlers/provider-google' &&
    command.handler.exportName === 'runProviderGoogleCommand'
  ) {
    const module = await import('@unisane/provider-google/handlers/provider-google');
    return module.runProviderGoogleCommand;
  }
  throw new Error(
    `[OPS_PACK_HANDLER_UNREGISTERED] No exact loader for ${command.handler.exportPath}#${command.handler.exportName}.`,
  );
}

function renderHuman(result: PackCommandResult): void {
  if (result.presentation) {
    if (result.presentation.stdout) process.stdout.write(result.presentation.stdout);
    if (result.presentation.stderr) process.stderr.write(result.presentation.stderr);
    return;
  }
  console.log(`Unisane ${result.command}`);
  console.log(`Status: ${result.status}`);
  console.log(JSON.stringify(result.result, null, 2));
  for (const action of result.nextActions) console.log(action);
}

const EXIT_BY_STATUS: Record<PackCommandResult['status'], number> = {
  ok: 0,
  failed: 1,
  invalid: 2,
  attention: 3,
  blocked: 4,
  'approval-required': 5,
};

function rootHelp(): void {
  console.log(`Unisane CLI

Canonical commands:
  unisane ops init [--growth] [--mode <mode>] [--yes] [--json]
  unisane add growth [--capability <id>] [--yes] [--json]
  unisane connect google [--environment <id>] [--yes] [--json]
  unisane disconnect google [--environment <id>] [--connection <id>] [--yes] [--json]
  unisane check [--environment <id>] [--json]
  unisane ops migrate growth-config --input <path> --yes [--json]
  unisane status [--json]
  unisane inspect packs [--json]
  unisane connect cloudflare check [--connection <id>] [--json]
  unisane cloud dns inventory [--target <id>] [--env <id>] [--json]
  unisane cloud dns import --inventory <path> --zone <zone-id> [--zone <zone-id>] [--json]
  unisane cloud dns plan --inventory <path> [--target <id>] [--env <id>] [--json]
  unisane cloud dns apply --plan <path> --account-confirm <id> --yes [--json]
  unisane cloud inventory [--target <id>] [--env <id>] [--json]
  unisane cloud check|env [--target <id>] [--env <id>] [--json]
  unisane cloud queues inventory|plan|apply [options]
  unisane cloud workers inventory|plan|apply [options]
  unisane cloud cron inventory|plan|apply [options]
  unisane provider cloudflare dns inventory|plan|apply [options]
  unisane provider cloudflare inventory [options]
  unisane provider cloudflare queues|workers|cron inventory|plan|apply [options]
  unisane provider aws <command> [options]
  unisane provider google <command> [options]
  unisane growth console [--cwd <path>] [--host <host>] [--port <port>]
  unisane growth gtm <command> [options]

Framework commands are contributed by the optional @unisane/framework-ops pack.
Growth commands are contributed by @unisane/growth.
The human console is contributed by the optional @unisane/ops-console pack.
Provider expert commands are contributed by their installed provider packs.`);
}

export interface CanonicalCliDependencies {
  loadGraph?: () => readonly PackManifest[];
  loadHandler?: (command: PackCommandDescriptor) => Promise<PackCommandHandler>;
  runtime?: PackCommandRuntime;
}

export async function runCanonicalCli(
  argv: readonly string[],
  dependencies: CanonicalCliDependencies = {},
): Promise<number> {
  if (argv.length === 0 || (argv.length === 1 && ['--help', '-h'].includes(argv[0]))) {
    rootHelp();
    return 0;
  }
  if (argv.length === 1 && ['--version', '-v'].includes(argv[0])) {
    const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    console.log(readIdentity(resolve(packageRoot, 'package.json')).version);
    return 0;
  }
  if (argv[0] === 'init') {
    console.error(`\`unisane init\` is not a command.
Set up Ops in this project: unisane ops init
Create a Framework application: npx create-unisane <project-name>`);
    return 1;
  }

  const manifests = (dependencies.loadGraph ?? loadFirstPartyPackGraph)();
  const selection = resolvePackCommand(manifests, argv);
  if (!selection) {
    console.error(`[UNISANE_COMMAND_UNKNOWN] Unknown command: ${argv.join(' ')}`);
    return 1;
  }

  const json = selection.args.includes('--json');
  if (json && !selection.command.json) {
    throw new Error(`[OPS_PACK_JSON_UNSUPPORTED] ${selection.command.id} does not support JSON.`);
  }
  const handler = await (dependencies.loadHandler ?? loadExactHandler)(selection.command);
  const result = assertPackCommandResult(
    selection.command,
    await handler({
      argv: selection.args.filter((argument) => argument !== '--json'),
      cwd: process.cwd(),
      manifests,
      json,
      selection: {
        command: selection.command,
        packId: selection.manifest.packId,
      },
      runtime: dependencies.runtime ?? createCanonicalPackRuntime(),
    }),
  );
  if (result.command !== selection.command.id || result.pack !== selection.manifest.packId) {
    throw new Error('[OPS_PACK_HANDLER_RESULT_MISMATCH] Handler result identity is invalid.');
  }
  if (json) console.log(JSON.stringify(result));
  else renderHuman(result);
  return EXIT_BY_STATUS[result.status];
}
