import path from 'node:path';
import { readJson, writeJson, writeText, ensureDir, exists } from '../../utils/fs.js';
import { createDefaultSeoResearchConfig } from '../schema/config.js';
import { createEmptyKeywordSeedFile } from '../schema/seed.js';
import { resolveSeoResearchWorkspacePaths } from './paths.js';

export type InitSeoResearchWorkspaceOptions = {
  cwd?: string;
  platformId?: string;
  force?: boolean;
  dryRun?: boolean;
};

export type InitSeoResearchWorkspaceResult = {
  root: string;
  platformId: string;
  created: string[];
  skipped: string[];
  dryRun: boolean;
};

const researchDirectories = [
  'seeds',
  'raw',
  'normalized',
  'clusters',
  'competitors',
  'faqs',
  'serp',
  'metadata',
  'pageAudits',
  'opportunities',
  'briefs',
  'internalLinks',
  'ads',
  'reports',
] as const;

export async function initSeoResearchWorkspace(
  options: InitSeoResearchWorkspaceOptions,
): Promise<InitSeoResearchWorkspaceResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const platformId = await resolvePlatformId(cwd, options.platformId);
  const paths = resolveSeoResearchWorkspacePaths(cwd);
  const created: string[] = [];
  const skipped: string[] = [];

  for (const key of researchDirectories) {
    const directory = paths[key];
    if (await exists(directory)) {
      skipped.push(relativeToCwd(cwd, directory));
      continue;
    }
    created.push(relativeToCwd(cwd, directory));
    if (!options.dryRun) {
      await ensureDir(directory);
    }
  }

  await writeJsonIfNeeded({
    cwd,
    path: paths.config,
    value: createDefaultSeoResearchConfig(platformId),
    force: options.force,
    dryRun: options.dryRun,
    created,
    skipped,
  });

  await writeJsonIfNeeded({
    cwd,
    path: paths.manualSeeds,
    value: createEmptyKeywordSeedFile(platformId),
    force: options.force,
    dryRun: options.dryRun,
    created,
    skipped,
  });

  await writeTextIfNeeded({
    cwd,
    path: paths.gitignore,
    value: ['.credentials*', 'cache/', 'raw/private/', ''].join('\n'),
    force: options.force,
    dryRun: options.dryRun,
    created,
    skipped,
  });

  return {
    root: paths.root,
    platformId,
    created,
    skipped,
    dryRun: options.dryRun === true,
  };
}

export async function resolvePlatformId(cwd: string, explicitPlatformId?: string): Promise<string> {
  if (explicitPlatformId?.trim()) {
    return explicitPlatformId.trim();
  }

  const packageJsonPath = path.join(cwd, 'package.json');
  if (!(await exists(packageJsonPath))) {
    throw new Error('Pass --platform or run this command from a package with package.json.');
  }

  const packageJson = await readJson<{ name?: string }>(packageJsonPath);
  const name = packageJson.name?.trim();
  if (!name) {
    throw new Error('Cannot infer platform id from package.json without a package name.');
  }

  return name.split('/').at(-1) ?? name;
}

type WriteJsonIfNeededOptions = {
  cwd: string;
  path: string;
  value: unknown;
  force?: boolean;
  dryRun?: boolean;
  created: string[];
  skipped: string[];
};

async function writeJsonIfNeeded(options: WriteJsonIfNeededOptions): Promise<void> {
  const label = relativeToCwd(options.cwd, options.path);
  if ((await exists(options.path)) && !options.force) {
    options.skipped.push(label);
    return;
  }
  options.created.push(label);
  if (!options.dryRun) {
    await writeJson(options.path, options.value);
  }
}

type WriteTextIfNeededOptions = WriteJsonIfNeededOptions & {
  value: string;
};

async function writeTextIfNeeded(options: WriteTextIfNeededOptions): Promise<void> {
  const label = relativeToCwd(options.cwd, options.path);
  if ((await exists(options.path)) && !options.force) {
    options.skipped.push(label);
    return;
  }
  options.created.push(label);
  if (!options.dryRun) {
    await writeText(options.path, options.value);
  }
}

function relativeToCwd(cwd: string, targetPath: string): string {
  return path.relative(cwd, targetPath);
}
