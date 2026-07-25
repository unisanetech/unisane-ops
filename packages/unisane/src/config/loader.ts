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
  if ('ops' in namespace && namespace.ops !== undefined) {
    return unisaneOpsConfigSchema.parse(namespace.ops);
  }
  const unwrapped = unwrapDefault(namespace);
  if (
    typeof unwrapped === 'object' &&
    unwrapped !== null &&
    'ops' in unwrapped &&
    'schemaVersion' in unwrapped &&
    !('project' in unwrapped)
  ) {
    return unisaneOpsConfigSchema.parse((unwrapped as Record<string, unknown>).ops);
  }
  const standalone = unisaneProjectConfigSchema.parse(unwrapped);
  return unisaneOpsConfigSchema.parse({
    schemaVersion: standalone.schemaVersion,
    project: standalone.project,
    environments: standalone.environments,
    connections: standalone.ops.connections,
    targets: standalone.ops.targets,
  });
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
