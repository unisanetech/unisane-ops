import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { registerGrowthCommands } from '../../../register.js';

describe('SEO site crawl CLI registration', () => {
  it('registers the bounded local crawl leaf with workspace and machine-readable options', () => {
    const program = new Command();
    registerGrowthCommands(program);
    const growth = program.commands.find((command) => command.name() === 'growth');
    const seo = growth?.commands.find((command) => command.name() === 'seo');
    const site = seo?.commands.find((command) => command.name() === 'site');
    const configure = site?.commands.find((command) => command.name() === 'configure');
    const crawl = site?.commands.find((command) => command.name() === 'crawl');

    expect(configure?.description()).toContain('site and target-market identity');
    expect(configure?.options.map((option) => option.long)).toEqual(
      expect.arrayContaining([
        '--site',
        '--market',
        '--confirm-ownership',
        '--max-pages',
        '--max-depth',
        '--no-sitemaps',
        '--dry-run',
        '--json',
      ]),
    );

    expect(crawl?.description()).toContain('bounded local HTTP crawl evidence');
    expect(crawl?.options.map((option) => option.long)).toEqual(
      expect.arrayContaining([
        '--site',
        '--out',
        '--previous',
        '--no-incremental',
        '--no-sitemaps',
        '--max-pages',
        '--max-depth',
        '--max-sitemaps',
        '--max-discovered-urls',
        '--max-response-bytes',
        '--timeout-ms',
        '--freshness-hours',
        '--dry-run',
        '--json',
      ]),
    );
  });
});
