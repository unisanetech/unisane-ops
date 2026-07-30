import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { tsImport } from 'tsx/esm/api';
import {
  growthCapabilitySchema,
  growthConfigSchema,
  type GrowthCapability,
  type GrowthConfig,
} from '@unisane/growth/contracts';

function recordOf(input: unknown): Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

function unwrapDefault(input: unknown): unknown {
  let current = input;
  for (let depth = 0; depth < 3; depth += 1) {
    const record = recordOf(current);
    if (Object.keys(record).length !== 1 || !('default' in record)) break;
    current = record.default;
  }
  return current;
}

function enabled(record: Record<string, unknown>, key: string): boolean {
  const provider = recordOf(record[key]);
  return Object.keys(provider).length > 0 && provider.state !== 'disabled';
}

function inferCapabilities(input: Record<string, unknown>): GrowthCapability[] {
  const providers = recordOf(input.providers);
  const paths = recordOf(input.paths);
  const capabilities = new Set<GrowthCapability>();
  if (enabled(providers, 'searchConsole')) capabilities.add('seo');
  if (enabled(providers, 'ga4')) capabilities.add('analytics');
  if (enabled(providers, 'googleAds') || enabled(providers, 'metaAds')) {
    capabilities.add('advertising');
  }
  if ('gtmManifest' in paths) capabilities.add('tag-manager');
  if ('experimentRegistry' in paths) capabilities.add('experiments');
  if (capabilities.size === 0) {
    capabilities.add('seo');
    capabilities.add('analytics');
  }
  return [...capabilities].map((capability) => growthCapabilitySchema.parse(capability));
}

function projectPath(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function migrateRetiredGrowthConfig(input: unknown): GrowthConfig {
  const legacy = recordOf(unwrapDefault(input));
  if (Object.keys(legacy).length === 0) {
    throw new Error('[GROWTH_CONFIG_MIGRATION_INPUT_INVALID] Migration input is empty.');
  }
  const environments = recordOf(legacy.environments);
  const defaultEnvironment =
    typeof legacy.defaultEnvironment === 'string' && legacy.defaultEnvironment.trim()
      ? legacy.defaultEnvironment.trim()
      : 'development';
  const environmentIds =
    Object.keys(environments).length > 0 ? Object.keys(environments) : [defaultEnvironment];
  const paths = recordOf(legacy.paths);
  const gtmManifest = projectPath(paths, 'gtmManifest');
  return growthConfigSchema.parse({
    schemaVersion: 1,
    adoptionMode: 'migrate',
    capabilities: inferCapabilities(legacy),
    environments: Object.fromEntries(
      environmentIds.map((environmentId) => [
        environmentId,
        {
          connections: {},
          resources: [],
        },
      ]),
    ),
    manifests: {
      ...(projectPath(paths, 'eventRegistry')
        ? { events: projectPath(paths, 'eventRegistry') }
        : {}),
      ...(projectPath(paths, 'conversionRegistry')
        ? { conversions: projectPath(paths, 'conversionRegistry') }
        : {}),
      ...(projectPath(paths, 'experimentRegistry')
        ? { experiments: projectPath(paths, 'experimentRegistry') }
        : {}),
    },
    runtime: {
      integration: gtmManifest ? 'tag-manager' : 'existing',
      ...(gtmManifest ? { manifest: gtmManifest } : {}),
    },
    policy: {
      mutation: 'disabled',
      spend: 'disabled',
    },
  });
}

export async function loadRetiredGrowthConfigInput(args: {
  projectRoot: string;
  inputPath: string;
}): Promise<{ path: string; value: unknown }> {
  const projectRoot = path.resolve(args.projectRoot);
  const inputPath = path.resolve(projectRoot, args.inputPath);
  const relative = path.relative(projectRoot, inputPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      '[GROWTH_CONFIG_MIGRATION_INPUT_OUTSIDE_PROJECT] Migration input must stay inside the project.',
    );
  }
  if (!existsSync(inputPath) || !statSync(inputPath).isFile()) {
    throw new Error(
      `[GROWTH_CONFIG_MIGRATION_INPUT_NOT_FOUND] Migration input does not exist: ${args.inputPath}`,
    );
  }
  return {
    path: inputPath,
    value: await tsImport(pathToFileURL(inputPath).href, import.meta.url),
  };
}
