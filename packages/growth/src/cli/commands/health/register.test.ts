import { describe, expect, it } from 'vitest';
import { Command } from 'commander';
import { registerGrowthCommands } from '../../register.js';

describe('health review CLI registration', () => {
  it('registers the bounded read-only review with human and JSON output', () => {
    const program = new Command();
    registerGrowthCommands(program);
    const growth = program.commands.find((command) => command.name() === 'growth');
    const health = growth?.commands.find((command) => command.name() === 'health');
    const review = health?.commands.find((command) => command.name() === 'review');

    expect(review?.description()).toContain('trustworthy enough');
    expect(review?.options.map((option) => option.long)).toEqual(
      expect.arrayContaining(['--json', '--environment', '--max-age-days', '--finding-limit']),
    );
  });
});
