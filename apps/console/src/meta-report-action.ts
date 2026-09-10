import {
  growthReportEvidenceSchema,
  growthReportHistoryInputSchema,
  growthReportHistoryResultSchema,
  type GrowthReportHistoryInput,
} from '@unisane/growth/contracts';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  growthReportReadInputSchema,
  growthReportReadOutputSchema,
  type GrowthReportReadInput,
} from '@unisane/growth/contracts';
export type ConsoleMetaReportReader = (
  input: GrowthReportReadInput,
  target: { projectId: string; environmentId: string },
  evidence?: { collect?: ConsoleMetaReportReader; history?: ConsoleMetaReportHistoryReader },
) => Promise<unknown>;
export type ConsoleMetaReportHistoryReader = (
  input: GrowthReportHistoryInput,
  target: { projectId: string; environmentId: string },
) => Promise<unknown>;
export async function handleMetaReportRequest(
  request: IncomingMessage,
  response: ServerResponse,
  read: ConsoleMetaReportReader | undefined,
  target: { projectId: string; environmentId: string },
  evidence?: { collect?: ConsoleMetaReportReader; history?: ConsoleMetaReportHistoryReader },
) {
  const route = new URL(request.url ?? '/', 'http://localhost').pathname;
  if (
    ![
      '/api/console/meta/report',
      '/api/console/meta/report/collect',
      '/api/console/meta/report/history',
    ].includes(route)
  )
    return false;
  const mode = route.endsWith('/history')
    ? 'history'
    : route.endsWith('/collect')
      ? 'collect'
      : 'read';
  const send = (status: number, value: unknown) => {
    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(value));
    return true;
  };
  if (request.method !== 'POST') return send(405, { error: 'Use POST to read a report.' });
  if (!(mode === 'history' ? evidence?.history : mode === 'collect' ? evidence?.collect : read))
    return send(503, { error: 'Report reading is not supplied by this console host.' });
  let sameOrigin = false;
  try {
    const origin = new URL(request.headers.origin ?? '');
    sameOrigin =
      origin.protocol === 'http:' &&
      origin.host === request.headers.host &&
      ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname);
  } catch {
    /* Reject missing or invalid origin. */
  }
  if (!sameOrigin) return send(403, { error: 'Read reports from the local console.' });
  if (request.headers['content-type']?.split(';')[0]?.trim() !== 'application/json')
    return send(400, { error: 'Use a JSON report request.' });
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of request as AsyncIterable<Uint8Array>) {
      size += chunk.byteLength;
      if (size > 4096) return send(413, { error: 'Report request is too large.' });
      chunks.push(chunk);
    }
    let body: unknown;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      return send(400, { error: 'Use valid JSON.' });
    }
    if (mode === 'history') {
      const query = growthReportHistoryInputSchema.safeParse(body);
      if (!query.success) return send(400, { error: 'Check the history reference and limits.' });
      const output = growthReportHistoryResultSchema.parse(
        await evidence!.history!(query.data, target),
      );
      if (output.projectId !== target.projectId || output.environmentId !== target.environmentId)
        throw new Error('History target mismatch');
      if (
        output.selected &&
        (output.selected.report.projectId !== target.projectId ||
          output.selected.report.environmentId !== target.environmentId)
      )
        throw new Error('Evidence target mismatch');
      return send(200, { result: output });
    }
    const parsed = growthReportReadInputSchema.safeParse(body);
    if (!parsed.success) return send(400, { error: 'Check report dates and limits.' });
    const value = await (mode === 'collect' ? evidence!.collect! : read!)(parsed.data, target);
    const saved = mode === 'collect' ? growthReportEvidenceSchema.parse(value) : undefined;
    const output = growthReportReadOutputSchema.parse(saved?.report ?? value);
    if (output.projectId !== target.projectId || output.environmentId !== target.environmentId)
      throw new Error('Report target mismatch');
    return send(200, { result: saved ?? output });
  } catch {
    return send(502, {
      error: 'Report reading failed. Check connection access and dates, then retry.',
    });
  }
}
