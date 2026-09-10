import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  gtmTrackingSetupInputSchema,
  gtmTrackingSetupResultSchema,
  gtmTrackingSetupAction,
  type GtmTrackingSetupInput,
} from '@unisane/growth/gtm';
import { handleGtmCommandRequest } from './gtm-http.js';
export function handleGtmSetupRequest(
  request: IncomingMessage,
  response: ServerResponse,
  target: { projectId: string; environmentId: string },
) {
  return handleGtmCommandRequest<GtmTrackingSetupInput>(
    request,
    response,
    (input) =>
      gtmTrackingSetupAction.execute(input, {
        requestId: 'console-gtm-setup',
        scopeId: target.projectId,
        ...target,
        principal: { kind: 'user', id: 'local-console' },
        requestedAt: new Date().toISOString(),
      }),
    target,
    '/api/console/gtm/setup',
    (raw) => gtmTrackingSetupInputSchema.parse(raw),
    (_input, raw) => {
      const result = gtmTrackingSetupResultSchema.parse(raw);
      return { result, actual: { projectId: result.projectId, environmentId: result.environment } };
    },
    1024 * 1024,
  );
}
