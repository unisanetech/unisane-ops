import { readFileSync } from 'node:fs';
import path from 'node:path';
import { controlPlaneSafeArtifactStamp, type ControlPlaneJsonArtifact } from '@unisane/ops-engine';
import { writeControlPlaneJsonArtifact } from '@unisane/ops-engine/local';
import type { GoogleControlPlaneFetch } from '../client.js';
import type { GoogleProviderCliOptions, GoogleProviderPlanArtifact } from './types.js';
import type { GoogleConnectionService } from '../../connection.js';
import { resolveGoogleProviderConnectionToken } from '../../../cli/runtime.js';

export function googleControlPlaneStamp(date = new Date()): string {
  return controlPlaneSafeArtifactStamp(date);
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
  service: GoogleConnectionService,
  requiredScope: string,
): Promise<string> {
  return resolveGoogleProviderConnectionToken({
    service,
    connection: options.connection,
    environment: options.environment,
    requiredScope,
  });
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
