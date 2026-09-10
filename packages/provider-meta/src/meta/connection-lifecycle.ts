import {
  metaConnectionObservationSchema,
  metaConnectionRecordSchema,
  type MetaConnectionObservation,
  type MetaConnectionRecord,
} from './connection.js';
import { readMetaConnectionRecord, removeMetaConnectionRecord } from './connection-store.js';

function fail(code: string, message: string): never {
  throw new Error(`[${code}] ${message}`);
}

function withoutVerification(
  record: MetaConnectionRecord,
): Omit<MetaConnectionRecord, 'lastVerifiedAt'> {
  const copy: MetaConnectionRecord = { ...record };
  delete copy.lastVerifiedAt;
  return copy;
}

function assertContext(
  current: MetaConnectionRecord,
  observation: MetaConnectionObservation,
): void {
  if (
    current.scopeId !== observation.scopeId ||
    current.projectId !== observation.projectId ||
    current.environmentId !== observation.environmentId ||
    current.connectionId !== observation.connectionId
  ) {
    fail(
      'META_CONNECTION_CONTEXT_MISMATCH',
      'The host observation does not belong to this scope, project, environment, and connection.',
    );
  }
  if (
    current.identity &&
    observation.identity &&
    (current.identity.kind !== observation.identity.kind ||
      current.identity.subject !== observation.identity.subject)
  ) {
    fail(
      'META_CONNECTION_IDENTITY_MISMATCH',
      'Credential lifecycle operations cannot silently replace the selected Meta identity.',
    );
  }
  if (Date.parse(observation.observedAt) < Date.parse(current.updatedAt)) {
    fail('META_CONNECTION_OBSERVATION_STALE', 'The host observation is older than the record.');
  }
}

function applyObservation(
  currentInput: MetaConnectionRecord,
  observationInput: MetaConnectionObservation,
  mode: 'refresh' | 'rotate',
): MetaConnectionRecord {
  const current = metaConnectionRecordSchema.parse(currentInput);
  const observation = metaConnectionObservationSchema.parse(observationInput);
  assertContext(current, observation);
  if (current.credential.state === 'revoked') {
    fail('META_CONNECTION_REVOKED', 'A revoked Meta connection must be explicitly reconnected.');
  }
  const expectedVersion =
    mode === 'rotate' ? current.credential.version + 1 : current.credential.version;
  if (observation.credential.version !== expectedVersion) {
    fail(
      'META_CONNECTION_VERSION_CONFLICT',
      `Expected credential version ${expectedVersion} for ${mode}.`,
    );
  }
  if (
    mode === 'refresh' &&
    observation.credential.secretReference !== current.credential.secretReference
  ) {
    fail(
      'META_CONNECTION_SECRET_REFERENCE_CONFLICT',
      'Refreshing cannot replace the host-owned secret reference.',
    );
  }
  return metaConnectionRecordSchema.parse({
    ...withoutVerification(current),
    ...(observation.identity
      ? { identity: observation.identity }
      : current.identity
        ? { identity: current.identity }
        : {}),
    credential: observation.credential,
    grants: observation.grants,
    resources: observation.resources,
    updatedAt: observation.observedAt,
    ...(observation.credential.state === 'active'
      ? { lastVerifiedAt: observation.observedAt }
      : {}),
  });
}

export function refreshMetaConnectionRecord(
  current: MetaConnectionRecord,
  observation: MetaConnectionObservation,
): MetaConnectionRecord {
  return applyObservation(current, observation, 'refresh');
}

export function rotateMetaConnectionRecord(
  current: MetaConnectionRecord,
  observation: MetaConnectionObservation,
): MetaConnectionRecord {
  return applyObservation(current, observation, 'rotate');
}

export function revokeMetaConnectionRecord(
  currentInput: MetaConnectionRecord,
  input: {
    scopeId: string;
    projectId: string;
    environmentId: string;
    connectionId: string;
    credentialVersion: number;
    observedAt: string;
  },
): MetaConnectionRecord {
  const current = metaConnectionRecordSchema.parse(currentInput);
  const observation = metaConnectionObservationSchema.parse({
    scopeId: input.scopeId,
    projectId: input.projectId,
    environmentId: input.environmentId,
    connectionId: input.connectionId,
    ...(current.identity ? { identity: current.identity } : {}),
    credential: {
      ...current.credential,
      version: input.credentialVersion,
      state: 'revoked',
      observedAt: input.observedAt,
    },
    grants: current.grants.map((grant) => ({
      ...grant,
      state: 'revoked',
      observedAt: input.observedAt,
    })),
    resources: current.resources,
    observedAt: input.observedAt,
  });
  assertContext(current, observation);
  if (input.credentialVersion !== current.credential.version) {
    fail('META_CONNECTION_VERSION_CONFLICT', 'Revocation requires the active credential version.');
  }
  return metaConnectionRecordSchema.parse({
    ...withoutVerification(current),
    credential: observation.credential,
    grants: observation.grants,
    updatedAt: input.observedAt,
  });
}

export function disconnectMetaConnectionRecord(input: {
  projectRoot: string;
  recordPath: string;
  scopeId: string;
  projectId: string;
  environmentId: string;
  connectionId: string;
}): {
  disconnected: boolean;
  recordMissing: boolean;
  historicalDataRetained: true;
  providerResourcesChanged: false;
  hostCredentialRevocationRequired: boolean;
} {
  const current = readMetaConnectionRecord(input);
  if (!current) {
    return {
      disconnected: false,
      recordMissing: true,
      historicalDataRetained: true,
      providerResourcesChanged: false,
      hostCredentialRevocationRequired: false,
    };
  }
  if (
    current.scopeId !== input.scopeId ||
    current.projectId !== input.projectId ||
    current.environmentId !== input.environmentId ||
    current.connectionId !== input.connectionId
  ) {
    fail(
      'META_DISCONNECT_CONTEXT_MISMATCH',
      'The selected Meta connection does not belong to this scope, project, and environment.',
    );
  }
  return {
    disconnected: removeMetaConnectionRecord(input),
    recordMissing: false,
    historicalDataRetained: true,
    providerResourcesChanged: false,
    hostCredentialRevocationRequired: current.credential.state !== 'revoked',
  };
}
