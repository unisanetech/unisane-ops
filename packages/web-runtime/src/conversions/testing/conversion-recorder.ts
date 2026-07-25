import type { WebConversionEnvelope, WebConversionTransport } from '../types';

export type WebConversionRecorder = {
  events: WebConversionEnvelope[];
  transport: WebConversionTransport;
  reset: () => void;
};

export function createConversionRecorder(): WebConversionRecorder {
  const events: WebConversionEnvelope[] = [];

  return {
    events,
    transport: {
      async send(envelope) {
        events.push(envelope);
      },
    },
    reset() {
      events.length = 0;
    },
  };
}
