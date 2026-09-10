import { handleGtmCommandRequest } from './gtm-http.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { opsApprovalRecordSchema } from '@unisane/ops-engine';
import {
  gtmWorkspaceCommandSchema,
  type GtmWorkspaceCommand,
  gtmWorkspaceReviewSchema,
  gtmWorkspaceApplyResultSchema,
  gtmWorkspaceRecoveryResultSchema,
} from '@unisane/growth/gtm';
export type ConsoleGtmWorkspace = (
  input: GtmWorkspaceCommand,
  target: { projectId: string; environmentId: string },
) => Promise<unknown>;
export function handleGtmWorkspaceRequest(
  request: IncomingMessage,
  response: ServerResponse,
  callback: ConsoleGtmWorkspace | undefined,
  target: { projectId: string; environmentId: string },
) {
  return handleGtmCommandRequest(
    request,
    response,
    callback,
    target,
    '/api/console/gtm/workspace',
    (raw) => gtmWorkspaceCommandSchema.parse(raw),
    (input, raw) => {
      const result =
        input.operation === 'approve'
          ? opsApprovalRecordSchema.parse(raw)
          : input.operation === 'apply'
            ? gtmWorkspaceApplyResultSchema.parse(raw)
            : input.operation === 'recover'
              ? gtmWorkspaceRecoveryResultSchema.parse(raw)
              : gtmWorkspaceReviewSchema.parse(raw);
      const actual =
        'plan' in result
          ? { projectId: result.plan.projectId, environmentId: result.plan.environment }
          : 'receipt' in result
            ? { projectId: result.receipt.projectId, environmentId: result.receipt.environment }
            : 'environment' in result
              ? { projectId: result.projectId, environmentId: result.environment }
              : result;
      return { result, actual };
    },
  );
}
