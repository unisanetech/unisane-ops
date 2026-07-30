import { access, copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
import { buildMarketingConsoleState } from '@unisane/growth/console';
import { renderMarketingConsoleHtml } from './app.js';
import type { MarketingConsoleBuildResult } from './contracts.js';
import type {
  MarketingGoogleConnectionStatus,
  MarketingMetaConnectionStatus,
} from '@unisane/growth/marketing';

export type BuildMarketingConsoleAppOptions = {
  cwd?: string;
  configPath?: string;
  outputDirectory?: string;
  dryRun?: boolean;
  maxAgeDays?: number;
  now?: Date;
  googleAuth?: MarketingGoogleConnectionStatus;
  metaAuth?: MarketingMetaConnectionStatus;
};

export async function buildMarketingConsoleApp(
  options: BuildMarketingConsoleAppOptions = {},
): Promise<MarketingConsoleBuildResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const state = await buildMarketingConsoleState({
    cwd,
    maxAgeDays: options.maxAgeDays,
    googleAuth: options.googleAuth,
    metaAuth: options.metaAuth,
    now: options.now,
  });
  const outputDirectory = path.resolve(cwd, options.outputDirectory ?? '.unisane/console');
  const entryHtmlPath = path.join(outputDirectory, 'index.html');
  const statePath = path.join(outputDirectory, 'ui-state.json');
  const unisaneUiCssSourcePath = await resolveUnisaneUiCssPath();
  const unisaneUiCssOutputPath = unisaneUiCssSourcePath
    ? path.join(outputDirectory, 'assets', 'unisane-ui.css')
    : undefined;
  if (!options.dryRun) {
    await mkdir(outputDirectory, { recursive: true });
    if (unisaneUiCssSourcePath && unisaneUiCssOutputPath) {
      await mkdir(path.dirname(unisaneUiCssOutputPath), { recursive: true });
      await copyFile(unisaneUiCssSourcePath, unisaneUiCssOutputPath);
    }
    await writeFile(
      entryHtmlPath,
      renderMarketingConsoleHtml(state, {
        unisaneUiStylesheetHref: unisaneUiCssOutputPath ? './assets/unisane-ui.css' : undefined,
      }),
      'utf8',
    );
    await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  }
  return {
    workspaceRoot: cwd,
    outputDirectory,
    entryHtmlPath,
    statePath,
    assetPaths: options.dryRun ? [] : await listFiles(outputDirectory),
    writeStatus: options.dryRun ? 'dry-run' : 'written',
    generatedAt: state.generatedAt,
    readiness: state.readiness,
    state,
  };
}

async function resolveUnisaneUiCssPath(): Promise<string | undefined> {
  const candidatePaths = [
    resolvePackageStylesheet(),
    ...candidateRepositoryStylesheetPaths(process.cwd()),
    ...candidateRepositoryStylesheetPaths(path.dirname(fileURLToPath(import.meta.url))),
  ].filter((candidatePath): candidatePath is string => Boolean(candidatePath));
  for (const candidatePath of candidatePaths) {
    if (await fileExists(candidatePath)) return candidatePath;
  }
  return undefined;
}

function candidateRepositoryStylesheetPaths(startDirectory: string): string[] {
  const candidates: string[] = [];
  let currentDirectory = path.resolve(startDirectory);
  while (true) {
    candidates.push(path.join(currentDirectory, 'unisane-ui/packages/core/dist/index.css'));
    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) break;
    currentDirectory = parentDirectory;
  }
  return candidates;
}

function resolvePackageStylesheet(): string | undefined {
  try {
    return createRequire(import.meta.url).resolve('@unisane/ui/styles.css');
  } catch {
    return undefined;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(entryPath)));
    if (entry.isFile()) files.push(entryPath);
  }
  return files;
}
