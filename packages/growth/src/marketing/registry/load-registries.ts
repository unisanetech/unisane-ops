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
import type { MarketingConfig } from '../schema/marketing-config.js';

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
): Promise<LoadedMarketingArtifact<T>> {
  const resolvedPath = path.resolve(cwd, relativePath);
  ensurePathWithinCwd(cwd, resolvedPath);
  if (!existsSync(resolvedPath)) {
    throw new Error(
      `[${missingCode}] Marketing registry artifact was not found at ${resolvedPath}.`,
    );
  }
  return {
    path: resolvedPath,
    value: schema.parse(await readArtifactValue(resolvedPath)) as T,
  };
}

export async function loadMarketingRegistries(
  config: MarketingConfig,
  options: LoadMarketingRegistryOptions = {},
): Promise<LoadedMarketingRegistries> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const events = await loadArtifact<MarketingEventRegistry>(
    cwd,
    config.paths.eventRegistry,
    marketingEventRegistrySchema,
    'MARKETING_EVENT_REGISTRY_NOT_FOUND',
  );
  const conversions = await loadArtifact<MarketingConversionRegistry>(
    cwd,
    config.paths.conversionRegistry,
    marketingConversionRegistrySchema,
    'MARKETING_CONVERSION_REGISTRY_NOT_FOUND',
  );
  return { events, conversions };
}
