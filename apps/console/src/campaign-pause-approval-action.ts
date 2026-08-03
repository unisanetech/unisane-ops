import type { IncomingMessage, ServerResponse } from 'node:http';
import type { GrowthCampaignPauseWorkflowResult } from '@unisane/growth';
import {
  campaignPauseApprovalHeader,
  campaignPauseApprovalHeaderValue,
  campaignPauseApprovalPath,
  type CampaignPauseApprovalRequest,
  type CampaignPauseApprovalResponse,
} from './campaign-pause-approval-contract.js';

const maximumBodyBytes = 4_096;
const runIdPattern = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const planHashPattern = /^[a-f0-9]{64}$/;

export type CampaignPauseApprovalHandler = (
  input: CampaignPauseApprovalRequest,
) => Promise<GrowthCampaignPauseWorkflowResult>;

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: CampaignPauseApprovalResponse,
): void {
  const payload = JSON.stringify(body);
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Content-Length', String(Buffer.byteLength(payload)));
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.end(payload);
}

function reject(response: ServerResponse, statusCode: number, code: string, message: string): true {
  sendJson(response, statusCode, { ok: false, error: { code, message } });
  return true;
}

function requestIsSameOrigin(request: IncomingMessage): boolean {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' && parsed.host === host;
  } catch {
    return false;
  }
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of request as AsyncIterable<Uint8Array>) {
    size += chunk.byteLength;
    if (size > maximumBodyBytes) {
      throw new Error('[OPS_CONSOLE_ACTION_BODY_TOO_LARGE] The request body is too large.');
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new Error('[OPS_CONSOLE_ACTION_JSON_INVALID] The request body must be valid JSON.');
  }
}

function parseRequest(input: unknown): CampaignPauseApprovalRequest {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('[OPS_CONSOLE_APPROVAL_INPUT_INVALID] Approval input is invalid.');
  }
  const value = input as { runId?: unknown; planHash?: unknown };
  if (
    typeof value.runId !== 'string' ||
    value.runId.length > 180 ||
    !runIdPattern.test(value.runId) ||
    typeof value.planHash !== 'string' ||
    !planHashPattern.test(value.planHash)
  ) {
    throw new Error(
      '[OPS_CONSOLE_APPROVAL_INPUT_INVALID] The exact campaign-pause run and plan are required.',
    );
  }
  return { runId: value.runId, planHash: value.planHash };
}

function errorDetails(error: unknown): { code: string; message: string; statusCode: number } {
  const fallback = {
    code: 'OPS_CONSOLE_APPROVAL_FAILED',
    message: 'Approval could not be recorded. Reload the plan and try again.',
    statusCode: 500,
  };
  if (!(error instanceof Error)) return fallback;
  const match = /^\[([A-Z0-9_]+)\]\s*(.*)$/.exec(error.message);
  if (!match) return fallback;
  const code = match[1]!;
  const message = match[2] || fallback.message;
  if (code.startsWith('OPS_CONSOLE_')) {
    return { code, message, statusCode: 400 };
  }
  if (code.includes('POLICY') || code.includes('DISABLED')) {
    return { code, message, statusCode: 403 };
  }
  if (
    code.includes('STALE') ||
    code.includes('CONFLICT') ||
    code.includes('ALREADY_APPROVED') ||
    code.includes('TRANSITION') ||
    code.includes('TOO_LATE')
  ) {
    return { code, message, statusCode: 409 };
  }
  if (code.includes('NOT_FOUND')) return { code, message, statusCode: 404 };
  return { code, message, statusCode: 400 };
}

export async function handleCampaignPauseApprovalRequest(
  request: IncomingMessage,
  response: ServerResponse,
  approve: CampaignPauseApprovalHandler | undefined,
): Promise<boolean> {
  const requestUrl = new URL(request.url ?? '/', 'http://console.local');
  if (requestUrl.pathname !== campaignPauseApprovalPath) return false;
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return reject(
      response,
      405,
      'OPS_CONSOLE_ACTION_METHOD_INVALID',
      'This console action requires POST.',
    );
  }
  if (!approve) {
    return reject(
      response,
      503,
      'OPS_CONSOLE_APPROVAL_UNAVAILABLE',
      'Campaign approval is not available in this console session.',
    );
  }
  if (!requestIsSameOrigin(request)) {
    return reject(
      response,
      403,
      'OPS_CONSOLE_ACTION_ORIGIN_INVALID',
      'The approval request must come from this console.',
    );
  }
  if (
    request.headers[campaignPauseApprovalHeader] !== campaignPauseApprovalHeaderValue ||
    request.headers['content-type']?.split(';', 1)[0]?.trim() !== 'application/json'
  ) {
    return reject(
      response,
      400,
      'OPS_CONSOLE_ACTION_HEADERS_INVALID',
      'The approval request is missing required console headers.',
    );
  }
  try {
    const input = parseRequest(await readBody(request));
    const result = await approve(input);
    sendJson(response, 200, { ok: true, result });
  } catch (error) {
    const details = errorDetails(error);
    sendJson(response, details.statusCode, {
      ok: false,
      error: { code: details.code, message: details.message },
    });
  }
  return true;
}
