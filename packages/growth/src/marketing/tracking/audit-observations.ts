import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { LoadedMarketingRegistries } from '../registry/load-registries.js';
import type { MarketingEvent } from '../schema/event-registry.js';
import type {
  MarketingTrackingCoverage,
  MarketingTrackingEmitterId,
  MarketingTrackingFinding,
} from './audit-types.js';

const observationSchema = z.object({
  eventName: z.string().min(1),
  eventId: z.string().min(1).optional(),
  conversionId: z.string().min(1).optional(),
  channel: z.enum(['browser', 'server']),
  emitter: z.enum(['web-runtime', 'gtm', 'gtag', 'meta-pixel', 'meta-capi', 'google-ads', 'other']),
  environment: z.string().min(1).optional(),
  outcome: z.enum(['emitted', 'suppressed', 'rejected']).default('emitted'),
  reason: z.string().min(1).optional(),
  payload: z.record(z.unknown()).default({}),
  observedAt: z.string().datetime({ offset: true }).optional(),
});

export const marketingTrackingObservationArtifactSchema = z.object({
  kind: z.literal('unisane.growth.tracking-observations'),
  version: z.literal(1),
  environment: z.string().min(1),
  capturedAt: z.string().datetime({ offset: true }),
  observations: z.array(observationSchema),
});

export type MarketingTrackingObservation = z.infer<typeof observationSchema>;
export type MarketingTrackingObservationArtifact = z.infer<
  typeof marketingTrackingObservationArtifactSchema
>;

export type LoadedMarketingTrackingObservations = {
  path?: string;
  artifact?: MarketingTrackingObservationArtifact;
};

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
  return {
    path: resolvedPath,
    artifact: marketingTrackingObservationArtifactSchema.parse(
      JSON.parse(readFileSync(resolvedPath, 'utf8')) as unknown,
    ),
  };
}

function expectedChannel(event: MarketingEvent): 'browser' | 'server' {
  return event.source === 'browser' ? 'browser' : 'server';
}

function propertyTypeMatches(
  value: unknown,
  type: MarketingEvent['requiredProperties'][number]['type'],
) {
  if (type === 'array') return Array.isArray(value);
  if (type === 'object')
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  return typeof value === type;
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

function duplicateFindings(
  observations: readonly MarketingTrackingObservation[],
): MarketingTrackingFinding[] {
  const byEventId = new Map<string, MarketingTrackingObservation[]>();
  for (const observation of observations) {
    if (!observation.eventId || observation.outcome !== 'emitted') continue;
    const entries = byEventId.get(observation.eventId) ?? [];
    entries.push(observation);
    byEventId.set(observation.eventId, entries);
  }
  return [...byEventId.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([eventId, entries]) => ({
      id: `observations.duplicate.${eventId}`,
      category: 'duplicate-event' as const,
      severity: 'error' as const,
      title: `Event ${entries[0]?.eventName ?? eventId} was emitted more than once`,
      detail: `${entries.length} emitted observations share event id ${eventId}; emitters: ${[
        ...new Set(entries.map((entry) => entry.emitter)),
      ].join(', ')}.`,
      eventName: entries[0]?.eventName,
    }));
}

export function reconcileMarketingTrackingObservations(input: {
  registries: LoadedMarketingRegistries;
  loaded: LoadedMarketingTrackingObservations;
  environment: string;
}): {
  coverage: MarketingTrackingCoverage;
  findings: MarketingTrackingFinding[];
  observedEmitters: MarketingTrackingEmitterId[];
} {
  const events = input.registries.events.value.events;
  const conversions = input.registries.conversions.value.conversions;
  const artifact = input.loaded.artifact;
  const observations = artifact?.observations ?? [];
  const findings: MarketingTrackingFinding[] = [];
  const observedEvents = new Set<string>();
  const observedConversions = new Set<string>();

  if (!artifact) {
    findings.push({
      id: 'observations.missing',
      category: 'missing-event',
      severity: 'warning',
      title: 'Observed browser and server evidence is not available',
      detail:
        'Source and manifest checks ran, but emitted, suppressed, and rejected events could not be reconciled.',
      path: input.loaded.path,
    });
  } else if (artifact.environment !== input.environment) {
    findings.push({
      id: 'observations.environment',
      category: 'environment-mismatch',
      severity: 'error',
      title: 'Observation evidence belongs to another environment',
      detail: `Expected ${input.environment}, but the artifact records ${artifact.environment}.`,
      path: input.loaded.path,
    });
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

    if (observation.environment && observation.environment !== input.environment) {
      findings.push({
        id: `observations.environment.${event.id}.${observation.environment}`,
        category: 'environment-mismatch',
        severity: 'error',
        title: `${event.name} was observed in the wrong environment`,
        detail: `Expected ${input.environment}, but the event records ${observation.environment}.`,
        eventName: event.name,
      });
    }
    if (observation.channel !== expectedChannel(event)) {
      findings.push({
        id: `observations.channel.${event.id}.${observation.channel}`,
        category: 'invalid-payload',
        severity: 'error',
        title: `${event.name} used the wrong delivery channel`,
        detail: `Expected ${expectedChannel(event)} evidence, but observed ${observation.channel}.`,
        eventName: event.name,
      });
    }
    if (observation.outcome === 'suppressed') {
      findings.push({
        id: `observations.consent.${event.id}.${observation.eventId ?? 'unknown'}`,
        category: 'consent-suppression',
        severity: 'warning',
        title: `${event.name} was suppressed`,
        detail: observation.reason ?? 'The observation did not include the suppression reason.',
        eventName: event.name,
      });
    }
    if (observation.outcome === 'rejected') {
      findings.push({
        id: `observations.rejected.${event.id}.${observation.eventId ?? 'unknown'}`,
        category: 'invalid-payload',
        severity: 'error',
        title: `${event.name} was rejected`,
        detail: observation.reason ?? 'The observation did not include the rejection reason.',
        eventName: event.name,
      });
    }

    for (const property of event.requiredProperties) {
      if (!(property.name in observation.payload)) {
        findings.push({
          id: `observations.parameters.${event.id}.${property.name}`,
          category: 'missing-parameter',
          severity: 'error',
          title: `${event.name} is missing ${property.name}`,
          detail: `The required ${property.type} parameter was not present in observed payload evidence.`,
          eventName: event.name,
        });
      } else if (!propertyTypeMatches(observation.payload[property.name], property.type)) {
        findings.push({
          id: `observations.payload.${event.id}.${property.name}`,
          category: 'invalid-payload',
          severity: 'error',
          title: `${event.name} has an invalid ${property.name} value`,
          detail: `Expected ${property.type}, received ${typeof observation.payload[property.name]}.`,
          eventName: event.name,
        });
      }
    }

    if (observation.outcome === 'emitted') observedEvents.add(event.id);
    if (observation.conversionId) observedConversions.add(observation.conversionId);
    for (const conversion of conversions) {
      if (
        conversion.sourceEventId === event.id &&
        observation.outcome === 'emitted' &&
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
          detail: `The expected ${expectedChannel(event)} event has no emitted evidence in this capture.`,
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

  findings.push(...duplicateFindings(observations));
  return {
    coverage: {
      expectedEventCount: events.length,
      observedEventCount: observedEvents.size,
      expectedConversionCount: conversions.length,
      observedConversionCount: observedConversions.size,
      observationCount: observations.length,
    },
    findings,
    observedEmitters: [...new Set(observations.map((observation) => observation.emitter))],
  };
}
