import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { initSeoResearchWorkspace } from '../workspace/init.js';

describe('initSeoResearchWorkspace', () => {
  it('creates the platform research workspace with default config and seed files', async () => {
    const cwd = await createPackageWorkspace('@unisane-platforms/true-resume');
    try {
      const result = await initSeoResearchWorkspace({ cwd });

      expect(result.platformId).toBe('true-resume');
      expect(result.created).toContain(
        'docs/domains/seo/keyword-research/seo-research.config.json',
      );
      expect(result.created).toContain('docs/domains/seo/keyword-research/seeds/manual.seed.json');
      expect(result.created).toContain('docs/domains/seo/keyword-research/faqs');
      expect(result.created).toContain('docs/domains/seo/keyword-research/serp');
      expect(result.created).toContain('docs/domains/seo/keyword-research/metadata');
      expect(result.created).toContain('docs/domains/seo/keyword-research/page-audits');
      expect(result.created).toContain('docs/domains/seo/keyword-research/site-crawls');

      const config = JSON.parse(
        await readFile(
          join(cwd, 'docs/domains/seo/keyword-research/seo-research.config.json'),
          'utf8',
        ),
      );
      expect(config).toMatchObject({
        version: 2,
        platformId: 'true-resume',
        seoPatternPack: 'true-resume',
        keywordPatternPack: 'resume-examples',
        markets: [{ country: 'US', language: 'en' }],
        opportunities: {
          basePath: 'resume-examples',
          ctaLabel: 'Start with this example',
          ctaTarget: '/resumes/new',
        },
        internalLinks: {
          hubLabel: 'All resume examples',
          maxRelated: 3,
          includeConversionLinks: true,
        },
      });

      const seeds = JSON.parse(
        await readFile(
          join(cwd, 'docs/domains/seo/keyword-research/seeds/manual.seed.json'),
          'utf8',
        ),
      );
      expect(seeds).toEqual({
        version: 1,
        platformId: 'true-resume',
        seeds: [],
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('does not overwrite existing config without force', async () => {
    const cwd = await createPackageWorkspace('@unisane-platforms/true-resume');
    try {
      const configPath = join(cwd, 'docs/domains/seo/keyword-research/seo-research.config.json');

      await initSeoResearchWorkspace({ cwd });
      await writeFile(configPath, '{"custom":true}\n');

      const result = await initSeoResearchWorkspace({ cwd });

      expect(result.skipped).toContain(
        'docs/domains/seo/keyword-research/seo-research.config.json',
      );
      expect(await readFile(configPath, 'utf8')).toBe('{"custom":true}\n');
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('supports dry-run without writing files', async () => {
    const cwd = await createPackageWorkspace('@unisane-platforms/true-resume');
    try {
      const result = await initSeoResearchWorkspace({ cwd, dryRun: true });

      expect(result.dryRun).toBe(true);
      await expect(
        readFile(join(cwd, 'docs/domains/seo/keyword-research/seo-research.config.json')),
      ).rejects.toThrow();
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});

async function createPackageWorkspace(packageName: string): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'unisane-seo-research-'));
  await mkdir(cwd, { recursive: true });
  await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: packageName }, null, 2));
  return cwd;
}
