import { defineOpsReadinessFinding, type OpsReadinessFinding } from '@unisane/ops-engine/readiness';
import { z } from 'zod';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const nonEmptySchema = z.string().trim().min(1);
const isoTimestampSchema = z.string().datetime({ offset: true });

export const googleConnectionServiceSchema = z.enum([
  'project-administration',
  'search-console',
  'analytics',
  'tag-manager',
  'ads',
]);
export type GoogleConnectionService = z.infer<typeof googleConnectionServiceSchema>;

export const googleTagManagerAccessSchema = z.enum(['read', 'workspace', 'publish']);
export type GoogleTagManagerAccess = z.infer<typeof googleTagManagerAccessSchema>;

const GOOGLE_TAG_MANAGER_SCOPES_BY_ACCESS: Record<
  GoogleTagManagerAccess,
  readonly string[]
> = {
  read: ['https://www.googleapis.com/auth/tagmanager.readonly'],
  workspace: [
    'https://www.googleapis.com/auth/tagmanager.readonly',
    'https://www.googleapis.com/auth/tagmanager.edit.containers',
    'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
  ],
  publish: [
    'https://www.googleapis.com/auth/tagmanager.readonly',
    'https://www.googleapis.com/auth/tagmanager.edit.containers',
    'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
    'https://www.googleapis.com/auth/tagmanager.publish',
  ],
};

export function googleTagManagerScopesForAccess(
  access: GoogleTagManagerAccess,
): readonly string[] {
  return [...GOOGLE_TAG_MANAGER_SCOPES_BY_ACCESS[googleTagManagerAccessSchema.parse(access)]];
}

export const googleConnectionGrantSchema = z
  .object({
    service: googleConnectionServiceSchema,
    scopes: z.array(nonEmptySchema).min(1),
    state: z.enum(['granted', 'missing', 'partial', 'revoked']),
    observedAt: isoTimestampSchema,
    expiresAt: isoTimestampSchema.optional(),
    issueCode: stableIdSchema.optional(),
  })
  .strict();
export type GoogleConnectionGrant = z.infer<typeof googleConnectionGrantSchema>;

export const googleResourceSelectionSchema = z
  .object({
    service: googleConnectionServiceSchema,
    resourceType: z.enum([
      'project',
      'site',
      'account',
      'property',
      'container',
      'customer',
      'manager-customer',
    ]),
    resourceId: nonEmptySchema,
    displayName: nonEmptySchema,
    state: z.enum(['selected', 'missing', 'ambiguous', 'inaccessible']),
    observedAt: isoTimestampSchema,
  })
  .strict();
export type GoogleResourceSelection = z.infer<typeof googleResourceSelectionSchema>;

export const googleConnectionRecordSchema = z
  .object({
    schemaVersion: z.literal(1),
    provider: z.literal('google'),
    connectionId: stableIdSchema,
    displayName: nonEmptySchema,
    projectId: stableIdSchema,
    environmentId: stableIdSchema,
    secretReference: stableIdSchema,
    oauth: z
      .object({
        clientId: nonEmptySchema,
        clientSecretReference: stableIdSchema.optional(),
      })
      .strict()
      .optional(),
    googleCloudProjectId: nonEmptySchema.optional(),
    identity: z
      .object({
        subject: nonEmptySchema,
        email: z.string().email().optional(),
      })
      .strict()
      .optional(),
    credentialState: z.enum(['active', 'expired', 'revoked', 'missing']),
    grants: z.array(googleConnectionGrantSchema),
    resources: z.array(googleResourceSelectionSchema),
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
        message: 'A Google connection may contain only one grant record per service.',
      });
    }
    const resourceKeys = record.resources.map(
      (resource) => `${resource.service}:${resource.resourceType}:${resource.resourceId}`,
    );
    if (new Set(resourceKeys).size !== resourceKeys.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resources'],
        message: 'A Google connection may not contain duplicate resource selections.',
      });
    }
  });
export type GoogleConnectionRecord = z.infer<typeof googleConnectionRecordSchema>;

export function defineGoogleConnectionRecord(
  input: GoogleConnectionRecord,
): GoogleConnectionRecord {
  return googleConnectionRecordSchema.parse(input);
}

export function buildGoogleConnectionReadiness(
  input: GoogleConnectionRecord,
): OpsReadinessFinding[] {
  const connection = googleConnectionRecordSchema.parse(input);
  const observedAt = connection.lastVerifiedAt ?? connection.updatedAt;
  const credentialReady = connection.credentialState === 'active';
  const findings: OpsReadinessFinding[] = [
    defineOpsReadinessFinding({
      schemaVersion: 1,
      code: credentialReady
        ? 'google.connection.ready'
        : `google.connection.${connection.credentialState}`,
      dimension: 'connection',
      state:
        connection.credentialState === 'active'
          ? 'ready'
          : connection.credentialState === 'expired'
            ? 'expired-access'
            : connection.credentialState === 'revoked'
              ? 'permission-blocked'
              : 'not-connected',
      severity: credentialReady ? 'info' : 'error',
      projectId: connection.projectId,
      environmentId: connection.environmentId,
      connectionId: connection.connectionId,
      summary: credentialReady
        ? `Google connection ${connection.displayName} is active.`
        : `Google connection ${connection.displayName} requires credential recovery.`,
      blocking: !credentialReady,
      observedAt,
      evidence: [
        {
          kind: 'provider-connection',
          source: connection.secretReference,
          observedAt,
          freshness: connection.lastVerifiedAt ? 'fresh' : 'unknown',
          summary: `Credential state is ${connection.credentialState}.`,
        },
      ],
      ...(!credentialReady
        ? {
            nextAction: {
              id: 'google.connection.reconnect',
              label: 'Reconnect Google',
              description: 'Restore the selected Google identity and required access.',
              command: {
                path: ['connect', 'google'],
                args: ['--connection', connection.connectionId],
                json: false,
                maximumEffect: 'write',
              },
              requiresConfirmation: true,
              requiresApproval: false,
            },
          }
        : {}),
    }),
  ];

  for (const grant of connection.grants) {
    const ready = grant.state === 'granted';
    findings.push(
      defineOpsReadinessFinding({
        schemaVersion: 1,
        code: `google.grant.${grant.service}.${grant.state}`,
        dimension: 'connection',
        state:
          grant.state === 'granted'
            ? 'ready'
            : grant.state === 'partial'
              ? 'partial'
              : 'permission-blocked',
        severity: ready ? 'info' : grant.state === 'partial' ? 'warning' : 'error',
        projectId: connection.projectId,
        environmentId: connection.environmentId,
        connectionId: connection.connectionId,
        summary: `Google ${grant.service} access is ${grant.state}.`,
        blocking: !ready,
        observedAt: grant.observedAt,
        evidence: [
          {
            kind: 'provider-grant',
            source: connection.connectionId,
            observedAt: grant.observedAt,
            freshness: 'fresh',
            summary: `${grant.scopes.length} required scope${grant.scopes.length === 1 ? '' : 's'} evaluated.`,
          },
        ],
        ...(!ready
          ? {
              nextAction: {
                id: `google.grant.${grant.service}.request`,
                label: `Grant Google ${grant.service} access`,
                description: `Request only the access required for ${grant.service}.`,
                command: {
                  path: ['connect', 'google'],
                  args: ['--connection', connection.connectionId, '--service', grant.service],
                  json: false,
                  maximumEffect: 'write',
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
