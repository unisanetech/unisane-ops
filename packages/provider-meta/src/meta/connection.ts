import {
  assessMarketingMetaConnection,
  marketingMetaConnectionGrantSchema,
  marketingMetaConnectionResourceSchema,
  marketingMetaConnectionStatusSchema,
  type MarketingMetaConnectionGrant,
  type MarketingMetaConnectionResource,
  type MarketingMetaConnectionStatus,
} from '@unisane/growth/marketing';
import { z } from 'zod';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const nonEmptySchema = z.string().trim().min(1).max(300);
const isoTimestampSchema = z.string().datetime({ offset: true });

export const metaConnectionIdentitySchema = z
  .object({
    kind: z.enum(['user', 'system-user']),
    subject: nonEmptySchema,
    displayName: nonEmptySchema.optional(),
  })
  .strict();
export type MetaConnectionIdentity = z.infer<typeof metaConnectionIdentitySchema>;

export const metaCredentialBindingSchema = z
  .object({
    secretReference: stableIdSchema,
    secretKind: z.literal('meta-graph-access'),
    version: z.number().int().positive(),
    state: z.enum(['active', 'expired', 'revoked', 'missing']),
    observedAt: isoTimestampSchema,
    expiresAt: isoTimestampSchema.optional(),
  })
  .strict();
export type MetaCredentialBinding = z.infer<typeof metaCredentialBindingSchema>;

export const metaConnectionRecordSchema = z
  .object({
    schemaVersion: z.literal(1),
    provider: z.literal('meta'),
    scopeId: stableIdSchema,
    projectId: stableIdSchema,
    environmentId: stableIdSchema,
    connectionId: stableIdSchema,
    displayName: nonEmptySchema,
    identity: metaConnectionIdentitySchema.optional(),
    credential: metaCredentialBindingSchema,
    grants: z.array(marketingMetaConnectionGrantSchema).max(20),
    resources: z.array(marketingMetaConnectionResourceSchema).max(100),
    createdAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema,
    lastVerifiedAt: isoTimestampSchema.optional(),
  })
  .strict()
  .superRefine((record, context) => {
    const grantServices = record.grants.map((grant) => grant.service);
    if (new Set(grantServices).size !== grantServices.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['grants'],
        message: 'A Meta connection may contain only one grant record per service.',
      });
    }
    const resourceKeys = record.resources.map(
      (resource) => `${resource.service}:${resource.resourceType}:${resource.resourceId}`,
    );
    if (new Set(resourceKeys).size !== resourceKeys.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resources'],
        message: 'A Meta connection may not contain duplicate resource selections.',
      });
    }
    if (record.credential.state === 'active' && (!record.identity || !record.lastVerifiedAt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['credential', 'state'],
        message:
          'An active Meta credential requires host-verified identity and timestamp evidence.',
      });
    }
  });
export type MetaConnectionRecord = z.infer<typeof metaConnectionRecordSchema>;

export const metaConnectionObservationSchema = z
  .object({
    scopeId: stableIdSchema,
    projectId: stableIdSchema,
    environmentId: stableIdSchema,
    connectionId: stableIdSchema,
    identity: metaConnectionIdentitySchema.optional(),
    credential: metaCredentialBindingSchema,
    grants: z.array(marketingMetaConnectionGrantSchema).max(20),
    resources: z.array(marketingMetaConnectionResourceSchema).max(100),
    observedAt: isoTimestampSchema,
  })
  .strict();
export type MetaConnectionObservation = z.infer<typeof metaConnectionObservationSchema>;

export function defineMetaConnectionRecord(input: MetaConnectionRecord): MetaConnectionRecord {
  return metaConnectionRecordSchema.parse(input);
}

export function createMetaConnectionRecord(input: {
  displayName: string;
  observation: MetaConnectionObservation;
}): MetaConnectionRecord {
  const observation = metaConnectionObservationSchema.parse(input.observation);
  return metaConnectionRecordSchema.parse({
    schemaVersion: 1,
    provider: 'meta',
    scopeId: observation.scopeId,
    projectId: observation.projectId,
    environmentId: observation.environmentId,
    connectionId: observation.connectionId,
    displayName: input.displayName,
    ...(observation.identity ? { identity: observation.identity } : {}),
    credential: observation.credential,
    grants: observation.grants,
    resources: observation.resources,
    createdAt: observation.observedAt,
    updatedAt: observation.observedAt,
    ...(observation.credential.state === 'active'
      ? { lastVerifiedAt: observation.observedAt }
      : {}),
  });
}

export function projectMetaConnectionStatus(
  input: MetaConnectionRecord,
): MarketingMetaConnectionStatus {
  const connection = metaConnectionRecordSchema.parse(input);
  return marketingMetaConnectionStatusSchema.parse({
    schemaVersion: 1,
    connectionId: connection.connectionId,
    connected: connection.credential.state !== 'revoked',
    scopes: [...new Set(connection.grants.flatMap((grant) => grant.scopes))],
    credentialAvailable: connection.credential.state === 'active',
    credentialState: connection.credential.state,
    ...(connection.credential.expiresAt ? { expiresAt: connection.credential.expiresAt } : {}),
    updatedAt: connection.updatedAt,
    ...(connection.lastVerifiedAt ? { lastVerifiedAt: connection.lastVerifiedAt } : {}),
    grants: connection.grants,
    resources: connection.resources,
  });
}

function defineMetaReadinessFinding(input: Record<string, unknown>): Record<string, unknown> {
  return input;
}

export function buildMetaConnectionReadiness(
  input: MetaConnectionRecord,
): Array<Record<string, unknown>> {
  const connection = metaConnectionRecordSchema.parse(input);
  const status = projectMetaConnectionStatus(connection);
  const assessment = assessMarketingMetaConnection(status);
  const observedAt = connection.lastVerifiedAt ?? connection.updatedAt;
  const credentialReady = connection.credential.state === 'active';
  const findings: Array<Record<string, unknown>> = [
    defineMetaReadinessFinding({
      schemaVersion: 1,
      code: credentialReady
        ? 'meta.connection.ready'
        : `meta.connection.${connection.credential.state}`,
      dimension: 'connection',
      state:
        connection.credential.state === 'active'
          ? 'ready'
          : connection.credential.state === 'expired'
            ? 'expired-access'
            : connection.credential.state === 'revoked'
              ? 'permission-blocked'
              : 'not-connected',
      severity: credentialReady ? 'info' : 'error',
      projectId: connection.projectId,
      environmentId: connection.environmentId,
      connectionId: connection.connectionId,
      summary: credentialReady
        ? `Meta connection ${connection.displayName} has an active host credential.`
        : `Meta connection ${connection.displayName} requires credential recovery.`,
      blocking: !credentialReady,
      observedAt,
      evidence: [
        {
          kind: 'provider-connection',
          source: connection.connectionId,
          observedAt,
          freshness: connection.lastVerifiedAt ? 'fresh' : 'unknown',
          summary: `Credential state is ${connection.credential.state}; secret custody remains inside the host.`,
        },
      ],
      ...(!credentialReady
        ? {
            nextAction: {
              id: 'meta.connection.reconnect',
              label: 'Reconnect Meta',
              description: 'Restore and verify the exact Meta identity and read-only access.',
              command: {
                path: ['connect', 'meta'],
                args: [
                  '--connection',
                  connection.connectionId,
                  '--environment',
                  connection.environmentId,
                ],
                json: false,
                maximumEffect: 'write' as const,
              },
              requiresConfirmation: true,
              requiresApproval: false,
            },
          }
        : {}),
    }),
  ];
  for (const service of assessment.services) {
    findings.push(
      defineMetaReadinessFinding({
        schemaVersion: 1,
        code: `meta.service.${service.service}.${service.state}`,
        dimension: service.state.startsWith('resource-') ? 'resource' : 'connection',
        state: service.ready
          ? 'ready'
          : service.state === 'grant-partial' || service.state === 'resource-ambiguous'
            ? 'partial'
            : service.state === 'credential-expired' || service.state === 'grant-expired'
              ? 'expired-access'
              : 'permission-blocked',
        severity: service.ready ? 'info' : 'error',
        projectId: connection.projectId,
        environmentId: connection.environmentId,
        connectionId: connection.connectionId,
        summary: service.ready
          ? `Meta ${service.service} is ready with explicit resource selection.`
          : service.issues.join(' '),
        blocking: !service.ready,
        observedAt,
        evidence: [
          {
            kind: service.state.startsWith('resource-') ? 'provider-resource' : 'provider-grant',
            source: connection.connectionId,
            observedAt,
            freshness: connection.lastVerifiedAt ? 'fresh' : 'unknown',
            summary: `${service.selectedResources.length} selected resource${service.selectedResources.length === 1 ? '' : 's'} evaluated without exposing credential metadata.`,
          },
        ],
        ...(!service.ready
          ? {
              nextAction: {
                id: `meta.service.${service.service}.repair`,
                label: `Repair Meta ${service.service}`,
                description: 'Refresh discovery and explicitly select the required resource IDs.',
                command: {
                  path: ['connect', 'meta'],
                  args: [
                    '--connection',
                    connection.connectionId,
                    '--environment',
                    connection.environmentId,
                    '--refresh',
                  ],
                  json: false,
                  maximumEffect: 'write' as const,
                },
                requiresConfirmation: true,
                requiresApproval: false,
              },
            }
          : {}),
      }),
    );
  }
  return findings;
}

export type { MarketingMetaConnectionGrant, MarketingMetaConnectionResource };
