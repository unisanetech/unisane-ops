import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline';
import { stripVTControlCharacters } from 'node:util';
import type { MetaResourceChoice, MetaResourcePrompt } from './connection-resource-selection.js';

function terminalLabel(value: string): string {
  return stripVTControlCharacters(value)
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .slice(0, 300);
}

export function createTerminalMetaResourcePrompt(
  options: {
    input?: NodeJS.ReadStream;
    output?: NodeJS.WriteStream;
  } = {},
): MetaResourcePrompt {
  const input = options.input ?? stdin;
  const output = options.output ?? stdout;
  const isAvailable = () => input.isTTY === true && output.isTTY === true;
  return {
    isAvailable,
    async choose({ projectId, environmentId, service, candidates, complete }) {
      if (!isAvailable())
        throw new Error(
          '[META_RESOURCE_PROMPT_UNAVAILABLE] Resource selection requires an interactive terminal.',
        );
      if (!candidates.length || candidates.length > 500)
        throw new Error(
          '[META_RESOURCE_PROMPT_BOUND_INVALID] Resource choices must contain 1 to 500 candidates.',
        );
      const wasPaused = input.isPaused();
      const reader = createInterface({ input, output, terminal: true });
      try {
        output.write(
          `\nMeta setup — ${terminalLabel(projectId)} / ${terminalLabel(environmentId)}\n`,
        );
        output.write(
          service === 'ads-insights'
            ? 'Choose the ad account for reporting:\n'
            : 'Choose the Pixel or dataset for event measurement:\n',
        );
        if (!complete)
          output.write('Discovery is incomplete. These are only the resources returned so far.\n');
        candidates.forEach((candidate, index) =>
          output.write(
            `  ${index + 1}. ${terminalLabel(candidate.displayName)} (${terminalLabel(candidate.resourceType)}: ${terminalLabel(candidate.resourceId)})\n`,
          ),
        );
        return await new Promise<MetaResourceChoice | null>((resolve, reject) => {
          let settled = false;
          let attempts = 0;
          const finish = (choice: MetaResourceChoice | null, error?: Error) => {
            if (settled) return;
            settled = true;
            input.off('error', onError);
            reader.close();
            if (error) reject(error);
            else resolve(choice);
          };
          const onError = () =>
            finish(
              null,
              new Error('[META_RESOURCE_PROMPT_FAILED] Resource selection input failed.'),
            );
          input.once('error', onError);
          reader.once('SIGINT', () => finish(null));
          reader.once('close', () => finish(null));
          const ask = () =>
            reader.question('Enter a number, or press Enter to cancel: ', (answer) => {
              const value = answer.trim();
              if (!value) return finish(null);
              const candidate = /^\d{1,3}$/.test(value) ? candidates[Number(value) - 1] : undefined;
              if (candidate)
                return finish({
                  resourceType: candidate.resourceType,
                  resourceId: candidate.resourceId,
                });
              attempts += 1;
              if (attempts >= 3)
                return finish(
                  null,
                  new Error(
                    '[META_RESOURCE_SELECTION_INPUT_INVALID] No valid resource was selected after three attempts.',
                  ),
                );
              output.write(`Enter a number from 1 to ${candidates.length}.\n`);
              ask();
            });
          ask();
        });
      } finally {
        reader.close();
        if (wasPaused) input.pause();
      }
    },
  };
}
