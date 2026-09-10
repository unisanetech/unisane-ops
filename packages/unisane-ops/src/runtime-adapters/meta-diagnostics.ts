import path from 'node:path';
import { mkdir, lstat } from 'node:fs/promises';
import { z } from 'zod';
import { hashOpsValue } from '@unisane/ops-engine';
import { LocalArtifactStore } from '@unisane/ops-engine/local';
import { opsPrincipalSchema, OpsActionExecutionError } from '@unisane/ops-engine/actions';
import {
  createMetaDiagnosticEvidence,
  validateMetaDiagnosticEvidence,
  createMetaDiagnosticReviewAction,
  metaDiagnosticBindingSchema,
  metaDiagnosticImportResultSchema,
  metaDiagnosticReviewInputSchema,
} from '@unisane/growth/actions';
import { loadUnisaneOpsConfig } from '../config/loader.js';
import { resolveMetaConnectionRecord } from './meta-context.js';
export async function resolveMetaDiagnosticTarget(cwd: string, environmentId: string) {
  const { connection, environment } = await resolveMetaConnectionRecord(cwd, {
    environment: environmentId,
  });
  const configured = environment.resources.filter(
    (resource) =>
      resource.provider === 'meta' &&
      resource.connection === connection.connectionId &&
      resource.service === 'event-measurement' &&
      ['pixel', 'dataset'].includes(resource.resourceType),
  );
  const selected = connection.resources.filter(
    (resource) =>
      resource.service === 'event-measurement' &&
      resource.state === 'selected' &&
      ['pixel', 'dataset'].includes(resource.resourceType),
  );
  if (
    configured.length !== 1 ||
    selected.length !== 1 ||
    configured[0]!.resourceId !== selected[0]!.resourceId
  )
    throw new OpsActionExecutionError(
      'growth.meta.diagnostics.binding-required',
      'Select exactly one matching Pixel or dataset in the Growth environment and Meta connection.',
    );
  return metaDiagnosticBindingSchema.parse({
    projectId: connection.projectId,
    environmentId,
    connectionId: connection.connectionId,
    datasetId: configured[0]!.resourceId,
  });
}
async function storeAt(root: string, identity: string, create: boolean) {
  let directory = root;
  for (const segment of ['.unisane', 'ops', 'growth', 'meta-diagnostics', identity]) {
    directory = path.join(directory, segment);
    if (create)
      await mkdir(directory, { mode: 0o700 }).catch((error) => {
        if (error.code !== 'EEXIST') throw error;
      });
    try {
      const info = await lstat(directory);
      if (!info.isDirectory() || info.isSymbolicLink())
        throw new Error('Invalid diagnostic storage directory.');
    } catch (error) {
      if (!create && (error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
  }
  return new LocalArtifactStore(directory);
}
export async function executeMetaDiagnosticOperation(
  cwd: string,
  mode: 'import' | 'review',
  raw: unknown,
  now: Date = new Date(),
) {
  const encoded = JSON.stringify(raw);
  if (encoded === undefined)
    throw new OpsActionExecutionError(
      'growth.meta.diagnostics.invalid-input',
      'Diagnostic input must be a JSON object.',
    );
  if (Buffer.byteLength(encoded) > 256 * 1024)
    throw new OpsActionExecutionError(
      'growth.meta.diagnostics.input-too-large',
      'Diagnostic input exceeds 256 KiB.',
    );
  const request = z
    .object({
      projectId: z.string(),
      environmentId: z.string(),
      principal: opsPrincipalSchema,
      observation: z.unknown().optional(),
      query: z.unknown().optional(),
    })
    .strict()
    .parse(raw);
  if (
    (mode === 'review' && request.observation !== undefined) ||
    (mode === 'import' && request.query !== undefined)
  )
    throw new Error('Unexpected diagnostic operation fields.');
  const binding = await resolveMetaDiagnosticTarget(cwd, request.environmentId);
  if (binding.projectId !== request.projectId)
    throw new OpsActionExecutionError(
      'growth.meta.diagnostics.target-mismatch',
      'Diagnostic operation belongs to another project.',
    );
  const { projectRoot } = await loadUnisaneOpsConfig(cwd);
  try {
    const store = await storeAt(projectRoot, hashOpsValue(binding), mode === 'import');
    if (mode === 'import') {
      const evidence = createMetaDiagnosticEvidence(request.observation, binding, now);
      await store!.put({
        id: evidence.evidenceId,
        kind: 'report',
        value: evidence,
        createdAt: evidence.importedAt,
        expiresAt: null,
      });
      await store!.put({
        id: 'latest-import',
        kind: 'state',
        value: { evidenceId: evidence.evidenceId },
        createdAt: evidence.importedAt,
        expiresAt: null,
      });
      return metaDiagnosticImportResultSchema.parse({
        schemaVersion: 1,
        actionId: 'growth.meta.diagnostics.import',
        ...binding,
        evidenceId: evidence.evidenceId,
        importedAt: evidence.importedAt,
        eventCount: evidence.observation.events.length,
        verifiedLive: false,
      });
    }
    const query = metaDiagnosticReviewInputSchema.parse(request.query ?? {});
    const action = createMetaDiagnosticReviewAction({
      resolveBinding: async () => binding,
      now: () => now,
      load: async () => {
        const pointer = await store?.get('latest-import');
        if (!pointer) return undefined;
        if (pointer.id !== 'latest-import' || pointer.kind !== 'state')
          throw new Error('Invalid diagnostic reference.');
        const { evidenceId } = z
          .object({ evidenceId: z.string().regex(/^[a-f0-9]{64}$/) })
          .strict()
          .parse(pointer.value);
        const record = await store!.get(evidenceId);
        if (!record || record.id !== evidenceId || record.kind !== 'report')
          throw new Error('Diagnostic reference is missing.');
        return validateMetaDiagnosticEvidence(record.value, binding);
      },
    });
    return await action.execute(query, {
      requestId: 'meta-diagnostic-review',
      scopeId: `scope.${request.projectId}`,
      projectId: request.projectId,
      environmentId: request.environmentId,
      principal: request.principal,
      requestedAt: now.toISOString(),
    });
  } catch {
    throw new OpsActionExecutionError(
      'growth.meta.diagnostics.invalid-evidence',
      'Diagnostic evidence could not be imported or reviewed. Check its schema, selected dataset, reference and local storage.',
    );
  }
}
