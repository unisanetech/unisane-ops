import { readFileSync } from 'node:fs';
import path from 'node:path';
import { controlPlaneSafeArtifactStamp, type ControlPlaneJsonArtifact } from '@unisane/ops-engine';
import { writeControlPlaneJsonArtifact } from '@unisane/ops-engine/local';
import { refreshGoogleAccessToken, type GoogleAuthRuntimeOptions } from '../../auth.js';
import type { GoogleControlPlaneFetch } from '../client.js';
import type { GoogleProviderCliOptions, GoogleProviderPlanArtifact } from './types.js';

export function googleControlPlaneStamp(date = new Date()): string {
  return controlPlaneSafeArtifactStamp(date);
}

export function googleAuthRuntimeFromOptions(
  options: GoogleProviderCliOptions,
): GoogleAuthRuntimeOptions {
  return {
    authHome: options.authHome,
    store: options.store,
    allowPlaintextStore: options.allowPlaintextStore,
    fetch: options.fetch,
    namespace: options.namespace,
    authNamespace: options.authNamespace,
  };
}

export function googleProviderFetchFromOptions(
  options: GoogleProviderCliOptions,
  fetch?: GoogleControlPlaneFetch,
): GoogleControlPlaneFetch | undefined {
  return fetch ?? options.fetch;
}

export function writeGoogleProviderArtifact<
  T extends { artifact?: ControlPlaneJsonArtifact },
>(args: { cwd: string; outputPath?: string; defaultRelativePath: string; value: T }): T {
  const artifact = writeControlPlaneJsonArtifact({
    cwd: args.cwd,
    outputPath: args.outputPath,
    defaultRelativePath: args.defaultRelativePath,
    value: args.value,
  });
  return { ...args.value, artifact };
}

export function readGoogleJsonFile(filePath: string, cwd: string): unknown {
  const resolved = path.resolve(cwd, filePath);
  const normalizedCwd = path.resolve(cwd);
  if (resolved !== normalizedCwd && !resolved.startsWith(`${normalizedCwd}${path.sep}`)) {
    throw new Error(
      '[GOOGLE_ARTIFACT_PATH_OUTSIDE_CWD] Google artifact paths must stay inside cwd.',
    );
  }
  return JSON.parse(readFileSync(resolved, 'utf8')) as unknown;
}

export async function googleProviderAccessToken(
  options: GoogleProviderCliOptions,
  requiredScope: string,
): Promise<string> {
  const token = await refreshGoogleAccessToken({
    profile: options.profile,
    requiredScope,
    runtime: googleAuthRuntimeFromOptions(options),
  });
  return token.accessToken;
}

export function googlePlanHash(plan: GoogleProviderPlanArtifact): string {
  const stable = JSON.stringify({
    provider: plan.provider,
    projectId: plan.projectId,
    actions: plan.actions,
  });
  let hash = 0;
  for (let index = 0; index < stable.length; index += 1) {
    hash = (hash * 31 + stable.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
