import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { GoogleTagManagerContainerManifest } from '../../../contracts.js';
import { loadGrowthProjectContext } from '../../project-context.js';

type LoadedModule = {
  default?: unknown;
  googleTagManagerContainer?: unknown;
  gtmContainer?: unknown;
};

export type LoadedGoogleTagManagerManifest = {
  manifest: GoogleTagManagerContainerManifest;
  path: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isGoogleTagManagerManifest(value: unknown): value is GoogleTagManagerContainerManifest {
  if (!isRecord(value)) return false;
  return (
    typeof value.appId === 'string' &&
    typeof value.accountId === 'string' &&
    typeof value.containerId === 'string' &&
    typeof value.namespace === 'string' &&
    isRecord(value.environments)
  );
}

function ensureWithinCwd(cwd: string, resolvedPath: string): void {
  const normalizedCwd = path.resolve(cwd);
  const normalizedPath = path.resolve(resolvedPath);
  const cwdPrefix = normalizedCwd.endsWith(path.sep)
    ? normalizedCwd
    : `${normalizedCwd}${path.sep}`;
  if (normalizedPath !== normalizedCwd && !normalizedPath.startsWith(cwdPrefix)) {
    throw new Error(
      `[GTM_MANIFEST_PATH_OUTSIDE_CWD] GTM manifest path must stay inside the working directory: ${resolvedPath}`,
    );
  }
}

function resolveManifestPath(cwd: string, selectedPath: string): string {
  const resolved = path.resolve(cwd, selectedPath);
  ensureWithinCwd(cwd, resolved);
  if (!existsSync(resolved)) {
    throw new Error(`[GTM_MANIFEST_NOT_FOUND] GTM manifest was not found at ${resolved}.`);
  }
  return resolved;
}

function manifestFromModule(moduleValue: LoadedModule): unknown {
  return moduleValue.default ?? moduleValue.googleTagManagerContainer ?? moduleValue.gtmContainer;
}

export async function loadGoogleTagManagerManifest(args: {
  cwd?: string;
  manifestPath?: string;
  app?: string;
}): Promise<LoadedGoogleTagManagerManifest> {
  const context = await loadGrowthProjectContext();
  const cwd = path.resolve(args.cwd ?? context.projectRoot);
  const selectedPath = args.manifestPath ?? context.growth.runtime.manifest;
  if (!selectedPath) {
    throw new Error(
      '[GTM_MANIFEST_SELECTION_MISSING] Select the Growth runtime manifest in unisane.config.ts or pass --manifest <path>.',
    );
  }
  const resolvedPath = resolveManifestPath(cwd, selectedPath);
  const imported = (await import(pathToFileURL(resolvedPath).href)) as LoadedModule;
  const manifest = manifestFromModule(imported);

  if (!isGoogleTagManagerManifest(manifest)) {
    throw new Error(
      `[GTM_MANIFEST_INVALID_EXPORT] GTM manifest at ${resolvedPath} must export a GoogleTagManagerContainerManifest as default, googleTagManagerContainer, or gtmContainer.`,
    );
  }

  if (args.app && manifest.appId !== args.app) {
    throw new Error(
      `[GTM_MANIFEST_APP_MISMATCH] Requested app '${args.app}' but manifest declares '${manifest.appId}'.`,
    );
  }

  return {
    manifest,
    path: resolvedPath,
  };
}
