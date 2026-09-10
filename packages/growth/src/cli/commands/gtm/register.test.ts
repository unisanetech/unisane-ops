import { Command } from 'commander';
import { expect, it } from 'vitest';
import { registerGoogleTagManagerCommands } from './register.js';
it('exposes one shared GTM execution lifecycle and rejects superseded mutation commands', async () => {
  const program = new Command().exitOverride().configureOutput({ writeErr: () => {} });
  registerGoogleTagManagerCommands(program);
  const gtm = program.commands[0]!;
  expect(gtm.commands.map((command) => command.name()).sort()).toEqual([
    'diagnose',
    'diff',
    'generate-setup',
    'pull',
    'release',
    'validate',
    'workspace',
  ]);
  expect(
    gtm.commands.find((command) => command.name() === 'workspace')?.commands.map((c) => c.name()),
  ).toEqual(['plan', 'review', 'approve', 'apply', 'recover']);
  expect(
    gtm.commands.find((command) => command.name() === 'release')?.commands.map((c) => c.name()),
  ).toEqual(['preview', 'plan-version', 'plan-publish', 'review', 'approve', 'apply', 'recover']);
  for (const name of ['plan', 'apply', 'preview', 'create-version', 'publish', 'rollback']) {
    await expect(program.parseAsync(['gtm', name], { from: 'user' })).rejects.toThrow();
  }
});
