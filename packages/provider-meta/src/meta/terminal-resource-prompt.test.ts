import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createTerminalMetaResourcePrompt } from './terminal-resource-prompt.js';
import type { MetaResourcePromptInput } from './connection-resource-selection.js';

function terminal(tty = true) {
  const input = Object.assign(new PassThrough(), {
    isTTY: tty,
    isRaw: false,
    setRawMode(value: boolean) {
      this.isRaw = value;
      return this;
    },
  });
  const output = Object.assign(new PassThrough(), { isTTY: tty, columns: 100 });
  let text = '';
  output.on('data', (chunk) => {
    text += chunk.toString();
  });
  const prompt = createTerminalMetaResourcePrompt({
    input: input as unknown as NodeJS.ReadStream,
    output: output as unknown as NodeJS.WriteStream,
  });
  return { input, prompt, text: () => text };
}
const choice: MetaResourcePromptInput = {
  projectId: 'store',
  environmentId: 'production',
  service: 'ads-insights',
  complete: false,
  candidates: [
    {
      resourceType: 'ad-account',
      resourceId: 'act_1',
      displayName: 'Store account',
      services: ['ads-insights'],
      state: 'accessible',
    },
  ],
};

describe('Meta resource terminal prompt', () => {
  it('shows names, IDs, target and partial discovery while returning only the chosen identity', async () => {
    const t = terminal();
    const result = t.prompt.choose(choice);
    t.input.write('1\n');
    await expect(result).resolves.toEqual({ resourceType: 'ad-account', resourceId: 'act_1' });
    expect(t.text()).toContain('Store account (ad-account: act_1)');
    expect(t.text()).toContain('store / production');
    expect(t.text()).toContain('Discovery is incomplete');
    expect(t.input.isRaw).toBe(false);
  });
  it.each(['\n', '\u0003', '\u0004'])('cancels on Enter, Ctrl-C or EOF (%j)', async (key) => {
    const t = terminal();
    const result = t.prompt.choose(choice);
    t.input.write(key);
    await expect(result).resolves.toBeNull();
    expect(t.input.listenerCount('error')).toBe(0);
    expect(t.input.isRaw).toBe(false);
  });
  it('bounds invalid retries', async () => {
    const t = terminal();
    const result = t.prompt.choose(choice);
    t.input.write('99\nabc\n-1\n');
    await expect(result).rejects.toThrow('SELECTION_INPUT_INVALID');
  });
  it('strips terminal commands and line breaks from provider labels', async () => {
    const t = terminal();
    const result = t.prompt.choose({
      ...choice,
      candidates: [{ ...choice.candidates[0]!, displayName: '\u001b[2JStore\nforged\u202e' }],
    });
    t.input.write('1\n');
    await result;
    expect(t.text()).not.toContain('\u001b[2J');
    expect(t.text()).not.toContain('Store\nforged');
    expect(t.text()).not.toContain('\u202e');
  });
  it('fails closed outside a terminal', async () => {
    const t = terminal(false);
    expect(t.prompt.isAvailable()).toBe(false);
    await expect(t.prompt.choose(choice)).rejects.toThrow('PROMPT_UNAVAILABLE');
    expect(t.text()).toBe('');
  });
});
