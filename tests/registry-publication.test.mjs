import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForPublishedIntegrity } from '../scripts/registry-publication.mjs';

const registryError = (code) => Object.assign(new Error(code), { stdout: JSON.stringify({ error: { code } }) });

test('verifies a newly published version after temporary registry invisibility', async () => {
  let reads = 0;
  const waits = [];
  await waitForPublishedIntegrity(() => {
    if (reads++ < 2) throw registryError('E404');
    return 'sha512-reviewed';
  }, 'sha512-reviewed', { delays: [1, 2], sleep: async (delay) => { waits.push(delay); } });
  assert.equal(reads, 3);
  assert.deepEqual(waits, [1, 2]);
});

test('fails after the bounded visibility window instead of accepting a missing version', async () => {
  let reads = 0;
  await assert.rejects(waitForPublishedIntegrity(() => {
    reads += 1;
    throw registryError('E404');
  }, 'sha512-reviewed', { delays: [1, 2], sleep: async () => {} }), /E404/);
  assert.equal(reads, 3);
});

for (const code of ['E401', 'E403', 'E500', 'ENOTFOUND']) {
  test(`does not retry ${code} or turn it into permission to publish`, async () => {
    let reads = 0;
    await assert.rejects(waitForPublishedIntegrity(() => {
      reads += 1;
      throw registryError(code);
    }, 'sha512-reviewed'), new RegExp(code));
    assert.equal(reads, 1);
  });
}

test('rejects different immutable content immediately', async () => {
  await assert.rejects(waitForPublishedIntegrity(() => 'sha512-different', 'sha512-reviewed'), /integrity does not match/);
});
