import type { IncomingMessage, ServerResponse } from 'node:http';
import { googleTagManagerDiagnosisAction } from '@unisane/growth/actions';
import { googleTagManagerDiagnosisInputSchema } from '@unisane/growth/gtm';
export async function handleGtmDiagnosisRequest(
  request: IncomingMessage,
  response: ServerResponse,
  target: { projectId: string; environmentId: string },
) {
  if (new URL(request.url ?? '/', 'http://localhost').pathname !== '/api/console/gtm/diagnose')
    return false;
  const send = (status: number, value: unknown) => {
    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(value));
    return true;
  };
  if (request.method !== 'POST') return send(405, { error: 'Use POST.' });
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
      if (bytes > 1024 * 1024) return send(413, { error: 'GTM input exceeds 1 MiB.' });
      chunks.push(chunk);
    }
    const input = googleTagManagerDiagnosisInputSchema.parse(
      JSON.parse(Buffer.concat(chunks).toString('utf8')),
    );
    const result = await googleTagManagerDiagnosisAction.execute(input, {
      requestId: 'console-gtm-diagnose',
      scopeId: target.projectId,
      ...target,
      principal: { kind: 'user', id: 'local-console' },
      requestedAt: new Date().toISOString(),
    });
    return send(200, { result });
  } catch {
    return send(400, {
      error: 'Check the GTM manifest, selected app/environment and snapshot resource identities.',
    });
  }
}
