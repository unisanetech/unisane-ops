import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  metaDiagnosticObservationSchema,
  metaDiagnosticImportResultSchema,
  metaDiagnosticReviewInputSchema,
  metaDiagnosticReviewResultSchema,
  type MetaDiagnosticObservation,
  type MetaDiagnosticReviewInput,
} from '@unisane/growth/contracts';
type Target = { projectId: string; environmentId: string };
export type ConsoleMetaDiagnostics = {
  import: (input: MetaDiagnosticObservation, target: Target) => Promise<unknown>;
  review: (input: MetaDiagnosticReviewInput, target: Target) => Promise<unknown>;
};
export async function handleMetaDiagnosticRequest(
  request: IncomingMessage,
  response: ServerResponse,
  callbacks: ConsoleMetaDiagnostics | undefined,
  target: Target,
) {
  const route = new URL(request.url ?? '/', 'http://localhost').pathname;
  if (
    !['/api/console/meta/diagnostics/import', '/api/console/meta/diagnostics/review'].includes(
      route,
    )
  )
    return false;
  const send = (status: number, value: unknown) => {
    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(value));
    return true;
  };
  if (request.method !== 'POST') return send(405, { error: 'Use POST.' });
  if (!callbacks)
    return send(503, { error: 'Diagnostic workflows are not supplied by this host.' });
  try {
    const origin = new URL(request.headers.origin ?? '');
    if (
      origin.protocol !== 'http:' ||
      origin.host !== request.headers.host ||
      !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
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
      if (bytes > 256 * 1024) return send(413, { error: 'Diagnostic input exceeds 256 KiB.' });
      chunks.push(chunk);
    }
    let raw: unknown;
    try {
      raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      return send(400, { error: 'Use valid JSON.' });
    }
    if (route.endsWith('/import')) {
      const parsed = metaDiagnosticObservationSchema.safeParse(raw);
      if (!parsed.success)
        return send(400, {
          error: 'Check the diagnostic evidence schema and required source information.',
        });
      if (
        parsed.data.projectId !== target.projectId ||
        parsed.data.environmentId !== target.environmentId
      )
        return send(400, { error: 'Evidence belongs to another project or environment.' });
      const output = metaDiagnosticImportResultSchema.parse(
        await callbacks.import(parsed.data, target),
      );
      if (
        output.projectId !== target.projectId ||
        output.environmentId !== target.environmentId ||
        output.datasetId !== parsed.data.datasetId ||
        output.connectionId !== parsed.data.connectionId
      )
        throw new Error();
      return send(200, { result: output });
    }
    const query = metaDiagnosticReviewInputSchema.safeParse(raw);
    if (!query.success) return send(400, { error: 'Check event name and result limits.' });
    const output = metaDiagnosticReviewResultSchema.parse(
      await callbacks.review(query.data, target),
    );
    if (output.projectId !== target.projectId || output.environmentId !== target.environmentId)
      throw new Error();
    return send(200, { result: output });
  } catch {
    return send(502, {
      error:
        'Diagnostic evidence could not be imported or reviewed. Check the selected dataset and local evidence.',
    });
  }
}
