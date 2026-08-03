import { describe, expect, it } from 'vitest';
import { Command } from 'commander';
import { registerGrowthCommands } from '../../register.js';

describe('measurement CLI registration', () => {
  it('registers the goal-oriented audit command with human and JSON options', () => {
    const program = new Command();
    registerGrowthCommands(program);
    const growth = program.commands.find((command) => command.name() === 'growth');
    const measurement = growth?.commands.find((command) => command.name() === 'measurement');
    const audit = measurement?.commands.find((command) => command.name() === 'audit');

    expect(audit?.description()).toContain('canonical outcomes');
    expect(audit?.options.map((option) => option.long)).toEqual(
      expect.arrayContaining(['--json', '--start-date', '--end-date', '--comparison-limit']),
    );
  });
});
