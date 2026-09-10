import type { IncomingMessage, ServerResponse } from 'node:http';
import { OpsActionExecutionError } from '@unisane/ops-engine';
export async function handleGtmCommandRequest<T>(
  request: IncomingMessage,
  response: ServerResponse,
  callback:
    | ((input: T, target: { projectId: string; environmentId: string }) => Promise<unknown>)
    | undefined,
  target: { projectId: string; environmentId: string },
  route: string,
  parseInput: (raw: unknown) => T,
  parseOutput: (
    input: T,
    raw: unknown,
  ) => { result: unknown; actual: { projectId: string; environmentId: string } },
  maximumInputBytes = 16384,
) {
  if (new URL(request.url ?? '/', 'http://localhost').pathname !== route) return false;
  const send = (status: number, value: unknown) => {
    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(value));
    return true;
  };
  if (request.method !== 'POST') return send(405, { error: 'Use POST.' });
  if (!callback) return send(503, { error: 'This host does not supply GTM workspace execution.' });
  try {
    const origin = new URL(request.headers.origin ?? '');
    if (
      origin.protocol !== 'http:' ||
      origin.host !== request.headers.host ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname)
    )
      return send(403, { error: 'Use the local console.' });
  } catch {
    return send(403, { error: 'Use the local console.' });
  }
  if (request.headers['content-type']?.split(';')[0]?.trim() !== 'application/json')
    return send(400, { error: 'Use JSON.' });
  try {
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    for await (const chunk of request as AsyncIterable<Uint8Array>) {
      bytes += chunk.byteLength;
      if (bytes > maximumInputBytes) return send(413, { error: 'Workspace request is too large.' });
      chunks.push(chunk);
    }
    const input = parseInput(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    const { result, actual } = parseOutput(input, await callback(input, target));
    if (actual.projectId !== target.projectId || actual.environmentId !== target.environmentId)
      throw new Error('Wrong target');
    return send(200, { result });
  } catch (error) {
    return send(400, {
      error:
        error instanceof OpsActionExecutionError
          ? error.safeMessage
          : 'Workspace operation failed. Review the selected target, plan, approval and host state.',
    });
  }
}
