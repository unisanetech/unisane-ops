import { stdin, stdout } from 'node:process';

const DEFAULT_MAX_CREDENTIAL_BYTES = 16_384;

export interface MetaCredentialPrompt {
  isAvailable(): boolean;
  readCredential(input: { message: string; maxBytes?: number }): Promise<Uint8Array | null>;
}

export interface MetaTerminalCredentialPromptOptions {
  input?: NodeJS.ReadStream;
  output?: NodeJS.WriteStream;
}

export function createTerminalMetaCredentialPrompt(
  options: MetaTerminalCredentialPromptOptions = {},
): MetaCredentialPrompt {
  const input = options.input ?? stdin;
  const output = options.output ?? stdout;
  const isAvailable = () =>
    input.isTTY === true && output.isTTY === true && typeof input.setRawMode === 'function';

  return {
    isAvailable,
    async readCredential({ message, maxBytes = DEFAULT_MAX_CREDENTIAL_BYTES }) {
      if (!isAvailable()) {
        throw new Error(
          '[META_CONNECT_CREDENTIAL_PROMPT_UNAVAILABLE] A secure interactive terminal is required.',
        );
      }
      if (!Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > DEFAULT_MAX_CREDENTIAL_BYTES) {
        throw new Error('[META_CONNECT_CREDENTIAL_PROMPT_BOUND_INVALID] Invalid credential bound.');
      }

      return new Promise<Uint8Array | null>((resolve, reject) => {
        const credential = new Uint8Array(maxBytes);
        const wasPaused = input.isPaused();
        const wasRaw = input.isRaw;
        let length = 0;
        let settled = false;

        const cleanup = () => {
          input.off('data', onData);
          input.off('error', onError);
          input.setRawMode(Boolean(wasRaw));
          if (wasPaused) input.pause();
        };
        const finish = (value: Uint8Array | null, error?: Error) => {
          if (settled) return;
          settled = true;
          cleanup();
          output.write('\n');
          credential.fill(0);
          if (error) reject(error);
          else resolve(value);
        };
        const onError = () => {
          finish(null, new Error('[META_CONNECT_CREDENTIAL_PROMPT_FAILED] Secure input failed.'));
        };
        const onData = (chunk: string | Buffer) => {
          const bytes = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk;
          for (const byte of bytes) {
            if (byte === 10 || byte === 13) {
              const result = credential.slice(0, length);
              finish(result);
              return;
            }
            if (byte === 3 || byte === 4) {
              finish(null);
              return;
            }
            if (byte === 8 || byte === 127) {
              if (length > 0) {
                length -= 1;
                credential[length] = 0;
              }
              continue;
            }
            if (byte < 32) continue;
            if (length >= maxBytes) {
              finish(
                null,
                new Error(
                  '[META_CONNECT_CREDENTIAL_PROMPT_TOO_LONG] Credential exceeds the bound.',
                ),
              );
              return;
            }
            credential[length] = byte;
            length += 1;
          }
        };

        output.write(message);
        input.setRawMode(true);
        input.resume();
        input.on('data', onData);
        input.on('error', onError);
      });
    },
  };
}
