import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  marketingProviderReportArtifactSchema,
  type MarketingProviderReportArtifact,
  type MarketingProviderReportRecord,
  type MarketingProviderReportType,
  type MarketingReportMetrics,
  type MarketingReportProvider,
} from '../schema/report.js';
import { ensureMarketingHistoryCatalog } from './catalog.js';
import type {
  MarketingHistoryObservation,
  MarketingHistoryReportWindow,
  MarketingHistoryReportWindowResult,
} from './contracts.js';

const DAY_MS = 86_400_000;

function activeObservations(observations: MarketingHistoryObservation[]) {
  const superseded = new Set(
    observations
      .map((observation) => observation.supersedesObservationId)
      .filter((id): id is string => id !== undefined),
  );
  return observations.filter((observation) => !superseded.has(observation.id));
}

function daysBetween(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  let cursor = Date.parse(`${startDate}T00:00:00.000Z`);
  const end = Date.parse(`${endDate}T00:00:00.000Z`);
  while (cursor <= end) {
    days.push(new Date(cursor).toISOString().slice(0, 10));
    cursor += DAY_MS;
  }
  return days;
}

type ObservationSelection = {
  observations: MarketingHistoryObservation[];
  coveredDayCount: number;
  partialCount: number;
  fixtureCount: number;
  freshness: number;
};

function betterSelection(
  left: ObservationSelection,
  right: ObservationSelection,
): ObservationSelection {
  if (left.coveredDayCount !== right.coveredDayCount) {
    return left.coveredDayCount > right.coveredDayCount ? left : right;
  }
  if (left.partialCount !== right.partialCount) {
    return left.partialCount < right.partialCount ? left : right;
  }
  if (left.observations.length !== right.observations.length) {
    return left.observations.length > right.observations.length ? left : right;
  }
  if (left.fixtureCount !== right.fixtureCount) {
    return left.fixtureCount < right.fixtureCount ? left : right;
  }
  return left.freshness >= right.freshness ? left : right;
}

export function selectNonOverlappingHistoryObservations(input: {
  observations: MarketingHistoryObservation[];
  window: MarketingHistoryReportWindow;
}): MarketingHistoryObservation[] {
  const days = daysBetween(input.window.startDate, input.window.endDate);
  const dayIndex = new Map(days.map((day, index) => [day, index]));
  const observationsByStart = new Map<string, MarketingHistoryObservation[]>();
  for (const observation of input.observations) {
    if (
      observation.window.startDate < input.window.startDate ||
      observation.window.endDate > input.window.endDate
    ) {
      continue;
    }
    const entries = observationsByStart.get(observation.window.startDate) ?? [];
    entries.push(observation);
    observationsByStart.set(observation.window.startDate, entries);
  }
  const empty: ObservationSelection = {
    observations: [],
    coveredDayCount: 0,
    partialCount: 0,
    fixtureCount: 0,
    freshness: 0,
  };
  const selections: ObservationSelection[] = Array.from({ length: days.length + 1 });
  selections[days.length] = empty;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    let best = selections[index + 1]!;
    for (const observation of observationsByStart.get(days[index]!) ?? []) {
      const endIndex = dayIndex.get(observation.window.endDate);
      if (endIndex === undefined || endIndex < index) continue;
      const remainder = selections[endIndex + 1]!;
      best = betterSelection(best, {
        observations: [observation, ...remainder.observations],
        coveredDayCount: endIndex - index + 1 + remainder.coveredDayCount,
        partialCount: Number(observation.partial) + remainder.partialCount,
        fixtureCount: Number(observation.source === 'fixture') + remainder.fixtureCount,
        freshness: Date.parse(observation.pulledAt) + remainder.freshness,
      });
    }
    selections[index] = best;
  }
  return selections[0]!.observations;
}

function recordKey(record: MarketingProviderReportRecord): string {
  const identity =
    record.conversionId ??
    record.creativeId ??
    record.adId ??
    record.adSetId ??
    record.adGroupId ??
    record.campaignId ??
    record.query ??
    record.pageUrl ??
    record.sourceMedium ??
    record.channel ??
    record.country ??
    record.device ??
    record.searchAppearance ??
    record.keyword ??
    record.id;
  return [record.level, identity, record.pageUrl ?? '', record.query ?? ''].join(':');
}

function addMetrics(target: MarketingReportMetrics, source: MarketingReportMetrics): void {
  for (const key of [
    'impressions',
    'clicks',
    'cost',
    'conversions',
    'conversionValue',
    'revenue',
    'margin',
    'sessions',
    'users',
    'keyEvents',
    'purchases',
  ] as const) {
    const value = source[key];
    if (value !== undefined) target[key] = (target[key] ?? 0) + value;
  }
}

function aggregateRecords(artifacts: MarketingProviderReportArtifact[]) {
  const records = new Map<
    string,
    { record: MarketingProviderReportRecord; positionWeight: number; weightedPosition: number }
  >();
  for (const artifact of artifacts) {
    for (const record of artifact.records) {
      const key = recordKey(record);
      const existing = records.get(key);
      const metrics: MarketingReportMetrics = { ...(existing?.record.metrics ?? {}) };
      addMetrics(metrics, record.metrics);
      const positionWeight = record.metrics.impressions ?? 1;
      records.set(key, {
        record: { ...(existing?.record ?? record), ...record, metrics },
        positionWeight:
          (existing?.positionWeight ?? 0) + (record.position === undefined ? 0 : positionWeight),
        weightedPosition:
          (existing?.weightedPosition ?? 0) +
          (record.position === undefined ? 0 : record.position * positionWeight),
      });
    }
  }
  return [...records.values()].map(({ record, positionWeight, weightedPosition }) => {
    const clicks = record.metrics.clicks;
    const impressions = record.metrics.impressions;
    return {
      ...record,
      ...(clicks !== undefined && impressions ? { ctr: clicks / impressions } : {}),
      ...(positionWeight > 0 ? { position: weightedPosition / positionWeight } : {}),
    };
  });
}

export function readMarketingHistoryReportWindow(input: {
  cwd: string;
  provider: MarketingReportProvider;
  reportType: MarketingProviderReportType;
  window: MarketingHistoryReportWindow;
}): MarketingHistoryReportWindowResult {
  if (input.window.startDate > input.window.endDate) {
    return { status: 'unavailable', reason: 'The start date must not be after the end date.' };
  }
  const catalog = ensureMarketingHistoryCatalog(path.resolve(input.cwd));
  const candidates = activeObservations(catalog.observations)
    .filter(
      (observation) =>
        observation.provider === input.provider &&
        observation.reportType === input.reportType &&
        observation.window.startDate >= input.window.startDate &&
        observation.window.endDate <= input.window.endDate,
    )
    .sort(
      (left, right) =>
        left.window.startDate.localeCompare(right.window.startDate) ||
        left.window.endDate.localeCompare(right.window.endDate),
    );
  const selected = selectNonOverlappingHistoryObservations({
    observations: candidates,
    window: input.window,
  });
  const expectedDays = daysBetween(input.window.startDate, input.window.endDate);
  if (selected.length === 0) {
    return {
      status: 'unavailable',
      reason: 'No local provider evidence is available for this range.',
    };
  }
  const covered = new Set<string>();
  for (const observation of selected) {
    for (const day of daysBetween(observation.window.startDate, observation.window.endDate)) {
      covered.add(day);
    }
  }
  const coverageDays = expectedDays.filter((day) => covered.has(day)).length;
  const artifactPaths = selected.map((observation) =>
    path.resolve(input.cwd, observation.artifactPath),
  );
  if (artifactPaths.some((artifactPath) => !existsSync(artifactPath))) {
    return { status: 'unavailable', reason: 'One or more indexed report artifacts are missing.' };
  }
  const artifacts = artifactPaths.map((artifactPath) =>
    marketingProviderReportArtifactSchema.parse(JSON.parse(readFileSync(artifactPath, 'utf8'))),
  );
  const accountIds = new Set(artifacts.map((artifact) => artifact.accountId ?? 'unspecified'));
  if (accountIds.size > 1) {
    return { status: 'unavailable', reason: 'Reports in this range refer to different accounts.' };
  }
  const timeZones = new Set(artifacts.map((artifact) => artifact.window.timeZone ?? 'unspecified'));
  if (timeZones.size > 1) {
    return { status: 'unavailable', reason: 'Reports in this range use different time zones.' };
  }
  const currencies = new Set(
    artifacts.flatMap((artifact) =>
      artifact.records.map((record) => record.currency ?? 'unspecified'),
    ),
  );
  if (currencies.size > 1) {
    return { status: 'unavailable', reason: 'Reports in this range use different currencies.' };
  }
  const latest = artifacts.at(-1)!;
  const partial =
    coverageDays < expectedDays.length || artifacts.some((artifact) => artifact.partial);
  const artifact = marketingProviderReportArtifactSchema.parse({
    ...latest,
    pulledAt: artifacts
      .map((artifact) => artifact.pulledAt)
      .sort()
      .at(-1),
    window: {
      ...input.window,
      ...(latest.window.timeZone ? { timeZone: latest.window.timeZone } : {}),
    },
    source: artifacts.some((artifact) => artifact.source === 'fixture') ? 'fixture' : latest.source,
    partial,
    records: aggregateRecords(artifacts),
  });
  if (partial) {
    return {
      status: 'partial',
      artifact,
      artifactPaths,
      coverageDays,
      expectedDays: expectedDays.length,
      reason: `Data is available for ${coverageDays} of ${expectedDays.length} days in this range.`,
    };
  }
  return {
    status: 'available',
    artifact,
    artifactPaths,
    coverageDays,
    expectedDays: expectedDays.length,
  };
}
