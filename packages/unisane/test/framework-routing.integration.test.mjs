import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadFirstPartyPackGraph, runCanonicalCli } from '../dist/host.js';

test('canonical Framework app root selects the exact Framework pack', async () => {
  let selectedCommand = null;
  const code = await runCanonicalCli(['app', 'compile', '--help'], {
    loadGraph: loadFirstPartyPackGraph,
    loadHandler: async (command) => {
      selectedCommand = command.id;
      return async (context) => ({
        schemaVersion: 1,
        command: command.id,
        pack: context.selection.packId,
        maximumEffect: command.maximumEffect,
        actualEffect: command.maximumEffect,
        writeTargets: command.writeTargets,
        riskGuards: command.riskGuards,
        status: 'ok',
        result: null,
        diagnostics: [],
        artifacts: [],
        nextActions: [],
        presentation: { stdout: '', stderr: '' },
      });
    },
  });

  assert.equal(code, 0);
  assert.equal(selectedCommand, 'framework.app');
});

test('retired Framework roots fail closed', async () => {
  let selectedCommand = null;
  const code = await runCanonicalCli(['sync', '--help'], {
    loadGraph: loadFirstPartyPackGraph,
    loadHandler: async (command) => {
      selectedCommand = command.id;
      return async () => {
        throw new Error('retired Framework roots must not resolve a handler');
      };
    },
  });

  assert.equal(code, 1);
  assert.equal(selectedCommand, null);
});

test('Growth roots select the exact Growth pack', async () => {
  let selectedCommand = null;
  const code = await runCanonicalCli(['growth', 'seo', 'doctor'], {
    loadGraph: loadFirstPartyPackGraph,
    loadHandler: async (command) => {
      selectedCommand = command.id;
      return async (context) => ({
        schemaVersion: 1,
        command: command.id,
        pack: context.selection.packId,
        maximumEffect: command.maximumEffect,
        actualEffect: command.maximumEffect,
        writeTargets: command.writeTargets,
        riskGuards: command.riskGuards,
        status: 'ok',
        result: null,
        diagnostics: [],
        artifacts: [],
        nextActions: [],
        presentation: { stdout: '', stderr: '' },
      });
    },
  });

  assert.equal(code, 0);
  assert.equal(selectedCommand, 'growth.root');
});

test('retired Growth roots fail closed', async () => {
  let selectedCommand = null;
  const code = await runCanonicalCli(['seo', 'doctor'], {
    loadGraph: loadFirstPartyPackGraph,
    loadHandler: async (command) => {
      selectedCommand = command.id;
      return async (context) => ({
        schemaVersion: 1,
        command: command.id,
        pack: context.selection.packId,
        maximumEffect: command.maximumEffect,
        actualEffect: command.maximumEffect,
        writeTargets: command.writeTargets,
        riskGuards: command.riskGuards,
        status: 'ok',
        result: null,
        diagnostics: [],
        artifacts: [],
        nextActions: [],
        presentation: { stdout: '', stderr: '' },
      });
    },
  });

  assert.equal(code, 1);
  assert.equal(selectedCommand, null);
});

test('provider, GTM, and UI routes select exact owner packs', async () => {
  const cases = [
    [['provider', 'aws', 'doctor'], 'provider.aws'],
    [['provider', 'google', 'doctor'], 'provider.google'],
    [['growth', 'gtm', 'validate'], 'growth.gtm'],
    [['ui', 'appearance', 'list'], 'ui.appearance-list'],
  ];
  for (const [argv, expected] of cases) {
    let selectedCommand = null;
    const code = await runCanonicalCli(argv, {
      loadGraph: loadFirstPartyPackGraph,
      loadHandler: async (command) => {
        selectedCommand = command.id;
        return async (context) => ({
          schemaVersion: 1,
          command: command.id,
          pack: context.selection.packId,
          maximumEffect: command.maximumEffect,
          actualEffect: command.maximumEffect,
          writeTargets: command.writeTargets,
          riskGuards: command.riskGuards,
          status: 'ok',
          result: null,
          diagnostics: [],
          artifacts: [],
          nextActions: [],
          presentation: { stdout: '', stderr: '' },
        });
      },
    });
    assert.equal(code, 0);
    assert.equal(selectedCommand, expected);
  }
});

test('unknown commands fail closed', async () => {
  assert.equal(await runCanonicalCli(['unknown-command'], { loadGraph: () => [] }), 1);
});
