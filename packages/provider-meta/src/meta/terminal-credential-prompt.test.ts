import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import { createTerminalMetaCredentialPrompt } from './terminal-credential-prompt.js';

class FakeInput extends EventEmitter {
  isTTY = true;
  isRaw = false;
  paused = true;

  isPaused() {
    return this.paused;
  }

  pause() {
    this.paused = true;
    return this;
  }

  resume() {
    this.paused = false;
    return this;
  }

  setRawMode(value: boolean) {
    this.isRaw = value;
    return this;
  }
}

class FakeOutput {
  isTTY = true;
  writes: string[] = [];

  write(value: string) {
    this.writes.push(value);
    return true;
  }
}

describe('Meta terminal credential prompt', () => {
  it('captures raw input without echoing credential bytes and restores the terminal', async () => {
    const input = new FakeInput();
    const output = new FakeOutput();
    const prompt = createTerminalMetaCredentialPrompt({
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream,
    });

    const pending = prompt.readCredential({ message: 'Meta access token: ' });
    input.emit('data', Buffer.from('fixture-token\n'));
    const credential = await pending;

    expect(new TextDecoder().decode(credential ?? new Uint8Array())).toBe('fixture-token');
    expect(output.writes).toEqual(['Meta access token: ', '\n']);
    expect(output.writes.join('')).not.toContain('fixture-token');
    expect(input.isRaw).toBe(false);
    expect(input.isPaused()).toBe(true);
  });

  it('returns cancellation without exposing partial input', async () => {
    const input = new FakeInput();
    const output = new FakeOutput();
    const prompt = createTerminalMetaCredentialPrompt({
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream,
    });

    const pending = prompt.readCredential({ message: 'Meta access token: ' });
    input.emit('data', Buffer.from([102, 105, 120, 116, 117, 114, 101, 3]));

    await expect(pending).resolves.toBeNull();
    expect(output.writes.join('')).not.toContain('fixture');
    expect(input.isRaw).toBe(false);
  });
});
