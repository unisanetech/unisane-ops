import {
  packCommandResultSchema,
  type PackCommandContext,
  type PackCommandResult,
} from '@unisane/ops-engine/pack';
import {
  CLOUDFLARE_CONNECTION_BINDING,
  requireCloudflareConnectionBinding,
  type CloudflareConnectionReport,
} from '../runtime.js';

interface ParsedArguments {
  cwd?: string;
  connection?: string;
  output?: string;
}

function parseArguments(argv: readonly string[]): ParsedArguments {
  const parsed: ParsedArguments = {};
  const flags: ReadonlyMap<string, keyof ParsedArguments> = new Map([
    ['--cwd', 'cwd'],
    ['--connection', 'connection'],
    ['--output', 'output'],
  ] as const);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    const property = flags.get(argument);
    if (!property) {
      throw new Error(
        `[OPS_CLI_ARGUMENT_UNKNOWN] Unknown Cloudflare connection argument '${argument}'.`,
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

function commandResult(args: {
  status: PackCommandResult['status'];
  actualEffect: 'offline' | 'read-network';
  value: unknown;
  diagnostics?: string[];
  artifacts?: string[];
  nextActions?: string[];
}): PackCommandResult {
  return packCommandResultSchema.parse({
    schemaVersion: 1,
    command: 'provider.cloudflare.connection.check',
    pack: 'provider.cloudflare',
    maximumEffect: 'read-network',
    actualEffect: args.actualEffect,
    writeTargets: args.artifacts?.length ? ['project'] : [],
    riskGuards: [],
    status: args.status,
    result: args.value,
    diagnostics: args.diagnostics ?? [],
    artifacts: args.artifacts ?? [],
    nextActions: args.nextActions ?? [],
  });
}

export async function runCloudflareConnectionCheck(
  context: PackCommandContext,
): Promise<PackCommandResult> {
  try {
    if (!context.runtime) {
      throw new Error(
        '[OPS_COMMAND_RUNTIME_REQUIRED] Cloudflare connection check requires a host binding.',
      );
    }
    const flags = parseArguments(context.argv);
    const binding = requireCloudflareConnectionBinding(
      await context.runtime.resolveBinding(CLOUDFLARE_CONNECTION_BINDING, {
        command: 'connection.check',
        cwd: flags.cwd ?? context.cwd,
        connection: flags.connection,
      }),
    );
    const verification = await binding.provider.verifyConnection();
    const accounts = await binding.provider.listAccounts();
    const zones = (
      await Promise.all(
        accounts.map((account) => binding.provider.listZones({ accountId: account.id })),
      )
    )
      .flat()
      .map((zone) => ({
        id: zone.id,
        name: zone.name,
        status: zone.status,
        accountId: zone.accountId,
        accountName: zone.accountName,
      }));
    const configuredAccountObserved =
      binding.configuredAccountId === null ||
      accounts.some((account) => account.id === binding.configuredAccountId);
    const report: CloudflareConnectionReport = {
      schemaVersion: 1,
      kind: 'provider.cloudflare.connection-report',
      provider: 'cloudflare',
      projectId: binding.projectId,
      connectionId: binding.connectionId,
      generatedAt: binding.now?.toISOString() ?? new Date().toISOString(),
      configuredAccountId: binding.configuredAccountId,
      verification,
      accounts,
      zones,
      configuredAccountObserved,
    };
    const artifact = binding.artifacts.writeJson({ outputPath: flags.output, value: report });
    const ok = verification.status === 'active' && configuredAccountObserved;
    return commandResult({
      status: ok ? 'ok' : 'attention',
      actualEffect: 'read-network',
      value: report,
      artifacts: [artifact.relativePath],
      diagnostics: [
        ...(verification.status === 'active'
          ? []
          : [`Cloudflare token status is '${verification.status ?? 'unknown'}'.`]),
        ...(configuredAccountObserved
          ? []
          : [`Configured account '${binding.configuredAccountId}' was not observed.`]),
      ],
      nextActions:
        binding.configuredAccountId === null
          ? ['Select an observed account id in the Cloudflare connection configuration.']
          : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const invalid =
      message.includes('ARGUMENT_') ||
      message.includes('CONNECTION_UNKNOWN') ||
      message.includes('CONNECTION_REQUIRED');
    const blocked =
      message.includes('RUNTIME_REQUIRED') ||
      message.includes('API_TOKEN_MISSING') ||
      message.includes('BINDING_');
    return commandResult({
      status: invalid ? 'invalid' : blocked ? 'blocked' : 'failed',
      actualEffect: 'offline',
      value: null,
      diagnostics: [message],
    });
  }
}
