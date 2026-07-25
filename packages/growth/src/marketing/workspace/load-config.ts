import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { marketingConfigSchema, type MarketingConfig } from '../schema/marketing-config.js';

const MARKETING_CONFIG_CANDIDATES = [
  path.join('config', 'marketing.ts'),
  path.join('config', 'marketing.mjs'),
  path.join('config', 'marketing.json'),
] as const;

type LoadedMarketingModule = {
  default?: unknown;
  marketingConfig?: unknown;
  marketing?: unknown;
};

export type LoadedMarketingConfig = {
  config: MarketingConfig;
  path: string;
};

export type LoadMarketingConfigOptions = {
  cwd?: string;
  configPath?: string;
};

function ensureWithinCwd(cwd: string, resolvedPath: string): void {
  const normalizedCwd = path.resolve(cwd);
  const normalizedPath = path.resolve(resolvedPath);
  const cwdPrefix = normalizedCwd.endsWith(path.sep)
    ? normalizedCwd
    : `${normalizedCwd}${path.sep}`;
  if (normalizedPath !== normalizedCwd && !normalizedPath.startsWith(cwdPrefix)) {
    throw new Error(
      `[MARKETING_CONFIG_PATH_OUTSIDE_CWD] Marketing config path must stay inside the working directory: ${resolvedPath}`,
    );
  }
}

export function resolveMarketingConfigPath(options: LoadMarketingConfigOptions = {}): string {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  if (options.configPath) {
    const resolved = path.resolve(cwd, options.configPath);
    ensureWithinCwd(cwd, resolved);
    if (!existsSync(resolved)) {
      throw new Error(
        `[MARKETING_CONFIG_NOT_FOUND] Marketing config was not found at ${resolved}.`,
      );
    }
    return resolved;
  }

  for (const candidate of MARKETING_CONFIG_CANDIDATES) {
    const resolved = path.resolve(cwd, candidate);
    if (existsSync(resolved)) {
      return resolved;
    }
  }

  throw new Error(
    '[MARKETING_CONFIG_NOT_FOUND] Could not find config/marketing.ts, config/marketing.mjs, or config/marketing.json.',
  );
}

function configFromModule(moduleValue: LoadedMarketingModule): unknown {
  return moduleValue.default ?? moduleValue.marketingConfig ?? moduleValue.marketing;
}

async function readConfigValue(resolvedPath: string): Promise<unknown> {
  if (resolvedPath.endsWith('.json')) {
    return JSON.parse(readFileSync(resolvedPath, 'utf8')) as unknown;
  }
  const imported = (await import(pathToFileURL(resolvedPath).href)) as LoadedMarketingModule;
  return configFromModule(imported);
}

export async function loadMarketingConfig(
  options: LoadMarketingConfigOptions = {},
): Promise<LoadedMarketingConfig> {
  const resolvedPath = resolveMarketingConfigPath(options);
  const value = await readConfigValue(resolvedPath);
  return {
    config: marketingConfigSchema.parse(value),
    path: resolvedPath,
  };
}
