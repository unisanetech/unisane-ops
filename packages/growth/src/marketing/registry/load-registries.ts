import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { z } from 'zod';
import {
  marketingConversionRegistrySchema,
  type MarketingConversionRegistry,
} from '../schema/conversion-registry.js';
import {
  marketingEventRegistrySchema,
  type MarketingEventRegistry,
} from '../schema/event-registry.js';
import type { MarketingExecutionContext } from '../schema/execution-context.js';

type LoadedMarketingArtifact<T> = {
  path: string;
  value: T;
};

type LoadedModule = {
  default?: unknown;
  registry?: unknown;
  events?: unknown;
  conversions?: unknown;
};

export type LoadMarketingRegistryOptions = {
  cwd?: string;
};

export type LoadedMarketingRegistries = {
  events: LoadedMarketingArtifact<MarketingEventRegistry>;
  conversions: LoadedMarketingArtifact<MarketingConversionRegistry>;
};

function ensurePathWithinCwd(cwd: string, resolvedPath: string): void {
  const normalizedCwd = path.resolve(cwd);
  const normalizedPath = path.resolve(resolvedPath);
  const cwdPrefix = normalizedCwd.endsWith(path.sep)
    ? normalizedCwd
    : `${normalizedCwd}${path.sep}`;
  if (normalizedPath !== normalizedCwd && !normalizedPath.startsWith(cwdPrefix)) {
    throw new Error(
      `[MARKETING_REGISTRY_PATH_OUTSIDE_CWD] Marketing registry path must stay inside the working directory: ${resolvedPath}`,
    );
  }
}

async function readArtifactValue(resolvedPath: string): Promise<unknown> {
  if (resolvedPath.endsWith('.json')) {
    return JSON.parse(readFileSync(resolvedPath, 'utf8')) as unknown;
  }
  const imported = (await import(pathToFileURL(resolvedPath).href)) as LoadedModule;
  return imported.default ?? imported.registry ?? imported.events ?? imported.conversions;
}

async function loadArtifact<T>(
  cwd: string,
  relativePath: string,
  schema: z.ZodTypeAny,
  missingCode: string,
  retiredVersionCode?: string,
): Promise<LoadedMarketingArtifact<T>> {
  const resolvedPath = path.resolve(cwd, relativePath);
  ensurePathWithinCwd(cwd, resolvedPath);
  if (!existsSync(resolvedPath)) {
    throw new Error(
      `[${missingCode}] Marketing registry artifact was not found at ${resolvedPath}.`,
    );
  }
  const value = await readArtifactValue(resolvedPath);
  if (
    retiredVersionCode &&
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    value.version === 1
  ) {
    throw new Error(
      `[${retiredVersionCode}] Event registry version 1 is retired. Run the explicit migrateMarketingEventRegistryV1 migration and save the version 2 artifact before ordinary runtime loading.`,
    );
  }
  return {
    path: resolvedPath,
    value: schema.parse(value) as T,
  };
}

export async function loadMarketingRegistries(
  config: MarketingExecutionContext,
  options: LoadMarketingRegistryOptions = {},
): Promise<LoadedMarketingRegistries> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const events = await loadArtifact<MarketingEventRegistry>(
    cwd,
    config.paths.eventRegistry,
    marketingEventRegistrySchema,
    'MARKETING_EVENT_REGISTRY_NOT_FOUND',
    'MARKETING_EVENT_REGISTRY_V1_RETIRED',
  );
  const conversions = await loadArtifact<MarketingConversionRegistry>(
    cwd,
    config.paths.conversionRegistry,
    marketingConversionRegistrySchema,
    'MARKETING_CONVERSION_REGISTRY_NOT_FOUND',
  );
  return { events, conversions };
}

export function isMissingMarketingRegistryError(error: unknown): boolean {
  return error instanceof Error && [
    'MARKETING_EVENT_REGISTRY_NOT_FOUND',
    'MARKETING_CONVERSION_REGISTRY_NOT_FOUND',
  ].some((code) => error.message.includes(`[${code}]`));
}
