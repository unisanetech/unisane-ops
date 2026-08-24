import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDoctor } from '../dist/handlers/doctor.js';

const descriptor = {
  id: 'core.doctor',
  path: ['doctor'],
  handler: { exportPath: './handlers/doctor', exportName: 'runDoctor' },
  maximumEffect: 'read-network',
  writeTargets: [],
  artifactClasses: [],
  riskGuards: [],
  json: true,
};

function context(manifests = []) {
  return {
    argv: [],
    cwd: '/tmp/plain-ops-project',
    manifests,
    json: true,
    selection: { command: descriptor, packId: 'core' },
  };
}

test('core doctor does not synthesize diagnostics for another product', async () => {
  const result = await runDoctor(context());
  assert.equal(result.command, 'core.doctor');
  assert.equal(result.pack, 'core');
  assert.equal(result.status, 'ok');
  assert.deepEqual(result.result.components, []);
});

test('core doctor aggregates a selected Ops pack diagnostic without changing command ownership', async () => {
  const result = await runDoctor(context([{ packId: 'growth' }]), [
    async () => ({
      id: 'growth',
      owner: '@unisane/growth',
      status: 'failed',
      actualEffect: 'read-network',
      report: { status: 'error', exitCode: 1 },
      diagnostics: ['Growth evidence is not ready.'],
    }),
  ]);
  assert.equal(result.command, 'core.doctor');
  assert.equal(result.pack, 'core');
  assert.equal(result.status, 'failed');
  assert.equal(result.actualEffect, 'read-network');
  assert.deepEqual(result.result.components[0].report, { status: 'error', exitCode: 1 });
});
