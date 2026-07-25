import {
  packCommandResultSchema,
  type PackCommandContext,
  type PackCommandResult,
} from '@unisane/ops-engine/pack';
import {
  createCloudflareEnvironmentReport,
  createCloudflareQueuePlan,
  createCloudflareReadinessReport,
  createCloudflareWorkerPlan,
  collectCloudflareResourceInventory,
} from '../cloudflare-resource-workflow.js';
import {
  applyCloudflareQueuePlan,
  applyCloudflareWorkerPlan,
} from '../cloudflare-resource-apply.js';
import {
  cloudflareResourceInventorySchema,
  type CloudflareResourceFocus,
} from '../cloudflare-resources.js';
import {
  CLOUD_RESOURCE_CONTEXT_BINDING,
  CLOUDFLARE_RESOURCE_PROVIDER_BINDING,
  requireCloudflareResourceProvider,
  requireCloudflareResourceRuntimeBinding,
} from '../runtime.js';

interface ParsedArguments {
  cwd?: string;
  target?: string;
  environment?: string;
  inventory?: string;
  plan?: string;
  output?: string;
  accountConfirm?: string;
  productionConfirm?: string;
  receiptOutput?: string;
  yes?: boolean;
}

type ValueFlagProperty = Exclude<keyof ParsedArguments, 'yes'>;
type ResourceCommandId =
  | 'cloud.inventory'
  | 'cloud.check'
  | 'cloud.env'
  | 'cloud.queues.inventory'
  | 'cloud.queues.plan'
  | 'cloud.queues.apply'
  | 'cloud.workers.inventory'
  | 'cloud.workers.plan'
  | 'cloud.workers.apply'
  | 'cloud.cron.inventory'
  | 'cloud.cron.plan'
  | 'cloud.cron.apply'
  | 'provider.cloudflare.inventory'
  | 'provider.cloudflare.queues.inventory'
  | 'provider.cloudflare.queues.plan'
  | 'provider.cloudflare.queues.apply'
  | 'provider.cloudflare.workers.inventory'
  | 'provider.cloudflare.workers.plan'
  | 'provider.cloudflare.workers.apply'
  | 'provider.cloudflare.cron.inventory'
  | 'provider.cloudflare.cron.plan'
  | 'provider.cloudflare.cron.apply';

const VALUE_FLAGS: ReadonlyMap<string, ValueFlagProperty> = new Map([
  ['--cwd', 'cwd'],
  ['--target', 'target'],
  ['--env', 'environment'],
  ['--inventory', 'inventory'],
  ['--plan', 'plan'],
  ['--output', 'output'],
  ['--account-confirm', 'accountConfirm'],
  ['--production-confirm', 'productionConfirm'],
  ['--receipt-output', 'receiptOutput'],
] as const);

function parseArguments(argv: readonly string[]): ParsedArguments {
  const parsed: ParsedArguments = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (argument === '--yes') {
      if (parsed.yes) {
        throw new Error('[OPS_CLI_ARGUMENT_DUPLICATE] --yes may only be supplied once.');
      }
      parsed.yes = true;
      continue;
    }
    const property = VALUE_FLAGS.get(argument);
    if (!property) {
      throw new Error(
        `[OPS_CLI_ARGUMENT_UNKNOWN] Unknown Cloudflare resource argument '${argument}'.`,
      );
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

function mutationResult(args: {
  command: ResourceCommandId;
  status: PackCommandResult['status'];
  value: unknown;
  diagnostics?: string[];
  artifacts?: string[];
  riskGuards?: string[];
  actualEffect?: 'offline' | 'write';
  nextActions?: string[];
}): PackCommandResult {
  return packCommandResultSchema.parse({
    schemaVersion: 1,
    command: args.command,
    pack: 'cloud',
    maximumEffect: 'write',
    actualEffect: args.actualEffect ?? 'write',
    writeTargets: args.actualEffect === 'offline' ? [] : ['project', 'remote'],
    riskGuards: args.riskGuards ?? [],
    status: args.status,
    result: args.value,
    diagnostics: args.diagnostics ?? [],
    artifacts: args.artifacts ?? [],
    nextActions: args.nextActions ?? [],
  });
}

function requireRuntime(context: PackCommandContext) {
  if (!context.runtime) {
    throw new Error(
      '[OPS_COMMAND_RUNTIME_REQUIRED] Cloudflare resources require a host runtime binding.',
    );
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
  if (message.includes('ARGUMENT_') || message.includes('UNKNOWN') || isSchemaError) {
    return 'invalid';
  }
  if (
    message.includes('RUNTIME_REQUIRED') ||
    message.includes('PROVIDER_REQUIRED') ||
    message.includes('NOT_FOUND') ||
    message.includes('BLOCKED')
  ) {
    return 'blocked';
  }
  return 'failed';
}

function result(args: {
  command: ResourceCommandId;
  maximumEffect: 'offline' | 'read-network';
  actualEffect: 'offline' | 'read-network';
  writeProject: boolean;
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
    writeTargets: args.writeProject ? ['project'] : [],
    riskGuards: [],
    status: args.status,
    result: args.value,
    diagnostics: args.diagnostics ?? [],
    artifacts: args.artifacts ?? [],
    nextActions: args.nextActions ?? [],
  });
}

async function runInventory(
  context: PackCommandContext,
  command: ResourceCommandId,
  focus: CloudflareResourceFocus,
  cli: string,
): Promise<PackCommandResult> {
  try {
    const flags = parseArguments(context.argv);
    const binding = requireCloudflareResourceRuntimeBinding(
      await requireRuntime(context).resolveBinding(CLOUDFLARE_RESOURCE_PROVIDER_BINDING, {
        command: 'inventory',
        focus,
        cwd: flags.cwd ?? context.cwd,
        target: flags.target,
        environment: flags.environment,
      }),
    );
    const inventory = await collectCloudflareResourceInventory({
      target: binding.target,
      provider: requireCloudflareResourceProvider(binding),
      focus,
      generatedAt: binding.now?.toISOString(),
    });
    const artifact = binding.artifacts.writeJson({
      class: 'inventory',
      focus,
      outputPath: flags.output,
      value: inventory,
    });
    return result({
      command,
      maximumEffect: 'read-network',
      actualEffect: 'read-network',
      writeProject: true,
      status: inventory.errors.length === 0 ? 'ok' : 'attention',
      value: inventory,
      diagnostics: inventory.errors.map((entry) => `${entry.code}: ${entry.message}`),
      artifacts: [artifact.relativePath],
      nextActions: [
        `Review the inventory, then run \`unisane ${cli} plan --inventory ${artifact.relativePath}\`.`,
      ],
    });
  } catch (error) {
    return result({
      command,
      maximumEffect: 'read-network',
      actualEffect: 'offline',
      writeProject: false,
      status: failureStatus(error),
      value: null,
      diagnostics: [diagnostic(error)],
    });
  }
}

async function runPlan(
  context: PackCommandContext,
  command: ResourceCommandId,
  focus: 'queues' | 'workers' | 'cron',
): Promise<PackCommandResult> {
  try {
    const flags = parseArguments(context.argv);
    const inventoryPath = requireArgument(flags.inventory, '--inventory');
    const binding = requireCloudflareResourceRuntimeBinding(
      await requireRuntime(context).resolveBinding(CLOUD_RESOURCE_CONTEXT_BINDING, {
        command: 'plan',
        focus,
        cwd: flags.cwd ?? context.cwd,
        target: flags.target,
        environment: flags.environment,
      }),
    );
    const inventory = cloudflareResourceInventorySchema.parse(
      binding.artifacts.readJson(inventoryPath, 'inventory'),
    );
    const plan =
      focus === 'queues'
        ? createCloudflareQueuePlan({
            target: binding.target,
            inventory,
            generatedAt: binding.now?.toISOString(),
          })
        : createCloudflareWorkerPlan({
            target: binding.target,
            inventory,
            focus,
            generatedAt: binding.now?.toISOString(),
          });
    const artifact = binding.artifacts.writeJson({
      class: 'plan',
      focus,
      outputPath: flags.output,
      value: plan,
    });
    return result({
      command,
      maximumEffect: 'offline',
      actualEffect: 'offline',
      writeProject: true,
      status: plan.summary.blocked === 0 ? 'ok' : 'attention',
      value: plan,
      artifacts: [artifact.relativePath],
      nextActions:
        plan.summary.blocked === 0
          ? [
              'Review this deterministic plan. Remote execution is intentionally unavailable until the durable approval, lock, state, and receipt path is admitted.',
            ]
          : ['Resolve blocked operations, refresh inventory, and generate a new plan.'],
    });
  } catch (error) {
    return result({
      command,
      maximumEffect: 'offline',
      actualEffect: 'offline',
      writeProject: false,
      status: failureStatus(error),
      value: null,
      diagnostics: [diagnostic(error)],
    });
  }
}

async function runApply(
  context: PackCommandContext,
  command: ResourceCommandId,
  focus: 'queues' | 'workers' | 'cron',
): Promise<PackCommandResult> {
  try {
    const flags = parseArguments(context.argv);
    const planPath = requireArgument(flags.plan, '--plan');
    const binding = requireCloudflareResourceRuntimeBinding(
      await requireRuntime(context).resolveBinding(CLOUDFLARE_RESOURCE_PROVIDER_BINDING, {
        command: 'apply',
        focus,
        cwd: flags.cwd ?? context.cwd,
        target: flags.target,
        environment: flags.environment,
      }),
    );
    const planInput = binding.artifacts.readJson(planPath, 'plan');
    const report =
      focus === 'queues'
        ? await applyCloudflareQueuePlan({
            binding,
            planInput,
            accountConfirm: flags.accountConfirm,
            productionConfirm: flags.productionConfirm,
            receiptOutput: flags.receiptOutput,
            yes: flags.yes,
          })
        : await applyCloudflareWorkerPlan({
            binding,
            planInput,
            focus,
            accountConfirm: flags.accountConfirm,
            productionConfirm: flags.productionConfirm,
            receiptOutput: flags.receiptOutput,
            yes: flags.yes,
          });
    return mutationResult({
      command,
      status: report.ok ? 'ok' : 'failed',
      value: report,
      artifacts: [report.artifact.relativePath],
      riskGuards: report.receipt.production ? ['production'] : [],
      nextActions:
        report.drift.classification === 'none'
          ? []
          : ['Review the post-apply drift report before any further mutation.'],
    });
  } catch (error) {
    return mutationResult({
      command,
      status: failureStatus(error),
      value: null,
      diagnostics: [diagnostic(error)],
      actualEffect: 'offline',
    });
  }
}

async function runReport(
  context: PackCommandContext,
  command: 'cloud.check' | 'cloud.env',
  kind: 'check' | 'env',
): Promise<PackCommandResult> {
  try {
    const flags = parseArguments(context.argv);
    const binding = requireCloudflareResourceRuntimeBinding(
      await requireRuntime(context).resolveBinding(CLOUD_RESOURCE_CONTEXT_BINDING, {
        command: kind,
        focus: 'zones',
        cwd: flags.cwd ?? context.cwd,
        target: flags.target,
        environment: flags.environment,
      }),
    );
    const report =
      kind === 'check'
        ? createCloudflareReadinessReport({
            target: binding.target,
            generatedAt: binding.now?.toISOString(),
          })
        : createCloudflareEnvironmentReport({
            target: binding.target,
            generatedAt: binding.now?.toISOString(),
          });
    const artifact = binding.artifacts.writeJson({
      class: 'report',
      focus: kind === 'check' ? 'readiness' : 'environment',
      outputPath: flags.output,
      value: report,
    });
    const ok = kind === 'env' || ('ok' in report && report.ok);
    return result({
      command,
      maximumEffect: 'offline',
      actualEffect: 'offline',
      writeProject: true,
      status: ok ? 'ok' : 'attention',
      value: report,
      artifacts: [artifact.relativePath],
    });
  } catch (error) {
    return result({
      command,
      maximumEffect: 'offline',
      actualEffect: 'offline',
      writeProject: false,
      status: failureStatus(error),
      value: null,
      diagnostics: [diagnostic(error)],
    });
  }
}

export const runCloudInventory = (context: PackCommandContext) =>
  runInventory(context, 'cloud.inventory', 'workers', 'cloud workers');
export const runCloudCheck = (context: PackCommandContext) =>
  runReport(context, 'cloud.check', 'check');
export const runCloudEnv = (context: PackCommandContext) => runReport(context, 'cloud.env', 'env');
export const runCloudQueuesInventory = (context: PackCommandContext) =>
  runInventory(context, 'cloud.queues.inventory', 'queues', 'cloud queues');
export const runCloudQueuesPlan = (context: PackCommandContext) =>
  runPlan(context, 'cloud.queues.plan', 'queues');
export const runCloudQueuesApply = (context: PackCommandContext) =>
  runApply(context, 'cloud.queues.apply', 'queues');
export const runCloudWorkersInventory = (context: PackCommandContext) =>
  runInventory(context, 'cloud.workers.inventory', 'workers', 'cloud workers');
export const runCloudWorkersPlan = (context: PackCommandContext) =>
  runPlan(context, 'cloud.workers.plan', 'workers');
export const runCloudWorkersApply = (context: PackCommandContext) =>
  runApply(context, 'cloud.workers.apply', 'workers');
export const runCloudCronInventory = (context: PackCommandContext) =>
  runInventory(context, 'cloud.cron.inventory', 'cron', 'cloud cron');
export const runCloudCronPlan = (context: PackCommandContext) =>
  runPlan(context, 'cloud.cron.plan', 'cron');
export const runCloudCronApply = (context: PackCommandContext) =>
  runApply(context, 'cloud.cron.apply', 'cron');
export const runProviderCloudflareInventory = (context: PackCommandContext) =>
  runInventory(context, 'provider.cloudflare.inventory', 'workers', 'provider cloudflare workers');
export const runProviderCloudflareQueuesInventory = (context: PackCommandContext) =>
  runInventory(
    context,
    'provider.cloudflare.queues.inventory',
    'queues',
    'provider cloudflare queues',
  );
export const runProviderCloudflareQueuesPlan = (context: PackCommandContext) =>
  runPlan(context, 'provider.cloudflare.queues.plan', 'queues');
export const runProviderCloudflareQueuesApply = (context: PackCommandContext) =>
  runApply(context, 'provider.cloudflare.queues.apply', 'queues');
export const runProviderCloudflareWorkersInventory = (context: PackCommandContext) =>
  runInventory(
    context,
    'provider.cloudflare.workers.inventory',
    'workers',
    'provider cloudflare workers',
  );
export const runProviderCloudflareWorkersPlan = (context: PackCommandContext) =>
  runPlan(context, 'provider.cloudflare.workers.plan', 'workers');
export const runProviderCloudflareWorkersApply = (context: PackCommandContext) =>
  runApply(context, 'provider.cloudflare.workers.apply', 'workers');
export const runProviderCloudflareCronInventory = (context: PackCommandContext) =>
  runInventory(context, 'provider.cloudflare.cron.inventory', 'cron', 'provider cloudflare cron');
export const runProviderCloudflareCronPlan = (context: PackCommandContext) =>
  runPlan(context, 'provider.cloudflare.cron.plan', 'cron');
export const runProviderCloudflareCronApply = (context: PackCommandContext) =>
  runApply(context, 'provider.cloudflare.cron.apply', 'cron');
