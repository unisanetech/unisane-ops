import { expect, it } from 'vitest';
import { readMetaMutationResponse } from './mutation-response.js';
it('keeps echoed provider data out of failure messages and distinguishes unreadable success', async () => {
  const secret = 'fixture-credential';
  const error = await readMetaMutationResponse(
    new Response(secret, { status: 403 }),
    'META_WRITE_FAILED',
    'Meta write',
  ).catch((e) => e);
  expect(error.message).toBe('[META_WRITE_FAILED] Meta write failed (HTTP 403).');
  expect(error.message).not.toContain(secret);
  await expect(
    readMetaMutationResponse(new Response(secret), 'META_WRITE_FAILED', 'Meta write'),
  ).rejects.toThrow('Recover the outcome before retrying');
  await expect(
    readMetaMutationResponse(new Response('{"id":"123"}'), 'META_WRITE_FAILED', 'Meta write'),
  ).resolves.toEqual({ id: '123' });
});
