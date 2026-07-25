import {
  packCommandResultSchema,
  type PackCommandContext,
  type PackCommandResult,
} from '@unisane/ops-engine/pack';
import {
  CLOUD_DNS_CONTEXT_BINDING,
  CLOUDFLARE_DNS_PROVIDER_BINDING,
  requireCloudDnsProvider,
  requireCloudDnsRuntimeBinding,
} from '../runtime.js';
import {
  applyCloudDnsPlan,
  collectCloudDnsInventory,
  createCloudDnsImportProposal,
  createCloudDnsPlan,
  readCloudDnsInventory,
} from '../workflow.js';

interface ParsedArguments {
  cwd?: string;
  target?: string;
  environment?: string;
  inventory?: string;
  plan?: string;
  output?: string;
  receiptOutput?: string;
  accountConfirm?: string;
  productionConfirm?: string;
  zones: string[];
  yes: boolean;
}

type ValueFlagProperty = Exclude<keyof ParsedArguments, 'yes' | 'zones'>;
type DnsCommandId =
  | 'cloud.dns.inventory'
  | 'cloud.dns.import'
  | 'cloud.dns.plan'
  | 'cloud.dns.apply'
  | 'provider.cloudflare.dns.inventory'
  | 'provider.cloudflare.dns.plan'
  | 'provider.cloudflare.dns.apply';

interface DnsRoute {
  inventory: Extract<DnsCommandId, `${string}.inventory`>;
  plan: Extract<DnsCommandId, `${string}.plan`>;
  apply: Extract<DnsCommandId, `${string}.apply`>;
  cli: 'cloud dns' | 'provider cloudflare dns';
}

const CAPABILITY_ROUTE: DnsRoute = {
  inventory: 'cloud.dns.inventory',
  plan: 'cloud.dns.plan',
  apply: 'cloud.dns.apply',
  cli: 'cloud dns',
};

const EXPERT_ROUTE: DnsRoute = {
  inventory: 'provider.cloudflare.dns.inventory',
  plan: 'provider.cloudflare.dns.plan',
  apply: 'provider.cloudflare.dns.apply',
  cli: 'provider cloudflare dns',
};

const VALUE_FLAGS: ReadonlyMap<string, ValueFlagProperty> = new Map([
  ['--cwd', 'cwd'],
  ['--target', 'target'],
  ['--env', 'environment'],
  ['--inventory', 'inventory'],
  ['--plan', 'plan'],
  ['--output', 'output'],
  ['--receipt-output', 'receiptOutput'],
  ['--account-confirm', 'accountConfirm'],
  ['--production-confirm', 'productionConfirm'],
] as const);

function parseArguments(argv: readonly string[]): ParsedArguments {
  const parsed: ParsedArguments = { zones: [], yes: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (argument === '--yes') {
      parsed.yes = true;
      continue;
    }
    if (argument === '--zone') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('[OPS_CLI_ARGUMENT_VALUE_REQUIRED] --zone requires a value.');
      }
      parsed.zones.push(value);
      index += 1;
      continue;
    }
    const property = VALUE_FLAGS.get(argument);
    if (!property) {
      throw new Error(`[OPS_CLI_ARGUMENT_UNKNOWN] Unknown Cloud DNS argument '${argument}'.`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`[OPS_CLI_ARGUMENT_VALUE_REQUIRED] ${argument} requires a value.`);
    }
    if (parsed[property]) {
      throw new Error(`[OPS_CLI_ARGUMENT_DUPLICATE] ${argument} may only be supplied once.`);
    }
    parsed[property] = value;
    index += 1;
  }
  return parsed;
}

function requireRuntime(context: PackCommandContext) {
  if (!context.runtime) {
    throw new Error('[OPS_COMMAND_RUNTIME_REQUIRED] Cloud DNS requires a host runtime binding.');
  }
  return context.runtime;
}

function requireArgument(value: string | undefined, flag: string): string {
  if (!value) throw new Error(`[OPS_CLI_ARGUMENT_REQUIRED] ${flag} is required.`);
  return value;
}

function diagnostic(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function failureStatus(error: unknown): PackCommandResult['status'] {
  const message = diagnostic(error);
  const isSchemaError =
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'ZodError';
  if (message.includes('CONFIRMATION_REQUIRED') || message.includes('CONFIRM_MISMATCH')) {
    return 'approval-required';
  }
  if (
    message.includes('ARGUMENT_') ||
    message.includes('CONTEXT_MISMATCH') ||
    message.includes('CLOUD_DNS_IMPORT_') ||
    isSchemaError
  ) {
    return 'invalid';
  }
  if (
    message.includes('RUNTIME_REQUIRED') ||
    message.includes('PROVIDER_REQUIRED') ||
    message.includes('EXECUTION_STATE_REQUIRED') ||
    message.includes('LOCK_UNAVAILABLE') ||
    message.includes('BLOCKED')
  ) {
    return 'blocked';
  }
  return 'failed';
}

function result(args: {
  command: DnsCommandId;
  maximumEffect: 'offline' | 'read-network' | 'write';
  actualEffect: 'offline' | 'read-network' | 'write';
  writeTargets: Array<'project' | 'remote'>;
  riskGuards?: Array<'production'>;
  status: PackCommandResult['status'];
  value: unknown;
  diagnostics?: string[];
  artifacts?: string[];
  nextActions?: string[];
}): PackCommandResult {
  return packCommandResultSchema.parse({
    schemaVersion: 1,
    command: args.command,
    pack: 'cloud',
    maximumEffect: args.maximumEffect,
    actualEffect: args.actualEffect,
    writeTargets: args.writeTargets,
    riskGuards: args.riskGuards ?? [],
    status: args.status,
    result: args.value,
    diagnostics: args.diagnostics ?? [],
    artifacts: args.artifacts ?? [],
    nextActions: args.nextActions ?? [],
  });
}

async function runInventory(
  context: PackCommandContext,
  route: DnsRoute,
): Promise<PackCommandResult> {
  try {
    const flags = parseArguments(context.argv);
    const binding = requireCloudDnsRuntimeBinding(
      await requireRuntime(context).resolveBinding(CLOUDFLARE_DNS_PROVIDER_BINDING, {
        command: 'inventory',
        cwd: flags.cwd ?? context.cwd,
        target: flags.target,
        environment: flags.environment,
      }),
    );
    const inventory = await collectCloudDnsInventory({
      target: binding.target,
      provider: requireCloudDnsProvider(binding),
      generatedAt: binding.now?.toISOString(),
    });
    const artifact = binding.artifacts.writeJson({
      class: 'inventory',
      outputPath: flags.output,
      value: inventory,
    });
    return result({
      command: route.inventory,
      maximumEffect: 'read-network',
      actualEffect: 'read-network',
      writeTargets: ['project'],
      status: inventory.errors.length === 0 ? 'ok' : 'attention',
      value: inventory,
      diagnostics: inventory.errors.map((entry) => `${entry.code}: ${entry.message}`),
      artifacts: [artifact.relativePath],
      nextActions: [
        `Run \`unisane ${route.cli} plan --inventory ${artifact.relativePath}\` after reviewing the inventory.`,
      ],
    });
  } catch (error) {
    return result({
      command: route.inventory,
      maximumEffect: 'read-network',
      actualEffect: 'offline',
      writeTargets: [],
      status: failureStatus(error),
      value: null,
      diagnostics: [diagnostic(error)],
    });
  }
}

async function runPlan(context: PackCommandContext, route: DnsRoute): Promise<PackCommandResult> {
  try {
    const flags = parseArguments(context.argv);
    const inventoryPath = requireArgument(flags.inventory, '--inventory');
    const binding = requireCloudDnsRuntimeBinding(
      await requireRuntime(context).resolveBinding(CLOUD_DNS_CONTEXT_BINDING, {
        command: 'plan',
        cwd: flags.cwd ?? context.cwd,
        target: flags.target,
        environment: flags.environment,
      }),
    );
    const plan = createCloudDnsPlan({
      target: binding.target,
      inventory: readCloudDnsInventory(binding, inventoryPath),
      generatedAt: binding.now?.toISOString(),
    });
    const artifact = binding.artifacts.writeJson({
      class: 'plan',
      outputPath: flags.output,
      value: plan,
    });
    return result({
      command: route.plan,
      maximumEffect: 'offline',
      actualEffect: 'offline',
      writeTargets: ['project'],
      riskGuards: plan.production ? ['production'] : [],
      status: plan.summary.blocked === 0 ? 'ok' : 'attention',
      value: plan,
      artifacts: [artifact.relativePath],
      nextActions:
        plan.summary.blocked === 0
          ? [
              `Review the plan, then run \`unisane ${route.cli} apply --plan ${artifact.relativePath} --account-confirm ${plan.accountId} --yes\`.`,
            ]
          : ['Resolve blocked DNS operations and generate a new inventory and plan.'],
    });
  } catch (error) {
    return result({
      command: route.plan,
      maximumEffect: 'offline',
      actualEffect: 'offline',
      writeTargets: [],
      status: failureStatus(error),
      value: null,
      diagnostics: [diagnostic(error)],
    });
  }
}

async function runApply(context: PackCommandContext, route: DnsRoute): Promise<PackCommandResult> {
  try {
    const flags = parseArguments(context.argv);
    const planPath = requireArgument(flags.plan, '--plan');
    const binding = requireCloudDnsRuntimeBinding(
      await requireRuntime(context).resolveBinding(CLOUDFLARE_DNS_PROVIDER_BINDING, {
        command: 'apply',
        cwd: flags.cwd ?? context.cwd,
        target: flags.target,
        environment: flags.environment,
      }),
    );
    const report = await applyCloudDnsPlan({
      binding,
      planInput: binding.artifacts.readJson(planPath, 'plan'),
      accountConfirm: flags.accountConfirm,
      productionConfirm: flags.productionConfirm,
      receiptOutput: flags.receiptOutput,
      yes: flags.yes,
    });
    return result({
      command: route.apply,
      maximumEffect: 'write',
      actualEffect: 'write',
      writeTargets: ['project', 'remote'],
      riskGuards: report.receipt.production ? ['production'] : [],
      status: report.ok ? 'ok' : 'failed',
      value: report,
      artifacts: [report.artifact.relativePath],
      nextActions:
        report.drift.classification === 'none'
          ? []
          : ['Review the post-apply drift report before any further mutation.'],
    });
  } catch (error) {
    return result({
      command: route.apply,
      maximumEffect: 'write',
      actualEffect: 'offline',
      writeTargets: [],
      status: failureStatus(error),
      value: null,
      diagnostics: [diagnostic(error)],
    });
  }
}

export async function runCloudDnsInventory(
  context: PackCommandContext,
): Promise<PackCommandResult> {
  return runInventory(context, CAPABILITY_ROUTE);
}

export async function runCloudDnsImport(context: PackCommandContext): Promise<PackCommandResult> {
  try {
    const flags = parseArguments(context.argv);
    const inventoryPath = requireArgument(flags.inventory, '--inventory');
    const binding = requireCloudDnsRuntimeBinding(
      await requireRuntime(context).resolveBinding(CLOUD_DNS_CONTEXT_BINDING, {
        command: 'import',
        cwd: flags.cwd ?? context.cwd,
        target: flags.target,
        environment: flags.environment,
      }),
    );
    const proposal = createCloudDnsImportProposal({
      inventory: readCloudDnsInventory(binding, inventoryPath),
      zoneIds: flags.zones,
      generatedAt: binding.now?.toISOString(),
    });
    const artifact = binding.artifacts.writeJson({
      class: 'import',
      outputPath: flags.output,
      value: proposal,
    });
    return result({
      command: 'cloud.dns.import',
      maximumEffect: 'offline',
      actualEffect: 'offline',
      writeTargets: ['project'],
      status: 'ok',
      value: proposal,
      artifacts: [artifact.relativePath],
      nextActions: [
        'Review the proposal and copy only the approved DNS desired state into unisane.config.ts.',
      ],
    });
  } catch (error) {
    return result({
      command: 'cloud.dns.import',
      maximumEffect: 'offline',
      actualEffect: 'offline',
      writeTargets: [],
      status: failureStatus(error),
      value: null,
      diagnostics: [diagnostic(error)],
    });
  }
}

export async function runCloudDnsPlan(context: PackCommandContext): Promise<PackCommandResult> {
  return runPlan(context, CAPABILITY_ROUTE);
}

export async function runCloudDnsApply(context: PackCommandContext): Promise<PackCommandResult> {
  return runApply(context, CAPABILITY_ROUTE);
}

export async function runProviderCloudflareDnsInventory(
  context: PackCommandContext,
): Promise<PackCommandResult> {
  return runInventory(context, EXPERT_ROUTE);
}

export async function runProviderCloudflareDnsPlan(
  context: PackCommandContext,
): Promise<PackCommandResult> {
  return runPlan(context, EXPERT_ROUTE);
}

export async function runProviderCloudflareDnsApply(
  context: PackCommandContext,
): Promise<PackCommandResult> {
  return runApply(context, EXPERT_ROUTE);
}
