import {
  marketingTrackingIdentityDigestSchema,
  marketingTrackingObservationArtifactSchema,
  marketingTrackingObservationSchema,
  type MarketingTrackingObservation,
  type MarketingTrackingObservationArtifact,
} from '../contracts/tracking-observation';

export type TrackingObservationIdentityInput = {
  observationId: string;
  logicalEventId: string;
  eventId?: string;
  canonicalCorrelationId?: string;
  transactionReference?: string;
};

export type TrackingObservationRecordInput = TrackingObservationIdentityInput & {
  eventName: string;
  conversionId?: string;
  occurredAt: string;
  outcome: MarketingTrackingObservation['outcome'];
  attempt?: number;
  receivedAt?: string;
  consent: MarketingTrackingObservation['consent'];
  parameterEvidence?: MarketingTrackingObservation['parameterEvidence'];
  commerce?: MarketingTrackingObservation['commerce'];
  customerFields?: MarketingTrackingObservation['customerFields'];
  transportFields?: MarketingTrackingObservation['transportFields'];
  providerReference?: MarketingTrackingObservation['providerReference'];
  diagnostics?: MarketingTrackingObservation['diagnostics'];
};

export type TrackingObservationSinkResult = {
  status: 'recorded' | 'replayed';
  observationId: string;
};

export type TrackingObservationSink = {
  record: (
    observation: MarketingTrackingObservation,
  ) => Promise<TrackingObservationSinkResult> | TrackingObservationSinkResult;
};

export type TrackingObservationIdentityDigester = (value: string) => Promise<string>;

export type TrackingObservationAdapter = {
  record: (input: TrackingObservationRecordInput) => Promise<{
    observation: MarketingTrackingObservation;
    result: TrackingObservationSinkResult;
  }>;
};

type TrackingObservationAdapterConfig = {
  projectId: string;
  environment: string;
  emitter: MarketingTrackingObservation['emitter'];
  sink: TrackingObservationSink;
  now?: () => Date;
  schemaVersion?: number;
  provenance?: MarketingTrackingObservation['capture']['provenance'];
  digestIdentity?: TrackingObservationIdentityDigester;
};

type SourceAdapterConfig = TrackingObservationAdapterConfig & {
  channel: MarketingTrackingObservation['channel'];
  source: MarketingTrackingObservation['capture']['source'];
};

export type BrowserTrackingObservationAdapterConfig = Omit<
  TrackingObservationAdapterConfig,
  'emitter'
> & {
  emitter?: MarketingTrackingObservation['emitter'];
};

export type ServerTrackingObservationAdapterConfig = Omit<
  TrackingObservationAdapterConfig,
  'emitter'
> & {
  emitter?: MarketingTrackingObservation['emitter'];
};

export type ConsentTrackingObservationAdapterConfig = TrackingObservationAdapterConfig & {
  channel: MarketingTrackingObservation['channel'];
};

export async function digestTrackingObservationIdentity(value: string): Promise<string> {
  const normalized = value.trim();
  if (!normalized) throw new Error('Tracking observation identity is required.');
  const existingDigest = marketingTrackingIdentityDigestSchema.safeParse(normalized);
  if (existingDigest.success) return existingDigest.data;

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      'Web Crypto is required to digest tracking observation identities before emission.',
    );
  }
  const bytes = new TextEncoder().encode(normalized);
  const digest = await subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return marketingTrackingIdentityDigestSchema.parse(`sha256:${hex}`);
}

function defaultCommerceEvidence(): MarketingTrackingObservation['commerce'] {
  return {
    value: 'not-applicable',
    currency: 'not-applicable',
    catalog: 'not-applicable',
  };
}

function createTrackingObservationAdapter(config: SourceAdapterConfig): TrackingObservationAdapter {
  const now = config.now ?? (() => new Date());
  const digestIdentity = config.digestIdentity ?? digestTrackingObservationIdentity;

  return {
    async record(input) {
      const [observationId, logicalEventId, eventId, canonicalCorrelationId, transactionReference] =
        await Promise.all([
          digestIdentity(input.observationId),
          digestIdentity(input.logicalEventId),
          input.eventId ? digestIdentity(input.eventId) : undefined,
          input.canonicalCorrelationId ? digestIdentity(input.canonicalCorrelationId) : undefined,
          input.transactionReference ? digestIdentity(input.transactionReference) : undefined,
        ]);
      const observation = marketingTrackingObservationSchema.parse({
        projectId: config.projectId,
        observationId,
        logicalEventId,
        eventName: input.eventName,
        eventId,
        conversionId: input.conversionId,
        canonicalCorrelationId,
        transactionReference,
        channel: config.channel,
        emitter: config.emitter,
        environment: config.environment,
        occurredAt: input.occurredAt,
        outcome: input.outcome,
        attempt: input.attempt ?? 1,
        consent: input.consent,
        parameterEvidence: input.parameterEvidence ?? {},
        commerce: input.commerce ?? defaultCommerceEvidence(),
        customerFields: input.customerFields ?? {},
        transportFields: input.transportFields ?? {},
        capture: {
          source: config.source,
          schemaVersion: config.schemaVersion ?? 2,
          provenance: config.provenance ?? 'adopter-reported',
          receivedAt: input.receivedAt ?? now().toISOString(),
        },
        providerReference: input.providerReference,
        diagnostics: input.diagnostics,
      });
      return {
        observation,
        result: await config.sink.record(observation),
      };
    },
  };
}

export function createBrowserTrackingObservationAdapter(
  config: BrowserTrackingObservationAdapterConfig,
): TrackingObservationAdapter {
  return createTrackingObservationAdapter({
    ...config,
    channel: 'browser',
    source: 'browser-adapter',
    emitter: config.emitter ?? 'web-runtime',
  });
}

export function createServerTrackingObservationAdapter(
  config: ServerTrackingObservationAdapterConfig,
): TrackingObservationAdapter {
  return createTrackingObservationAdapter({
    ...config,
    channel: 'server',
    source: 'server-adapter',
    emitter: config.emitter ?? 'other',
  });
}

export function createOutboxTrackingObservationAdapter(
  config: ServerTrackingObservationAdapterConfig,
): TrackingObservationAdapter {
  return createTrackingObservationAdapter({
    ...config,
    channel: 'server',
    source: 'outbox-adapter',
    emitter: config.emitter ?? 'other',
  });
}

export function createConsentTrackingObservationAdapter(
  config: ConsentTrackingObservationAdapterConfig,
): TrackingObservationAdapter {
  return createTrackingObservationAdapter({
    ...config,
    source: 'consent-adapter',
  });
}

function canonicalize(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalize(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export type InMemoryTrackingObservationSink = TrackingObservationSink & {
  list: () => MarketingTrackingObservation[];
  artifact: (options?: {
    capturedAt?: string;
    windows?: Partial<MarketingTrackingObservationArtifact['windows']>;
  }) => MarketingTrackingObservationArtifact;
  reset: () => void;
};

export function createInMemoryTrackingObservationSink(config: {
  projectId: string;
  environment: string;
  now?: () => Date;
}): InMemoryTrackingObservationSink {
  const records = new Map<
    string,
    { canonical: string; observation: MarketingTrackingObservation }
  >();
  const now = config.now ?? (() => new Date());

  return {
    record(input) {
      const observation = marketingTrackingObservationSchema.parse(input);
      marketingTrackingObservationArtifactSchema.parse({
        kind: 'unisane.growth.tracking-observations',
        version: 2,
        projectId: config.projectId,
        environment: config.environment,
        capturedAt: observation.capture.receivedAt,
        observations: [observation],
      });
      const canonical = canonicalize(observation);
      const existing = records.get(observation.observationId);
      if (existing) {
        if (existing.canonical !== canonical) {
          throw new Error(
            '[TRACKING_OBSERVATION_IDEMPOTENCY_COLLISION] An observationId was replayed with different evidence.',
          );
        }
        return { status: 'replayed', observationId: observation.observationId };
      }
      records.set(observation.observationId, { canonical, observation });
      return { status: 'recorded', observationId: observation.observationId };
    },
    list() {
      return [...records.values()].map(({ observation }) => observation);
    },
    artifact(options = {}) {
      return marketingTrackingObservationArtifactSchema.parse({
        kind: 'unisane.growth.tracking-observations',
        version: 2,
        projectId: config.projectId,
        environment: config.environment,
        capturedAt: options.capturedAt ?? now().toISOString(),
        windows: options.windows ?? {},
        observations: [...records.values()].map(({ observation }) => observation),
      });
    },
    reset() {
      records.clear();
    },
  };
}
