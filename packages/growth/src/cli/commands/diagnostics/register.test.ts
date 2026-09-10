import { expect, it } from 'vitest';
import { Command } from 'commander';
import { registerGrowthCommands } from '../../register.js';
it('exposes diagnostic import and bounded event review through the Growth CLI', () => {
  const program = new Command();
  registerGrowthCommands(program);
  const diagnostic = program.commands
    .find((c) => c.name() === 'growth')
    ?.commands.find((c) => c.name() === 'diagnostics');
  expect(diagnostic?.commands.map((c) => c.name())).toEqual(['import', 'review']);
  expect(diagnostic?.commands[0]?.options.find((o) => o.long === '--file')?.mandatory).toBe(true);
  expect(diagnostic?.commands[1]?.options.map((o) => o.long)).toEqual(
    expect.arrayContaining(['--event', '--limit', '--max-age-hours', '--environment', '--json']),
  );
});
