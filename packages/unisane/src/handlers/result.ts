import type { PackCommandContext, PackCommandResult } from '@unisane/ops-engine/pack';

export function commandResult(
  context: PackCommandContext,
  input: {
    actualEffect: PackCommandResult['actualEffect'];
    writeTargets?: PackCommandResult['writeTargets'];
    status: PackCommandResult['status'];
    result: unknown;
    diagnostics?: string[];
    artifacts?: string[];
    nextActions?: string[];
    presentation?: PackCommandResult['presentation'];
  },
): PackCommandResult {
  const selection = context.selection;
  if (!selection) {
    throw new Error('[OPS_CORE_SELECTION_MISSING] Core commands require exact selection context.');
  }
  return {
    schemaVersion: 1,
    command: selection.command.id,
    pack: selection.packId,
    maximumEffect: selection.command.maximumEffect,
    actualEffect: input.actualEffect,
    writeTargets: input.writeTargets ?? [],
    riskGuards: selection.command.riskGuards,
    status: input.status,
    result: input.result,
    diagnostics: input.diagnostics ?? [],
    artifacts: input.artifacts ?? [],
    nextActions: input.nextActions ?? [],
    ...(input.presentation ? { presentation: input.presentation } : {}),
  };
}
