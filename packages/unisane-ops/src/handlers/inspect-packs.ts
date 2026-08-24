import { packCommandResultSchema, type PackCommandHandler } from '@unisane/ops-engine/pack';

export const runInspectPacks: PackCommandHandler = (context) => {
  if (context.argv.length > 0) {
    throw new Error(`[OPS_CLI_ARGUMENT_UNKNOWN] inspect packs: ${context.argv.join(' ')}`);
  }
  return packCommandResultSchema.parse({
    schemaVersion: 1,
    command: 'core.inspect-packs',
    pack: 'core',
    maximumEffect: 'offline',
    actualEffect: 'offline',
    writeTargets: [],
    riskGuards: [],
    status: 'ok',
    result: {
      packs: context.manifests.map((manifest) => ({
        id: manifest.packId,
        packageName: manifest.packageName,
        version: manifest.version,
        trust: manifest.trust,
        integrity: manifest.integrity,
        commands: manifest.commands.map((command) => ({
          id: command.id,
          path: command.path,
          maximumEffect: command.maximumEffect,
          json: command.json,
        })),
        configNamespaces: manifest.configNamespaces,
        addItemTypes: manifest.addItemTypes,
        capabilities: manifest.capabilities,
        providerBindings: manifest.providerBindings,
      })),
    },
    diagnostics: [],
    artifacts: [],
    nextActions: [],
  });
};
