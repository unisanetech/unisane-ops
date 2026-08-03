import { describe, expect, it } from 'vitest';
import { Command } from 'commander';
import { registerGrowthCommands } from '../../register.js';

describe('campaign pause CLI registration', () => {
  it('registers separate plan, show, approve, apply, and verify leaves', () => {
    const program = new Command();
    registerGrowthCommands(program);
    const growth = program.commands.find((command) => command.name() === 'growth');
    const campaign = growth?.commands.find((command) => command.name() === 'campaign');
    const pause = campaign?.commands.find((command) => command.name() === 'pause');

    expect(pause?.commands.map((command) => command.name())).toEqual([
      'plan',
      'show',
      'approve',
      'apply',
      'verify',
    ]);
    const applyOptions = pause?.commands
      .find((command) => command.name() === 'apply')
      ?.options.map((option) => option.long);
    expect(applyOptions).toEqual(expect.arrayContaining(['--confirm-target', '--json']));
    expect(applyOptions).not.toContain('--connection');
  });
});
