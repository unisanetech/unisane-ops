import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { UnisaneOpsConfig, UnisaneProjectConfig } from '../config/schema.js';

const CONFIG_FILE_NAME = 'unisane.config.ts';
const PROJECT_START = '// unisane-ops:project:start';
const PROJECT_END = '// unisane-ops:project:end';
const FRAMEWORK_START = '// unisane-ops:framework:start';
const FRAMEWORK_END = '// unisane-ops:framework:end';
const CONFIG_IMPORT =
  "import { defineUnisaneOps, defineUnisaneProject } from 'unisane-ops/config';";

export interface DetectedOpsProject {
  root: string;
  configPath: string;
  projectId: string;
  framework: boolean;
  priorGrowthState: boolean;
}

function recordOf(input: unknown): Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

function packageDocument(root: string): Record<string, unknown> {
  const packagePath = path.join(root, 'package.json');
  if (!existsSync(packagePath)) return {};
  return recordOf(JSON.parse(readFileSync(packagePath, 'utf8')) as unknown);
}

function dependencyNames(document: Record<string, unknown>): Set<string> {
  const fields = ['dependencies', 'devDependencies', 'peerDependencies'] as const;
  return new Set(fields.flatMap((field) => Object.keys(recordOf(document[field]))));
}

function stableProjectId(input: string): string {
  const unscoped = input.includes('/') ? input.slice(input.lastIndexOf('/') + 1) : input;
  const normalized = unscoped
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '');
  return normalized || 'project';
}

export function detectOpsProject(cwd: string): DetectedOpsProject {
  const root = path.resolve(cwd);
  const configPath = path.join(root, CONFIG_FILE_NAME);
  const packageJson = packageDocument(root);
  const dependencies = dependencyNames(packageJson);
  const configSource = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
  const name = typeof packageJson.name === 'string' ? packageJson.name : path.basename(root);
  return {
    root,
    configPath,
    projectId: stableProjectId(name),
    framework:
      dependencies.has('@unisane/platform') ||
      dependencies.has('@unisane/config') ||
      configSource.includes("from '@unisane/config'") ||
      configSource.includes('from "@unisane/config"'),
    priorGrowthState: false,
  };
}

function projectConfigOf(config: UnisaneOpsConfig): UnisaneProjectConfig {
  return {
    schemaVersion: config.schemaVersion,
    project: config.project,
    environments: config.environments,
    ops: {
      connections: config.connections,
      targets: config.targets,
      capabilities: config.capabilities,
    },
  };
}

function renderValue(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function renderProjectBlock(config: UnisaneOpsConfig): string {
  return `${PROJECT_START}
export default defineUnisaneProject(${renderValue(projectConfigOf(config))});
${PROJECT_END}`;
}

function renderFrameworkBlock(config: UnisaneOpsConfig): string {
  return `${FRAMEWORK_START}
export const ops = defineUnisaneOps(${renderValue(config)});
${FRAMEWORK_END}`;
}

function writeAtomic(filePath: string, source: string): void {
  const temporaryPath = `${filePath}.unisane-ops-${process.pid}.tmp`;
  writeFileSync(temporaryPath, source, { encoding: 'utf8', mode: 0o600 });
  renameSync(temporaryPath, filePath);
}

function ensureConfigImport(source: string): string {
  if (/\bdefineUnisaneOps\b/.test(source)) return source;
  return `import { defineUnisaneOps } from 'unisane-ops/config';\n${source}`;
}

function replaceBlock(args: {
  source: string;
  start: string;
  end: string;
  replacement: string;
}): string | null {
  const startIndex = args.source.indexOf(args.start);
  const endIndex = args.source.indexOf(args.end);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) return null;
  return `${args.source.slice(0, startIndex)}${args.replacement}${args.source.slice(
    endIndex + args.end.length,
  )}`;
}

export function createInitialOpsConfig(input: {
  projectId: string;
  environmentId: string;
  production: boolean;
}): UnisaneOpsConfig {
  return {
    schemaVersion: 1,
    project: {
      id: input.projectId,
    },
    environments: {
      [input.environmentId]: {
        production: input.production,
      },
    },
    connections: {},
    targets: {},
    capabilities: {},
  };
}

export function initializeOpsConfigSource(args: {
  project: DetectedOpsProject;
  config: UnisaneOpsConfig;
}): { configPath: string; mode: 'standalone' | 'framework' } {
  if (!existsSync(args.project.configPath)) {
    writeAtomic(
      args.project.configPath,
      `${CONFIG_IMPORT}\n\n${renderProjectBlock(args.config)}\n`,
    );
    return { configPath: args.project.configPath, mode: 'standalone' };
  }

  const source = readFileSync(args.project.configPath, 'utf8');
  if (
    source.includes(PROJECT_START) ||
    source.includes(FRAMEWORK_START) ||
    /\bexport\s+const\s+ops\b/.test(source)
  ) {
    throw new Error('[UNISANE_OPS_ALREADY_INITIALIZED] This project already declares Ops intent.');
  }
  if (!args.project.framework) {
    throw new Error(
      '[UNISANE_OPS_CONFIG_OCCUPIED] Existing unisane.config.ts is not a detected Framework config. Move its intent into defineUnisaneProject before initializing Ops.',
    );
  }

  const withImport = ensureConfigImport(source);
  writeAtomic(
    args.project.configPath,
    `${withImport.trimEnd()}\n\n${renderFrameworkBlock(args.config)}\n`,
  );
  return { configPath: args.project.configPath, mode: 'framework' };
}

export function updateOpsConfigSource(args: {
  configPath: string;
  config: UnisaneOpsConfig;
}): void {
  const source = readFileSync(args.configPath, 'utf8');
  const projectReplacement = replaceBlock({
    source,
    start: PROJECT_START,
    end: PROJECT_END,
    replacement: renderProjectBlock(args.config),
  });
  if (projectReplacement !== null) {
    writeAtomic(args.configPath, projectReplacement);
    return;
  }
  const frameworkReplacement = replaceBlock({
    source,
    start: FRAMEWORK_START,
    end: FRAMEWORK_END,
    replacement: renderFrameworkBlock(args.config),
  });
  if (frameworkReplacement !== null) {
    writeAtomic(args.configPath, frameworkReplacement);
    return;
  }
  throw new Error(
    '[UNISANE_OPS_CONFIG_NOT_OWNED] The canonical Ops block is not tool-owned. Update the named ops export directly or re-run unisane-ops init after removing the manual declaration.',
  );
}
