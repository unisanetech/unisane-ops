import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { OpsActionExecutionError } from '@unisane/ops-engine/actions';
import { hostedReadAdmissionRequestSchema } from '@unisane/ops-engine/hosted';
import type { HostedGatewayTransport } from './gateway-process.js';
import type { HostedGatewayAuthentication } from './identity.js';

function writeJson(response: ServerResponse, status: number, value: unknown): void {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  response.end(body);
}

function authentication(request: IncomingMessage): HostedGatewayAuthentication {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ') || header.length <= 7) {
    throw new OpsActionExecutionError('authentication-required', 'Authentication is required.');
  }
  return { scheme: 'bearer', token: header.slice(7) };
}

async function readJson(request: IncomingMessage, maximumBytes: number): Promise<unknown> {
  const contentType = request.headers['content-type'];
  if (!contentType?.toLowerCase().startsWith('application/json')) {
    throw new OpsActionExecutionError('content-type-invalid', 'JSON content is required.');
  }
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    length += buffer.byteLength;
    if (length > maximumBytes) {
      throw new OpsActionExecutionError('request-too-large', 'The request body is too large.');
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new OpsActionExecutionError('request-json-invalid', 'The request body is invalid.');
  }
}

function errorStatus(error: OpsActionExecutionError): number {
  if (error.code.startsWith('authentication')) return 401;
  if (error.code.includes('forbidden') || error.code.includes('mismatch')) return 403;
  if (error.code.includes('conflict')) return 409;
  if (error.retryable) return 503;
  return 400;
}

export function createHostedGatewayHttpTransport(input: {
  host: string;
  port: number;
  maximumBodyBytes: number;
  readiness(): boolean;
}): HostedGatewayTransport {
  return {
    serve({ gateway, signal }) {
      return new Promise<void>((resolve, reject) => {
        const server = createServer(async (request, response) => {
          try {
            const url = new URL(request.url ?? '/', 'http://hosted.invalid');
            if (request.method === 'GET' && url.pathname === '/live') {
              writeJson(response, 200, { status: 'live', role: 'gateway' });
              return;
            }
            if (request.method === 'GET' && url.pathname === '/ready') {
              writeJson(response, input.readiness() ? 200 : 503, {
                status: input.readiness() ? 'ready' : 'not-ready',
                role: 'gateway',
              });
              return;
            }
            if (request.method === 'POST' && url.pathname === '/internal/v1/read-actions') {
              const job = await gateway.admit({
                authentication: authentication(request),
                request: hostedReadAdmissionRequestSchema.parse(
                  await readJson(request, input.maximumBodyBytes),
                ),
              });
              writeJson(response, 202, { job });
              return;
            }
            const match = /^\/internal\/v1\/read-actions\/([^/]+)$/.exec(url.pathname);
            if (request.method === 'GET' && match?.[1]) {
              const job = await gateway.get({
                authentication: authentication(request),
                jobId: decodeURIComponent(match[1]),
              });
              writeJson(response, job ? 200 : 404, job ? { job } : { error: 'job-not-found' });
              return;
            }
            writeJson(response, 404, { error: 'route-not-found' });
          } catch (error) {
            if (error instanceof OpsActionExecutionError) {
              writeJson(response, errorStatus(error), {
                error: error.code,
                message: error.safeMessage,
                retryable: error.retryable,
              });
              return;
            }
            writeJson(response, 400, {
              error: 'request-invalid',
              message: 'The request could not be accepted.',
              retryable: false,
            });
          }
        });
        server.once('error', reject);
        server.listen(input.port, input.host, () => {
          const stop = () => server.close((error) => (error ? reject(error) : resolve()));
          if (signal.aborted) stop();
          else signal.addEventListener('abort', stop, { once: true });
        });
      });
    },
  };
}
