import { describe, expect, it } from 'vitest';
import { Command } from 'commander';
import { registerGrowthCommands } from '../../../register.js';

describe('SEO opportunity review CLI registration', () => {
  it('registers the read-only review leaf with bounded and machine-readable options', () => {
    const program = new Command();
    registerGrowthCommands(program);
    const growth = program.commands.find((command) => command.name() === 'growth');
    const seo = growth?.commands.find((command) => command.name() === 'seo');
    const opportunities = seo?.commands.find((command) => command.name() === 'opportunities');
    const review = opportunities?.commands.find((command) => command.name() === 'review');

    expect(review?.description()).toContain('Rank recorded SEO opportunities');
    expect(review?.options.map((option) => option.long)).toEqual(
      expect.arrayContaining(['--json', '--market', '--limit', '--max-age-days']),
    );
  });
});
