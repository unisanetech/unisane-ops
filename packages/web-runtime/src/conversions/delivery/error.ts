import type { WebConversionEvidence } from '../types';
export type ConversionFailureKind = 'retryable' | 'permanent' | 'uncertain';

/** Codes and messages are library-owned; never attach a raw request or provider response. */
export class WebConversionDeliveryError extends Error {
  evidence?: WebConversionEvidence;
  constructor(
    readonly code: string,
    readonly kind: ConversionFailureKind,
    message: string,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'WebConversionDeliveryError';
  }
}

export async function withConversionDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  parent?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  const deadline = new Promise<never>((_, reject) => {
    const stop = (code: string) => {
      controller.abort();
      reject(
        new WebConversionDeliveryError(
          code,
          'uncertain',
          'Conversion delivery did not finish; retry with the same event ID.',
        ),
      );
    };
    timer = setTimeout(() => stop('delivery_timeout'), timeoutMs);
    onAbort = () => stop('delivery_aborted');
    parent?.addEventListener('abort', onAbort, { once: true });
    if (parent?.aborted) onAbort();
  });
  try {
    if (parent?.aborted) return await deadline;
    return await Promise.race([operation(controller.signal), deadline]);
  } finally {
    if (timer) clearTimeout(timer);
    if (onAbort) parent?.removeEventListener('abort', onAbort);
  }
}
