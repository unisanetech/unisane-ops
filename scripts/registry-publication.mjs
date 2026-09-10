import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

// npm can acknowledge a publish before the version is visible to registry reads.
// Retry only a missing version after that acknowledgement; all other failures are final.
export async function waitForPublishedIntegrity(
  lookup,
  expected,
  { delays = [1000, 2000, 4000, 8000, 16000, ...Array(9).fill(30000)], sleep = setTimeout } = {},
) {
  for (let attempt = 0; ; attempt += 1) {
    let actual;
    try {
      actual = await lookup();
    } catch (error) {
      let code;
      try { code = JSON.parse(String(error.stdout)).error?.code; }
      catch { throw error; }
      if (code !== 'E404' || attempt >= delays.length) throw error;
      await sleep(delays[attempt]);
      continue;
    }
    assert.equal(actual, expected, 'Published archive integrity does not match');
    return;
  }
}
