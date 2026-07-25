import { createConversionClient } from '../conversion-client';
import { defineWebConversionConfig } from '../config';
import type { WebConversionConfig } from '../types';
import { createConversionRecorder } from './conversion-recorder';

export function createTestConversionClient(args?: { config?: WebConversionConfig }) {
  const recorder = createConversionRecorder();
  const client = createConversionClient({
    config:
      args?.config ??
      defineWebConversionConfig({
        appId: 'test-app',
      }),
    transport: recorder.transport,
  });

  return {
    client,
    recorder,
  };
}
