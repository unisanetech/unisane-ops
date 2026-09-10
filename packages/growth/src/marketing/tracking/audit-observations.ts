import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { LoadedMarketingRegistries } from '../registry/load-registries.js';
import type { MarketingEvent, MarketingEventDeliveryChannel } from '../schema/event-registry.js';
import type {
  MarketingTrackingCoverage,
  MarketingTrackingEmitterId,
  MarketingTrackingFinding,
} from './audit-types.js';
import {
  marketingTrackingObservationArtifactSchema,
  type MarketingTrackingObservation,
  type MarketingTrackingObservationArtifact,
} from '@unisane/web-runtime/contracts';

export {
  marketingTrackingCaptureEvidenceSchema,
  marketingTrackingCommerceEvidenceSchema,
  marketingTrackingConsentEvidenceSchema,
  marketingTrackingCustomerFieldEvidenceSchema,
  marketingTrackingDiagnosticEvidenceSchema,
  marketingTrackingEvidenceStateSchema,
  marketingTrackingIdentityDigestSchema,
  marketingTrackingObservationArtifactSchema,
  marketingTrackingObservationEmitterSchema,
  marketingTrackingObservationOutcomeSchema,
  marketingTrackingObservationSchema,
  marketingTrackingObservationWindowsSchema,
  marketingTrackingParameterEvidenceSchema,
  marketingTrackingParameterTypeSchema,
  marketingTrackingProviderReferenceSchema,
  marketingTrackingTransportFieldEvidenceSchema,
  marketingTrackingValidityStateSchema,
  type MarketingTrackingEvidenceState,
  type MarketingTrackingObservation,
  type MarketingTrackingObservationArtifact,
} from '@unisane/web-runtime/contracts';

const legacyObservationEmitterSchema = z.enum([
  'web-runtime',
  'gtm',
  'gtag',
  'meta-pixel',
  'meta-capi',
  'google-ads',
  'other',
]);

const observationV1Schema = z.object({
  eventName: z.string().min(1),
  eventId: z.string().min(1).optional(),
  conversionId: z.string().min(1).optional(),
  channel: z.enum(['browser', 'server']),
  emitter: legacyObservationEmitterSchema,
  environment: z.string().min(1).optional(),
  outcome: z.enum(['emitted', 'suppressed', 'rejected']).default('emitted'),
  reason: z.string().min(1).optional(),
  payload: z.record(z.unknown()).default({}),
  observedAt: z.string().datetime({ offset: true }).optional(),
});

const marketingTrackingObservationArtifactV1Schema = z.object({
  kind: z.literal('unisane.growth.tracking-observations'),
  version: z.literal(1),
  environment: z.string().min(1),
  capturedAt: z.string().datetime({ offset: true }),
  observations: z.array(observationV1Schema),
});

export type LoadedMarketingTrackingObservations = {
  path?: string;
  artifact?: MarketingTrackingObservationArtifact;
};

function opaqueLegacyReference(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function legacyLogicalEventId(
  observation: z.infer<typeof observationV1Schema>,
): string | undefined {
  const payloadLogicalEventId = observation.payload.logicalEventId;
  if (typeof payloadLogicalEventId === 'string' && payloadLogicalEventId.length > 0) {
    return opaqueLegacyReference(payloadLogicalEventId);
  }
  const transactionId = observation.payload.transactionId;
  if (typeof transactionId === 'string' && transactionId.length > 0) {
    return opaqueLegacyReference(transactionId);
  }
  return observation.eventId ? opaqueLegacyReference(observation.eventId) : undefined;
}

function legacyParameterType(
  value: unknown,
): 'string' | 'number' | 'boolean' | 'array' | 'object' | undefined {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return undefined;
}

function legacyParameterEvidence(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).map(([name, value]) => {
      const type = legacyParameterType(value);
      return [name, type ? { state: 'present' as const, type } : { state: 'invalid' as const }];
    }),
  );
}

const LEGACY_CUSTOMER_FIELD_ALIASES = {
  email: ['email', 'emailHash', 'em'],
  phone: ['phone', 'phoneHash', 'ph'],
  firstName: ['firstName', 'first_name', 'fn'],
  lastName: ['lastName', 'last_name', 'ln'],
  city: ['city', 'ct'],
  region: ['region', 'state', 'st'],
  postcode: ['postcode', 'postalCode', 'zip', 'zp'],
  country: ['country'],
  externalId: ['externalId', 'external_id'],
} as const;

function legacyCoverageState(payload: Record<string, unknown>, aliases: readonly string[]) {
  const matched = aliases.find((alias) => alias in payload);
  if (!matched) return undefined;
  return legacyParameterType(payload[matched]) ? ('present' as const) : ('invalid' as const);
}

function legacyCustomerFields(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(LEGACY_CUSTOMER_FIELD_ALIASES).flatMap(([field, aliases]) => {
      const state = legacyCoverageState(payload, aliases);
      return state ? [[field, state]] : [];
    }),
  );
}

function legacyTransportFields(payload: Record<string, unknown>) {
  const aliases = {
    fbp: ['fbp', '_fbp'],
    fbc: ['fbc', '_fbc'],
    clientIp: ['clientIp', 'client_ip_address'],
    userAgent: ['userAgent', 'client_user_agent'],
    sourceUrl: ['sourceUrl', 'event_source_url'],
  } as const;
  return Object.fromEntries(
    Object.entries(aliases).flatMap(([field, candidates]) => {
      const state = legacyCoverageState(payload, candidates);
      return state ? [[field, state]] : [];
    }),
  );
}

function legacyCommerceState(
  payload: Record<string, unknown>,
  names: readonly string[],
  isValid: (value: unknown) => boolean,
) {
  const name = names.find((candidate) => candidate in payload);
  if (!name) return 'absent' as const;
  return isValid(payload[name]) ? ('valid' as const) : ('invalid' as const);
}

export function migrateMarketingTrackingObservationArtifactV1(
  input: unknown,
  options: { projectId: string },
): MarketingTrackingObservationArtifact {
  const legacy = marketingTrackingObservationArtifactV1Schema.parse(input);
  return marketingTrackingObservationArtifactSchema.parse({
    kind: legacy.kind,
    version: 2,
    projectId: options.projectId,
    environment: legacy.environment,
    capturedAt: legacy.capturedAt,
    windows: {},
    observations: legacy.observations.map((observation, index) => {
      const transactionId = observation.payload.transactionId;
      const transactionDigest =
        typeof transactionId === 'string' && transactionId.length > 0
          ? opaqueLegacyReference(transactionId)
          : undefined;
      return {
        projectId: options.projectId,
        observationId: opaqueLegacyReference(
          JSON.stringify({
            projectId: options.projectId,
            index,
            eventName: observation.eventName,
            eventId: observation.eventId,
            channel: observation.channel,
            outcome: observation.outcome,
            observedAt: observation.observedAt ?? legacy.capturedAt,
          }),
        ),
        logicalEventId: legacyLogicalEventId(observation),
        eventName: observation.eventName,
        ...(observation.eventId ? { eventId: opaqueLegacyReference(observation.eventId) } : {}),
        conversionId: observation.conversionId,
        ...(transactionDigest
          ? {
              transactionReference: transactionDigest,
              canonicalCorrelationId: transactionDigest,
            }
          : {}),
        channel: observation.channel,
        emitter: observation.emitter,
        environment: observation.environment ?? legacy.environment,
        occurredAt: observation.observedAt ?? legacy.capturedAt,
        outcome: observation.outcome,
        attempt: 1,
        consent: {
          state: 'unknown',
          categories: [],
          ...(observation.outcome === 'suppressed'
            ? { suppressionReasonCode: 'legacy-suppressed' }
            : {}),
        },
        parameterEvidence: legacyParameterEvidence(observation.payload),
        commerce: {
          value: legacyCommerceState(
            observation.payload,
            ['value'],
            (value) => typeof value === 'number' && Number.isFinite(value),
          ),
          currency: legacyCommerceState(
            observation.payload,
            ['currency'],
            (value) => typeof value === 'string' && /^[A-Z]{3}$/.test(value),
          ),
          catalog: legacyCommerceState(
            observation.payload,
            ['contents', 'contentIds', 'content_ids'],
            (value) => Array.isArray(value) || (typeof value === 'object' && value !== null),
          ),
        },
        customerFields: legacyCustomerFields(observation.payload),
        transportFields: legacyTransportFields(observation.payload),
        capture: {
          source: 'migration',
          schemaVersion: 1,
          provenance: 'migrated',
          receivedAt: legacy.capturedAt,
        },
        ...(observation.outcome === 'rejected'
          ? { diagnostics: { messageCode: 'legacy-rejected' } }
          : {}),
      };
    }),
  });
}

function ensureWithinCwd(cwd: string, resolvedPath: string): void {
  const prefix = cwd.endsWith(path.sep) ? cwd : `${cwd}${path.sep}`;
  if (resolvedPath !== cwd && !resolvedPath.startsWith(prefix)) {
    throw new Error(
      `[MARKETING_TRACKING_OBSERVATIONS_OUTSIDE_CWD] Observation artifact must stay inside the working directory: ${resolvedPath}`,
    );
  }
}

export function loadMarketingTrackingObservations(
  cwd: string,
  relativePath: string,
): LoadedMarketingTrackingObservations {
  const resolvedPath = path.resolve(cwd, relativePath);
  ensureWithinCwd(cwd, resolvedPath);
  if (!existsSync(resolvedPath)) return {};
  const value = JSON.parse(readFileSync(resolvedPath, 'utf8')) as unknown;
  if (typeof value === 'object' && value !== null && 'version' in value && value.version === 1) {
    throw new Error(
      '[MARKETING_TRACKING_OBSERVATIONS_V1_RETIRED] Tracking observation version 1 is retired. Run the explicit migrateMarketingTrackingObservationArtifactV1 migration and save the version 2 artifact before ordinary runtime loading.',
    );
  }
  return {
    path: resolvedPath,
    artifact: marketingTrackingObservationArtifactSchema.parse(value),
  };
}

function expectedChannels(event: MarketingEvent): MarketingEventDeliveryChannel[] {
  if (event.deliveryExpectation === 'browser-and-server') return ['browser', 'server'];
  return event.deliveryExpectation === 'browser-only' ? ['browser'] : ['server'];
}

function propertyEvidenceMatches(
  evidence: MarketingTrackingObservation['parameterEvidence'][string] | undefined,
  type: MarketingEvent['requiredProperties'][number]['type'],
) {
  if (!evidence || ['absent', 'invalid', 'not-applicable'].includes(evidence.state)) return false;
  return evidence.type === type;
}

function eventAliases(event: MarketingEvent): Set<string> {
  return new Set(
    [
      event.id,
      event.name,
      event.mappings.gtm?.dataLayerEvent,
      event.mappings.ga4?.eventName,
    ].filter((value): value is string => Boolean(value)),
  );
}

function resolveEvent(
  events: readonly MarketingEvent[],
  eventName: string,
): MarketingEvent | undefined {
  return events.find((event) => eventAliases(event).has(eventName));
}

function stableSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '');
}

function isSuccessfulDelivery(observation: MarketingTrackingObservation): boolean {
  return observation.outcome === 'emitted' || observation.outcome === 'accepted';
}

function isDeliveryAttempt(observation: MarketingTrackingObservation): boolean {
  return ['attempted', 'emitted', 'accepted', 'retried'].includes(observation.outcome);
}

type ResolvedObservation = {
  event: MarketingEvent;
  observation: MarketingTrackingObservation;
};

function terminalDeliveries(
  entries: readonly ResolvedObservation[],
  channel: MarketingEventDeliveryChannel,
): ResolvedObservation[] {
  const channelEntries = entries.filter((entry) => entry.observation.channel === channel);
  if (channel === 'server') {
    const accepted = channelEntries.filter((entry) => entry.observation.outcome === 'accepted');
    if (accepted.length > 0) return accepted;
  }
  return channelEntries.filter((entry) => isSuccessfulDelivery(entry.observation));
}

function correlationIdentity(observation: MarketingTrackingObservation): string {
  return (
    observation.canonicalCorrelationId ??
    observation.transactionReference ??
    observation.logicalEventId
  );
}

function groupDeliveryObservations(
  observations: readonly ResolvedObservation[],
  correlationWindowSeconds: number,
): Map<string, ResolvedObservation[]> {
  const candidates = new Map<string, ResolvedObservation[]>();
  for (const entry of observations) {
    if (!isDeliveryAttempt(entry.observation)) continue;
    const baseKey = [
      entry.observation.environment,
      entry.event.id,
      entry.observation.logicalEventId,
      correlationIdentity(entry.observation),
    ].join(':');
    const values = candidates.get(baseKey) ?? [];
    values.push(entry);
    candidates.set(baseKey, values);
  }

  const groups = new Map<string, ResolvedObservation[]>();
  const windowMs = correlationWindowSeconds * 1_000;
  for (const [baseKey, entries] of candidates) {
    const ordered = [...entries].sort(
      (left, right) =>
        Date.parse(left.observation.occurredAt) - Date.parse(right.observation.occurredAt),
    );
    let groupStart = Number.NaN;
    let groupIndex = -1;
    for (const entry of ordered) {
      const occurredAt = Date.parse(entry.observation.occurredAt);
      if (!Number.isFinite(groupStart) || occurredAt - groupStart > windowMs) {
        groupStart = occurredAt;
        groupIndex += 1;
      }
      const groupKey = `${baseKey}:${groupStart}:${groupIndex}`;
      const values = groups.get(groupKey) ?? [];
      values.push(entry);
      groups.set(groupKey, values);
    }
  }
  return groups;
}

function classifyDeliveryObservations(input: {
  events: readonly MarketingEvent[];
  observations: readonly ResolvedObservation[];
  artifact: MarketingTrackingObservationArtifact;
  now: Date;
}): {
  findings: MarketingTrackingFinding[];
  coverage: Pick<
    MarketingTrackingCoverage,
    | 'expectedDualDeliveryEventCount'
    | 'observedLogicalEventCount'
    | 'validDeduplicationPairCount'
    | 'deduplicationFailureCount'
    | 'browserDuplicateCount'
    | 'serverDuplicateCount'
    | 'stableServerRetryCount'
    | 'eventIdCollisionCount'
    | 'missingChannelCount'
    | 'pendingFreshnessCount'
  >;
} {
  const findings: MarketingTrackingFinding[] = [];
  const groups = groupDeliveryObservations(
    input.observations,
    input.artifact.windows.correlationSeconds,
  );

  const validPairGroups = new Set<string>();
  let browserDuplicateCount = 0;
  let serverDuplicateCount = 0;
  let stableServerRetryCount = 0;
  let missingChannelCount = 0;
  let pendingFreshnessCount = 0;
  const failedGroups = new Set<string>();
  const terminalByEventId = new Map<string, Set<string>>();

  for (const [groupKey, entries] of groups) {
    const event = entries[0]?.event;
    const logicalEventId = entries[0]?.observation.logicalEventId;
    if (!event || !logicalEventId) continue;
    const browser = terminalDeliveries(entries, 'browser');
    const server = terminalDeliveries(entries, 'server');
    const serverAttempts = entries.filter((entry) => entry.observation.channel === 'server');
    const serverAttemptIds = new Set(
      serverAttempts
        .map((entry) => entry.observation.eventId)
        .filter((value): value is string => Boolean(value)),
    );
    const hasRetrySignal =
      serverAttempts.some((entry) => entry.observation.outcome === 'retried') ||
      new Set(serverAttempts.map((entry) => entry.observation.attempt)).size > 1;
    const eventSegment = stableSegment(event.id);
    const logicalSegment = stableSegment(logicalEventId);
    const groupOccurredAt = entries.map((entry) => Date.parse(entry.observation.occurredAt));
    const firstOccurredAt = Math.min(...groupOccurredAt);
    const latestOccurredAt = Math.max(...groupOccurredAt);
    const groupSegment = stableSegment(new Date(firstOccurredAt).toISOString());
    const deliveryWindowOpen =
      input.now.getTime() - latestOccurredAt <
      input.artifact.windows.deliveryFreshnessSeconds * 1_000;

    if (browser.length > 1) {
      browserDuplicateCount += 1;
      failedGroups.add(groupKey);
      findings.push({
        id: `observations.duplicate.browser.${eventSegment}.${logicalSegment}.${groupSegment}`,
        category: 'duplicate-event',
        severity: 'error',
        title: `${event.name} has duplicate browser deliveries`,
        detail: `${browser.length} successful browser observations were recorded for logical event ${logicalEventId}.`,
        eventName: event.name,
        logicalEventId,
        channel: 'browser',
      });
    }

    if (server.length > 1) {
      serverDuplicateCount += 1;
      failedGroups.add(groupKey);
      findings.push({
        id: `observations.duplicate.server.${eventSegment}.${logicalSegment}.${groupSegment}`,
        category: 'retry-leak',
        severity: 'error',
        title: `${event.name} has multiple successful server deliveries`,
        detail: `${server.length} successful server observations were recorded for logical event ${logicalEventId}; retries must retain one event ID and one provider acceptance.`,
        eventName: event.name,
        logicalEventId,
        channel: 'server',
      });
    } else if (hasRetrySignal && serverAttemptIds.size > 1) {
      serverDuplicateCount += 1;
      failedGroups.add(groupKey);
      findings.push({
        id: `observations.retry.event-id.${eventSegment}.${logicalSegment}.${groupSegment}`,
        category: 'retry-leak',
        severity: 'error',
        title: `${event.name} changed event ID during a server retry`,
        detail: `Server attempts for logical event ${logicalEventId} used ${serverAttemptIds.size} event IDs.`,
        eventName: event.name,
        logicalEventId,
        channel: 'server',
      });
    } else if (
      hasRetrySignal &&
      serverAttemptIds.size === 1 &&
      server.length === 1 &&
      server[0]?.observation.outcome === 'accepted'
    ) {
      stableServerRetryCount += 1;
    } else if (hasRetrySignal && serverAttemptIds.size === 1 && server.length > 0) {
      findings.push({
        id: `observations.retry.uncertain.${eventSegment}.${logicalSegment}.${groupSegment}`,
        category: 'retry-leak',
        severity: 'warning',
        title: `${event.name} retry acceptance is not proven`,
        detail: `Server retries retained one event ID for logical event ${logicalEventId}, but no provider acceptance observation proves the final delivery state.`,
        eventName: event.name,
        logicalEventId,
        channel: 'server',
      });
    }

    const deliveries = [...browser, ...server];
    for (const entry of deliveries) {
      const eventId = entry.observation.eventId;
      if (!eventId) continue;
      const logicalKeys = terminalByEventId.get(eventId) ?? new Set<string>();
      logicalKeys.add(groupKey);
      terminalByEventId.set(eventId, logicalKeys);
    }

    for (const expectedChannel of expectedChannels(event)) {
      const present = expectedChannel === 'browser' ? browser.length > 0 : server.length > 0;
      if (present) continue;
      if (deliveryWindowOpen) {
        pendingFreshnessCount += 1;
        continue;
      }
      missingChannelCount += 1;
      failedGroups.add(groupKey);
      findings.push({
        id: `observations.missing-channel.${eventSegment}.${logicalSegment}.${groupSegment}.${expectedChannel}`,
        category: 'missing-channel',
        severity: 'warning',
        title: `${event.name} is missing its ${expectedChannel} delivery`,
        detail: `Logical event ${logicalEventId} expects ${event.deliveryExpectation} delivery, but no successful ${expectedChannel} observation arrived before the ${input.artifact.windows.deliveryFreshnessSeconds}-second freshness window closed.`,
        eventName: event.name,
        logicalEventId,
        channel: expectedChannel,
      });
    }

    if (
      event.deliveryExpectation === 'browser-and-server' &&
      browser.length === 1 &&
      server.length === 1
    ) {
      const browserEventId = browser[0]?.observation.eventId;
      const serverEventId = server[0]?.observation.eventId;
      if (browserEventId === serverEventId) {
        if (!failedGroups.has(groupKey)) validPairGroups.add(groupKey);
      } else {
        failedGroups.add(groupKey);
        findings.push({
          id: `observations.dedupe.${eventSegment}.${logicalSegment}.${groupSegment}`,
          category: 'deduplication-failure',
          severity: 'error',
          title: `${event.name} browser and server event IDs do not match`,
          detail: `Logical event ${logicalEventId} used browser event ID ${browserEventId ?? 'missing'} and server event ID ${serverEventId ?? 'missing'}.`,
          eventName: event.name,
          logicalEventId,
        });
      }
    }
  }

  let eventIdCollisionCount = 0;
  for (const [eventId, logicalKeys] of terminalByEventId) {
    if (logicalKeys.size <= 1) continue;
    eventIdCollisionCount += 1;
    logicalKeys.forEach((key) => failedGroups.add(key));
    findings.push({
      id: `observations.collision.${stableSegment(eventId)}`,
      category: 'event-id-collision',
      severity: 'error',
      title: `Event ID ${eventId} was reused across logical events`,
      detail: `${logicalKeys.size} different logical event groups share this event ID.`,
      eventId,
    });
  }

  return {
    findings,
    coverage: {
      expectedDualDeliveryEventCount: input.events.filter(
        (event) => event.deliveryExpectation === 'browser-and-server',
      ).length,
      observedLogicalEventCount: groups.size,
      validDeduplicationPairCount: [...validPairGroups].filter(
        (groupKey) => !failedGroups.has(groupKey),
      ).length,
      deduplicationFailureCount: failedGroups.size,
      browserDuplicateCount,
      serverDuplicateCount,
      stableServerRetryCount,
      eventIdCollisionCount,
      missingChannelCount,
      pendingFreshnessCount,
    },
  };
}

export function reconcileMarketingTrackingObservations(input: {
  registries: LoadedMarketingRegistries;
  loaded: LoadedMarketingTrackingObservations;
  projectId: string;
  environment: string;
  now?: Date;
}): {
  coverage: MarketingTrackingCoverage;
  findings: MarketingTrackingFinding[];
  observedEmitters: MarketingTrackingEmitterId[];
  evidenceFreshness: 'fresh' | 'stale' | 'unknown';
  evidenceObservedAt?: string;
} {
  const events = input.registries.events.value.events;
  const conversions = input.registries.conversions.value.conversions;
  const artifact = input.loaded.artifact;
  const observations = artifact?.observations ?? [];
  const findings: MarketingTrackingFinding[] = [];
  const observedEvents = new Set<string>();
  const observedConversions = new Set<string>();
  const resolvedObservations: ResolvedObservation[] = [];
  const now = input.now ?? new Date();
  let staleEvidenceCount = 0;
  let clockSkewCount = 0;
  let evidenceFreshness: 'fresh' | 'stale' | 'unknown' = artifact ? 'fresh' : 'unknown';

  if (!artifact) {
    findings.push({
      id: 'observations.missing',
      category: 'missing-event',
      severity: 'warning',
      title: 'Observed browser and server evidence is not available',
      detail:
        'Source and manifest checks ran, but emitted, suppressed, accepted, retried, and rejected events could not be reconciled.',
      path: input.loaded.path,
    });
  } else {
    if (artifact.projectId !== input.projectId) {
      findings.push({
        id: 'observations.project',
        category: 'project-mismatch',
        severity: 'error',
        title: 'Observation evidence belongs to another project',
        detail: `Expected ${input.projectId}, but the artifact records ${artifact.projectId}.`,
        path: input.loaded.path,
      });
    }
    if (artifact.environment !== input.environment) {
      findings.push({
        id: 'observations.environment',
        category: 'environment-mismatch',
        severity: 'error',
        title: 'Observation evidence belongs to another environment',
        detail: `Expected ${input.environment}, but the artifact records ${artifact.environment}.`,
        path: input.loaded.path,
      });
    }
    const evidenceAgeMs = now.getTime() - Date.parse(artifact.capturedAt);
    if (evidenceAgeMs > artifact.windows.evidenceFreshnessSeconds * 1_000) {
      staleEvidenceCount = 1;
      evidenceFreshness = 'stale';
      findings.push({
        id: 'observations.freshness.stale',
        category: 'stale-evidence',
        severity: 'warning',
        title: 'Tracking observation evidence is stale',
        detail: `The capture is older than its ${artifact.windows.evidenceFreshnessSeconds}-second evidence freshness window.`,
        path: input.loaded.path,
      });
    } else if (evidenceAgeMs < -300_000) {
      clockSkewCount += 1;
      evidenceFreshness = 'unknown';
      findings.push({
        id: 'observations.freshness.future-capture',
        category: 'clock-skew',
        severity: 'warning',
        title: 'Tracking observation capture time is in the future',
        detail: 'The capture clock is more than five minutes ahead of the audit clock.',
        path: input.loaded.path,
      });
    }
  }

  for (const observation of observations) {
    const event = resolveEvent(events, observation.eventName);
    if (!event) {
      findings.push({
        id: `observations.unknown.${observation.eventName}`,
        category: 'unknown-event',
        severity: 'warning',
        title: `Observed event ${observation.eventName} is not declared`,
        detail:
          'The event does not match an event id, canonical name, GTM mapping, or GA4 mapping.',
        eventName: observation.eventName,
      });
      continue;
    }
    resolvedObservations.push({ event, observation });

    if (Date.parse(observation.capture.receivedAt) + 300_000 < Date.parse(observation.occurredAt)) {
      clockSkewCount += 1;
      findings.push({
        id: `observations.clock-skew.${event.id}.${stableSegment(observation.logicalEventId)}`,
        category: 'clock-skew',
        severity: 'warning',
        title: `${event.name} has inconsistent source and receive clocks`,
        detail: 'The receive clock is more than five minutes earlier than the occurrence clock.',
        eventName: event.name,
        logicalEventId: observation.logicalEventId,
      });
    }

    if (observation.environment !== input.environment) {
      findings.push({
        id: `observations.environment.${event.id}.${observation.environment}`,
        category: 'environment-mismatch',
        severity: 'error',
        title: `${event.name} was observed in the wrong environment`,
        detail: `Expected ${input.environment}, but the event records ${observation.environment}.`,
        eventName: event.name,
        logicalEventId: observation.logicalEventId,
      });
    }
    const channels = expectedChannels(event);
    if (!channels.includes(observation.channel)) {
      findings.push({
        id: `observations.channel.${event.id}.${observation.channel}`,
        category: 'invalid-payload',
        severity: 'error',
        title: `${event.name} used the wrong delivery channel`,
        detail: `Expected ${channels.join(' and ')} evidence, but observed ${observation.channel}.`,
        eventName: event.name,
        logicalEventId: observation.logicalEventId,
        channel: observation.channel,
      });
    }
    const expectedEmitters = event.expectedEmitters[observation.channel];
    if (expectedEmitters && !expectedEmitters.includes(observation.emitter)) {
      findings.push({
        id: `observations.emitter.${event.id}.${observation.channel}.${observation.emitter}`,
        category: 'unexpected-emitter',
        severity: 'error',
        title: `${event.name} used an unexpected ${observation.channel} emitter`,
        detail: `Expected ${expectedEmitters.join(', ')}, but observed ${observation.emitter}.`,
        eventName: event.name,
        logicalEventId: observation.logicalEventId,
        channel: observation.channel,
      });
    }
    if (observation.outcome === 'suppressed') {
      findings.push({
        id: `observations.consent.${event.id}.${observation.eventId ?? observation.logicalEventId}`,
        category: 'consent-suppression',
        severity: 'warning',
        title: `${event.name} was suppressed`,
        detail: `Suppression reason code: ${observation.consent.suppressionReasonCode ?? 'unknown'}.`,
        eventName: event.name,
        logicalEventId: observation.logicalEventId,
      });
    }
    if (observation.outcome === 'rejected' || observation.outcome === 'dead') {
      findings.push({
        id: `observations.rejected.${event.id}.${observation.eventId ?? observation.logicalEventId}`,
        category: 'invalid-payload',
        severity: 'error',
        title: `${event.name} was ${observation.outcome}`,
        detail: `Failure message code: ${observation.diagnostics?.messageCode ?? 'unknown'}.`,
        eventName: event.name,
        logicalEventId: observation.logicalEventId,
      });
    }

    for (const property of event.requiredProperties) {
      const evidence = observation.parameterEvidence[property.name];
      if (!evidence || ['absent', 'not-applicable'].includes(evidence.state)) {
        findings.push({
          id: `observations.parameters.${event.id}.${property.name}`,
          category: 'missing-parameter',
          severity: 'error',
          title: `${event.name} is missing ${property.name}`,
          detail: `The required ${property.type} parameter was absent from redacted field-state evidence.`,
          eventName: event.name,
          logicalEventId: observation.logicalEventId,
        });
      } else if (!propertyEvidenceMatches(evidence, property.type)) {
        findings.push({
          id: `observations.payload.${event.id}.${property.name}`,
          category: 'invalid-payload',
          severity: 'error',
          title: `${event.name} has an invalid ${property.name} value`,
          detail: `Expected valid ${property.type} evidence, received state ${evidence.state}${evidence.type ? ` with type ${evidence.type}` : ''}.`,
          eventName: event.name,
          logicalEventId: observation.logicalEventId,
        });
      }
    }

    if (isSuccessfulDelivery(observation)) observedEvents.add(event.id);
    if (observation.conversionId && isSuccessfulDelivery(observation)) {
      observedConversions.add(observation.conversionId);
    }
    for (const conversion of conversions) {
      if (
        conversion.sourceEventId === event.id &&
        isSuccessfulDelivery(observation) &&
        observation.channel === conversion.confirmationSource
      ) {
        observedConversions.add(conversion.id);
      }
    }
  }

  if (artifact) {
    for (const event of events) {
      if (!observedEvents.has(event.id)) {
        findings.push({
          id: `observations.missing.events.${event.id}`,
          category: 'missing-event',
          severity: 'warning',
          title: `${event.name} was not observed`,
          detail: `The expected ${expectedChannels(event).join(' and ')} event has no successful delivery evidence in this capture.`,
          eventName: event.name,
        });
      }
    }
    for (const conversion of conversions) {
      if (!observedConversions.has(conversion.id)) {
        findings.push({
          id: `observations.missing.conversions.${conversion.id}`,
          category: 'missing-event',
          severity: 'warning',
          title: `${conversion.name} was not confirmed`,
          detail: `No ${conversion.confirmationSource} observation confirmed conversion ${conversion.id}.`,
          conversionId: conversion.id,
        });
      }
    }
  }

  const delivery = artifact
    ? classifyDeliveryObservations({
        events,
        observations: resolvedObservations,
        artifact,
        now,
      })
    : {
        findings: [],
        coverage: {
          expectedDualDeliveryEventCount: events.filter(
            (event) => event.deliveryExpectation === 'browser-and-server',
          ).length,
          observedLogicalEventCount: 0,
          validDeduplicationPairCount: 0,
          deduplicationFailureCount: 0,
          browserDuplicateCount: 0,
          serverDuplicateCount: 0,
          stableServerRetryCount: 0,
          eventIdCollisionCount: 0,
          missingChannelCount: 0,
          pendingFreshnessCount: 0,
        },
      };
  findings.push(...delivery.findings);
  return {
    coverage: {
      expectedEventCount: events.length,
      observedEventCount: observedEvents.size,
      expectedConversionCount: conversions.length,
      observedConversionCount: observedConversions.size,
      observationCount: observations.length,
      ...delivery.coverage,
      staleEvidenceCount,
      clockSkewCount,
    },
    findings,
    observedEmitters: [...new Set(observations.map((observation) => observation.emitter))],
    evidenceFreshness,
    ...(artifact ? { evidenceObservedAt: artifact.capturedAt } : {}),
  };
}
