import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { tsImport } from 'tsx/esm/api';
import {
  unisaneOpsConfigSchema,
  unisaneProjectConfigSchema,
  type UnisaneOpsConfig,
} from './schema.js';

const CONFIG_FILE_NAME = 'unisane.config.ts';

export interface LoadedUnisaneOpsConfig {
  config: UnisaneOpsConfig;
  configPath: string;
  projectRoot: string;
}

function findConfigPath(startDirectory: string): string {
  let current = startDirectory;
  while (true) {
    const candidate = path.join(current, CONFIG_FILE_NAME);
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(
        `[UNISANE_OPS_CONFIG_NOT_FOUND] No ${CONFIG_FILE_NAME} was found from '${startDirectory}'.`,
      );
    }
    current = parent;
  }
}

function asModuleNamespace(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null) {
    throw new Error('[UNISANE_OPS_CONFIG_MODULE_INVALID] Config module is invalid.');
  }
  return input as Record<string, unknown>;
}

function unwrapDefault(input: unknown): unknown {
  let current = input;
  for (let depth = 0; depth < 3; depth += 1) {
    if (typeof current !== 'object' || current === null || !('default' in current)) {
      break;
    }
    const record = current as Record<string, unknown>;
    const keys = Object.keys(record).filter(
      (key) => key !== '__esModule' && key !== 'module.exports',
    );
    if (keys.length !== 1 || keys[0] !== 'default') break;
    current = record.default;
  }
  return current;
}

function normalizeConfig(namespace: Record<string, unknown>): UnisaneOpsConfig {
  // tsx can expose a CommonJS exports object through an ESM default wrapper.
  // Inspect that namespace before choosing a config export, so conflicts cannot hide inside it.
  const wrapped = namespace.default;
  if (
    typeof wrapped === 'object' &&
    wrapped !== null &&
    '__esModule' in wrapped &&
    wrapped.__esModule === true
  ) {
    namespace = asModuleNamespace(wrapped);
  }
  if (Object.prototype.hasOwnProperty.call(namespace, 'ops')) {
    if (!Object.prototype.hasOwnProperty.call(namespace, 'default')) {
      throw new Error(
        '[UNISANE_OPS_FRAMEWORK_DEFAULT_MISSING] The named ops export requires the Framework-owned default export.',
      );
    }
    const defaultExport = unwrapDefault({ default: namespace.default });
    if (unisaneProjectConfigSchema.safeParse(defaultExport).success) {
      throw new Error(
        '[UNISANE_OPS_CONFIG_EXPORT_AMBIGUOUS] Use either the standalone default export or the exact named ops export, not both.',
      );
    }
    return parseCurrentOpsConfig(namespace.ops);
  }
  const standalone = parseCurrentProjectConfig(unwrapDefault(namespace));
  return unisaneOpsConfigSchema.parse({
    schemaVersion: standalone.schemaVersion,
    project: standalone.project,
    environments: standalone.environments,
    connections: standalone.ops.connections,
    targets: standalone.ops.targets,
    capabilities: standalone.ops.capabilities,
    ...(standalone.ops.execution ? { execution: standalone.ops.execution } : {}),
  });
}

function isRetiredGrowthConfig(input: unknown): boolean {
  if (typeof input !== 'object' || input === null) return false;
  const record = input as Record<string, unknown>;
  if ('marketing' in record || 'googleTagManager' in record || 'gtm' in record) return true;
  if (
    record.version === 1 &&
    typeof record.platformId === 'string' &&
    'providers' in record &&
    'environments' in record &&
    !('schemaVersion' in record)
  ) {
    return true;
  }
  const capabilities =
    typeof record.capabilities === 'object' && record.capabilities !== null
      ? (record.capabilities as Record<string, unknown>)
      : null;
  return capabilities !== null && 'growth' in capabilities;
}

function retiredGrowthConfigError(): Error {
  return new Error(
    '[GROWTH_CONFIG_SCHEMA_RETIRED] This project uses a retired Growth configuration. Run the versioned Growth config migrator before loading it.',
  );
}

function parseCurrentOpsConfig(input: unknown): UnisaneOpsConfig {
  const result = unisaneOpsConfigSchema.safeParse(input);
  if (result.success) return result.data;
  if (isRetiredGrowthConfig(input)) throw retiredGrowthConfigError();
  throw result.error;
}

function parseCurrentProjectConfig(
  input: unknown,
): ReturnType<typeof unisaneProjectConfigSchema.parse> {
  const result = unisaneProjectConfigSchema.safeParse(input);
  if (result.success) return result.data;
  if (isRetiredGrowthConfig(input)) throw retiredGrowthConfigError();
  const record =
    typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : null;
  if (record?.ops && isRetiredGrowthConfig(record.ops)) throw retiredGrowthConfigError();
  throw result.error;
}

export async function loadUnisaneOpsConfig(cwd: string): Promise<LoadedUnisaneOpsConfig> {
  const resolvedCwd = path.resolve(cwd);
  if (!existsSync(resolvedCwd) || !statSync(resolvedCwd).isDirectory()) {
    throw new Error(`[UNISANE_OPS_CWD_INVALID] Working directory does not exist: ${resolvedCwd}`);
  }
  const configPath = findConfigPath(resolvedCwd);
  const namespace = asModuleNamespace(
    await tsImport(pathToFileURL(configPath).href, import.meta.url),
  );
  return {
    config: normalizeConfig(namespace),
    configPath,
    projectRoot: path.dirname(configPath),
  };
}
