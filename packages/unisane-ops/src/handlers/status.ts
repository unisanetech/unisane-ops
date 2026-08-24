import { packCommandResultSchema, type PackCommandHandler } from '@unisane/ops-engine/pack';

export const runStatus: PackCommandHandler = (context) => {
  if (context.argv.length > 0) {
    throw new Error(`[OPS_CLI_ARGUMENT_UNKNOWN] status: ${context.argv.join(' ')}`);
  }
  return packCommandResultSchema.parse({
    schemaVersion: 1,
    command: 'core.status',
    pack: 'core',
    maximumEffect: 'offline',
    actualEffect: 'offline',
    writeTargets: [],
    riskGuards: [],
    status: 'ok',
    result: {
      host: 'unisane-ops',
      packApiVersion: 1,
      packs: context.manifests.map((manifest) => ({
        id: manifest.packId,
        packageName: manifest.packageName,
        version: manifest.version,
        commands: manifest.commands.length,
      })),
    },
    diagnostics: [],
    artifacts: [],
    nextActions: ['Run `unisane-ops inspect packs` for the validated pack graph.'],
  });
};
