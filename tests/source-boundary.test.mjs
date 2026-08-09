import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ledger = JSON.parse(readFileSync(join(root, 'docs/reference/generated/repository/source-disposition-ledger.json'), 'utf8'));
const history = JSON.parse(readFileSync(join(root, 'docs/reference/generated/repository/history-filter-spec.json'), 'utf8'));
const safety = JSON.parse(readFileSync(join(root, 'docs/reference/generated/repository/public-safety-scan-spec.json'), 'utf8'));

test('source boundary is frozen only with its exact external blockers', () => {
  assert.equal(ledger.state, 'frozen-with-external-blocker');
  assert.deepEqual(ledger.violations, []);
  assert.equal(ledger.packageBoundary.foreignWorkspaceEdges.length, 3);
  assert.deepEqual(ledger.packageBoundary.foreignWorkspaceEdges.map(({ dependency }) => dependency).sort(), ['@unisane/data-table', '@unisane/devtools', '@unisane/ui']);
  assert.deepEqual(ledger.packageBoundary.cliCoreReferences, []);
  assert.deepEqual(ledger.packageBoundary.foreignRelativeSourceReferences, []);
  assert.deepEqual(ledger.inventory.excludedEphemeralPatterns.map(({ pattern }) => pattern), [
    '**/node_modules/**',
    '**/{dist,coverage,.turbo}/**',
    '**/{.skopos,.unisane}/**',
  ]);
  assert.equal(ledger.authoritySafety.targetLockfilePresent, false);
  assert.equal(ledger.authoritySafety.independentTargetSkoposActive, false);
  assert.equal(ledger.authoritySafety.excludedUmbrellaTaskArtifactPatterns.length, 2);
  assert.ok(ledger.authoritySafety.excludedUmbrellaTaskArtifactPatterns.every((pattern) => pattern.includes('Skopos-managed Evidence')));
});

test('history and public-safety work are executed only in the recorded disposable proof', () => {
  assert.equal(history.state, 'executed-in-disposable-proof');
  assert.equal(history.discovery.originMappingCount, 507);
  assert.equal(history.discovery.additionCount, 91);
  assert.equal(history.execution.candidateTip, 'f6de44d92b95413bafb52607a7a70cf2ac512791');
  assert.equal(safety.state, 'technical-scan-executed-owner-certification-blocked');
  assert.equal(safety.execution.publicHistorySafe, false);
});
