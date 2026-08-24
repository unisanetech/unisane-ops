import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadFirstPartyPackGraph, runUnisaneOpsCli } from '../dist/host.js';

function successfulHandler(command) {
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
}

test('Framework and UI product roots fail closed in the Ops CLI', async () => {
  for (const argv of [
    ['app', 'compile'],
    ['build'],
    ['dev'],
    ['generate'],
    ['ui', 'appearance', 'list'],
  ]) {
    let selectedCommand = null;
    const code = await runUnisaneOpsCli(argv, {
      loadGraph: loadFirstPartyPackGraph,
      loadHandler: async (command) => {
        selectedCommand = command.id;
        return successfulHandler(command);
      },
    });
    assert.equal(code, 1);
    assert.equal(selectedCommand, null);
  }
});

test('the retired combined-host ops prefix fails closed', async () => {
  let selectedCommand = null;
  const code = await runUnisaneOpsCli(['ops', 'init'], {
    loadGraph: loadFirstPartyPackGraph,
    loadHandler: async (command) => {
      selectedCommand = command.id;
      return successfulHandler(command);
    },
  });

  assert.equal(code, 1);
  assert.equal(selectedCommand, null);
});

test('Growth roots select the exact Growth pack', async () => {
  let selectedCommand = null;
  const code = await runUnisaneOpsCli(['growth', 'seo', 'doctor'], {
    loadGraph: loadFirstPartyPackGraph,
    loadHandler: async (command) => {
      selectedCommand = command.id;
      return successfulHandler(command);
    },
  });

  assert.equal(code, 0);
  assert.equal(selectedCommand, 'growth.root');
});

test('retired unnamespaced Growth roots fail closed', async () => {
  let selectedCommand = null;
  const code = await runUnisaneOpsCli(['seo', 'doctor'], {
    loadGraph: loadFirstPartyPackGraph,
    loadHandler: async (command) => {
      selectedCommand = command.id;
      return successfulHandler(command);
    },
  });

  assert.equal(code, 1);
  assert.equal(selectedCommand, null);
});

test('provider and GTM routes select exact Ops-owned packs', async () => {
  const cases = [
    [['provider', 'aws', 'doctor'], 'provider.aws'],
    [['provider', 'google', 'doctor'], 'provider.google'],
    [['growth', 'gtm', 'validate'], 'growth.gtm'],
  ];
  for (const [argv, expected] of cases) {
    let selectedCommand = null;
    const code = await runUnisaneOpsCli(argv, {
      loadGraph: loadFirstPartyPackGraph,
      loadHandler: async (command) => {
        selectedCommand = command.id;
        return successfulHandler(command);
      },
    });
    assert.equal(code, 0);
    assert.equal(selectedCommand, expected);
  }
});

test('unknown commands fail closed', async () => {
  assert.equal(await runUnisaneOpsCli(['unknown-command'], { loadGraph: () => [] }), 1);
});
