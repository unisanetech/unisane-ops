import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateAwsOpsConfig } from './config-schema.js';
import type { LoadedAwsOpsConfig } from './types.js';

const CONFIG_CANDIDATES = [
  path.join('config', 'aws.ops.ts'),
  path.join('config', 'aws.ops.mjs'),
  path.join('config', 'aws.ops.js'),
] as const;

type LoadedConfigModule = {
  default?: unknown;
  awsOpsConfig?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function ensureWithinCwd(cwd: string, resolvedPath: string): void {
  const normalizedCwd = path.resolve(cwd);
  const normalizedPath = path.resolve(resolvedPath);
  const cwdPrefix = normalizedCwd.endsWith(path.sep)
    ? normalizedCwd
    : `${normalizedCwd}${path.sep}`;
  if (normalizedPath !== normalizedCwd && !normalizedPath.startsWith(cwdPrefix)) {
    throw new Error(
      `[AWS_OPS_CONFIG_PATH_OUTSIDE_CWD] AWS ops config path must stay inside the working directory: ${resolvedPath}`,
    );
  }
}

function resolveConfigPath(cwd: string, explicitPath?: string): string {
  if (explicitPath) {
    const resolved = path.resolve(cwd, explicitPath);
    ensureWithinCwd(cwd, resolved);
    if (!existsSync(resolved)) {
      throw new Error(`[AWS_OPS_CONFIG_NOT_FOUND] AWS ops config was not found at ${resolved}.`);
    }
    return resolved;
  }

  for (const candidate of CONFIG_CANDIDATES) {
    const resolved = path.resolve(cwd, candidate);
    if (existsSync(resolved)) return resolved;
  }

  throw new Error(
    `[AWS_OPS_CONFIG_NOT_FOUND] Could not find AWS ops config. Create config/aws.ops.ts or pass --config <path>.`,
  );
}

function configFromModule(moduleValue: LoadedConfigModule): unknown {
  return moduleValue.default ?? moduleValue.awsOpsConfig;
}

export async function loadAwsOpsConfig(args: {
  cwd?: string;
  configPath?: string;
}): Promise<LoadedAwsOpsConfig> {
  const cwd = path.resolve(args.cwd ?? process.cwd());
  const resolvedPath = resolveConfigPath(cwd, args.configPath);
  const imported = (await import(pathToFileURL(resolvedPath).href)) as LoadedConfigModule;
  const candidate = configFromModule(imported);

  if (!isRecord(candidate)) {
    throw new Error(
      `[AWS_OPS_CONFIG_INVALID_EXPORT] AWS ops config at ${resolvedPath} must export an object as default or awsOpsConfig.`,
    );
  }

  return {
    config: validateAwsOpsConfig(candidate),
    path: resolvedPath,
  };
}
