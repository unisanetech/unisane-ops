import type { IncomingMessage, ServerResponse } from 'node:http';
import { opsApprovalRecordSchema } from '@unisane/ops-engine';
import {
  gtmReleaseCommandSchema,
  gtmReleaseReviewSchema,
  gtmReleaseResultSchema,
  gtmReleaseRecoverySchema,
  gtmReleasePreviewSchema,
  type GtmReleaseCommand,
} from '@unisane/growth/gtm';
import { handleGtmCommandRequest } from './gtm-http.js';
export type ConsoleGtmRelease = (
  input: GtmReleaseCommand,
  target: { projectId: string; environmentId: string },
) => Promise<unknown>;
export function handleGtmReleaseRequest(
  request: IncomingMessage,
  response: ServerResponse,
  callback: ConsoleGtmRelease | undefined,
  target: { projectId: string; environmentId: string },
) {
  return handleGtmCommandRequest(
    request,
    response,
    callback,
    target,
    '/api/console/gtm/release',
    (raw) => gtmReleaseCommandSchema.parse(raw),
    (input, raw) => {
      const result =
        input.operation === 'preview'
          ? gtmReleasePreviewSchema.parse(raw)
          : input.operation === 'approve'
            ? opsApprovalRecordSchema.parse(raw)
            : input.operation === 'apply'
              ? gtmReleaseResultSchema.parse(raw)
              : input.operation === 'recover'
                ? gtmReleaseRecoverySchema.parse(raw)
                : gtmReleaseReviewSchema.parse(raw);
      const actual =
        'plan' in result
          ? { projectId: result.plan.projectId, environmentId: result.plan.environment }
          : 'receipt' in result
            ? { projectId: result.receipt.projectId, environmentId: result.receipt.environment }
            : 'environment' in result
              ? { projectId: result.projectId, environmentId: result.environment }
              : result;
      if ('planHash' in input) {
        const actualHash =
          'plan' in result
            ? result.plan.planHash
            : 'receipt' in result
              ? result.receipt.planHash
              : 'planHash' in result
                ? result.planHash
                : null;
        if (actualHash !== input.planHash) throw new Error('Wrong plan');
      }
      if (input.operation === 'recover' && (!('runId' in result) || result.runId !== input.runId))
        throw new Error('Wrong attempt');
      return { result, actual };
    },
  );
}
