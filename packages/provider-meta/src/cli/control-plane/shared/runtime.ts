import { controlPlaneSafeArtifactStamp, type ControlPlaneJsonArtifact } from '@unisane/ops-engine';
import { writeControlPlaneJsonArtifact } from '@unisane/ops-engine/local';
import type { MarketingMetaAuthRuntimeOptions } from '../../../meta/auth.js';
import type { MetaProviderCliOptions } from './types.js';

export function metaControlPlaneStamp(date = new Date()): string {
  return controlPlaneSafeArtifactStamp(date);
}

export function parseMetaPositiveInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      '[META_CONTROL_PLANE_NUMBER_INVALID] Numeric options must be positive integers.',
    );
  }
  return parsed;
}

export function metaAuthRuntimeFromOptions(
  options: MetaProviderCliOptions,
): MarketingMetaAuthRuntimeOptions {
  return {
    authHome: options.authHome,
    store: options.store,
    allowPlaintextStore: options.allowPlaintextStore,
  };
}

export function writeMetaProviderArtifact<T extends { artifact?: ControlPlaneJsonArtifact }>(args: {
  cwd: string;
  outputPath?: string;
  defaultRelativePath: string;
  value: T;
}): T {
  const artifact = writeControlPlaneJsonArtifact({
    cwd: args.cwd,
    outputPath: args.outputPath,
    defaultRelativePath: args.defaultRelativePath,
    value: args.value,
  });
  return { ...args.value, artifact };
}
