import path from 'node:path';
import { exists, readJson } from '../../utils/fs.js';
import {
  createDefaultSeoResearchConfig,
  seoResearchConfigSchema,
  type SeoResearchConfig,
} from '../schema/config.js';
import { resolvePlatformId } from './init.js';
import { resolveSeoResearchWorkspacePaths } from './paths.js';

export type LoadSeoResearchConfigOptions = {
  cwd?: string;
  platformId?: string;
};

export type LoadSeoResearchConfigResult = {
  cwd: string;
  config: SeoResearchConfig;
  configPath: string;
  source: 'file' | 'default';
};

export async function loadSeoResearchConfig(
  options: LoadSeoResearchConfigOptions = {},
): Promise<LoadSeoResearchConfigResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const paths = resolveSeoResearchWorkspacePaths(cwd);

  if (await exists(paths.config)) {
    return {
      cwd,
      configPath: paths.config,
      source: 'file',
      config: seoResearchConfigSchema.parse(await readJson(paths.config)),
    };
  }

  const platformId = await resolvePlatformId(cwd, options.platformId);
  return {
    cwd,
    configPath: paths.config,
    source: 'default',
    config: createDefaultSeoResearchConfig(platformId),
  };
}
