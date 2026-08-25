import { access, copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildMarketingConsoleState } from '@unisane/growth/console';
import { renderMarketingConsoleHtml } from './app.js';
import type { MarketingConsoleBuildResult } from './contracts.js';
import type {
  MarketingGoogleConnectionStatus,
  MarketingMetaConnectionStatus,
} from '@unisane/growth/marketing';
import type { MarketingConsoleCampaignPauseReview } from '@unisane/growth/console';

export type BuildMarketingConsoleAppOptions = {
  cwd?: string;
  configPath?: string;
  outputDirectory?: string;
  dryRun?: boolean;
  maxAgeDays?: number;
  now?: Date;
  googleAuth?: MarketingGoogleConnectionStatus;
  metaAuth?: MarketingMetaConnectionStatus;
  campaignPauseApprovalAvailable?: boolean;
  campaignPauseReviews?: readonly MarketingConsoleCampaignPauseReview[];
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
    campaignPauseApprovalAvailable: options.campaignPauseApprovalAvailable,
    campaignPauseReviews: options.campaignPauseReviews,
    now: options.now,
  });
  const outputDirectory = path.resolve(cwd, options.outputDirectory ?? '.unisane/console');
  const entryHtmlPath = path.join(outputDirectory, 'index.html');
  const statePath = path.join(outputDirectory, 'ui-state.json');
  const browserScriptOutputPath = path.join(outputDirectory, 'assets', 'console.js');
  if (!options.dryRun) {
    const browserAssetDirectory = path.dirname(await resolveBrowserAssetPath('main.js'));
    await mkdir(outputDirectory, { recursive: true });
    await rm(path.dirname(browserScriptOutputPath), { recursive: true, force: true });
    await mkdir(path.dirname(browserScriptOutputPath), { recursive: true });
    await copyBrowserAssets(browserAssetDirectory, path.dirname(browserScriptOutputPath));
    await writeFile(
      entryHtmlPath,
      renderMarketingConsoleHtml(state, {
        browserScriptHref: '/assets/console.js',
        browserStylesheetHref: '/assets/console.css',
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

async function copyBrowserAssets(sourceDirectory: string, outputDirectory: string): Promise<void> {
  const entries = await readdir(sourceDirectory, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const outputName =
          entry.name === 'main.js'
            ? 'console.js'
            : entry.name === 'main.css'
              ? 'console.css'
              : entry.name;
        return copyFile(
          path.join(sourceDirectory, entry.name),
          path.join(outputDirectory, outputName),
        );
      }),
  );
}

async function resolveBrowserAssetPath(fileName: string): Promise<string> {
  const candidatePaths = [
    ...candidateBrowserAssetPaths(process.cwd(), fileName),
    ...candidateBrowserAssetPaths(path.dirname(fileURLToPath(import.meta.url)), fileName),
  ];
  for (const candidatePath of candidatePaths) {
    if (await fileExists(candidatePath)) return candidatePath;
  }
  throw new Error(
    `[OPS_CONSOLE_BROWSER_ASSET_MISSING] Build @unisane/ops-console before serving (${fileName}).`,
  );
}

function candidateBrowserAssetPaths(startDirectory: string, fileName: string): string[] {
  const candidates: string[] = [];
  let currentDirectory = path.resolve(startDirectory);
  while (true) {
    candidates.push(
      path.join(currentDirectory, 'apps/console/dist/browser', fileName),
      path.join(currentDirectory, 'browser', fileName),
    );
    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) break;
    currentDirectory = parentDirectory;
  }
  return candidates;
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
