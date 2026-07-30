import type { LoadedMarketingRegistries } from '../registry/load-registries.js';
import type { MarketingConversion } from '../schema/conversion-registry.js';
import type {
  MarketingExecutionContext,
  MarketingProviderAvailability,
} from '../schema/execution-context.js';
import type { MarketingTrackingAuditCheck } from './audit-types.js';

type ProviderId = 'googleAds' | 'metaAds';

function missingMappingStatus(
  state: MarketingProviderAvailability,
): MarketingTrackingAuditCheck['status'] {
  return state === 'connected' ? 'error' : 'warn';
}

function providerEnabled(state: MarketingProviderAvailability): boolean {
  return state !== 'disabled';
}

function checkUniqueValues(args: {
  id: string;
  label: string;
  values: string[];
}): MarketingTrackingAuditCheck[] {
  const checks: MarketingTrackingAuditCheck[] = [];
  const seen = new Set<string>();
  for (const value of args.values) {
    if (seen.has(value)) {
      checks.push({
        id: `${args.id}.${value}`,
        status: 'error',
        message: `Duplicate ${args.label}: ${value}.`,
      });
    }
    seen.add(value);
  }
  if (checks.length === 0) {
    checks.push({
      id: args.id,
      status: 'pass',
      message: `${args.label} values are unique.`,
    });
  }
  return checks;
}

function checkUniqueMetaEvents(args: {
  id: string;
  label: string;
  values: Array<{ value: string; sourceEventId: string }>;
}): MarketingTrackingAuditCheck[] {
  const checks: MarketingTrackingAuditCheck[] = [];
  const sourceEventsByValue = new Map<string, Set<string>>();
  for (const entry of args.values) {
    const sourceEvents = sourceEventsByValue.get(entry.value) ?? new Set<string>();
    sourceEvents.add(entry.sourceEventId);
    sourceEventsByValue.set(entry.value, sourceEvents);
  }
  for (const [value, sourceEvents] of sourceEventsByValue.entries()) {
    if (sourceEvents.size > 1) {
      checks.push({
        id: `${args.id}.${value}`,
        status: 'error',
        message: `Duplicate ${args.label}: ${value}.`,
      });
    }
  }
  if (checks.length === 0) {
    checks.push({
      id: args.id,
      status: 'pass',
      message: `${args.label} values are unique or share the same source event.`,
    });
  }
  return checks;
}

function disabledProviderCheck(provider: ProviderId): MarketingTrackingAuditCheck {
  return {
    id: `providers.${provider}.conversionMappings`,
    status: 'pass',
    message: `${provider} provider is disabled; conversion mapping audit skipped.`,
  };
}

function auditGoogleAdsConversions(
  conversions: MarketingConversion[],
  providerState: MarketingProviderAvailability,
): MarketingTrackingAuditCheck[] {
  if (!providerEnabled(providerState)) return [disabledProviderCheck('googleAds')];
  const checks: MarketingTrackingAuditCheck[] = [];
  const mappedActionNames: string[] = [];

  for (const conversion of conversions) {
    const mapping = conversion.mappings.googleAds;
    if (!mapping) {
      checks.push({
        id: `providers.googleAds.conversions.${conversion.id}.mapping`,
        status: missingMappingStatus(providerState),
        message: `Conversion ${conversion.id} has no Google Ads conversion-action mapping.`,
      });
      continue;
    }
    mappedActionNames.push(mapping.conversionActionName);
    checks.push({
      id: `providers.googleAds.conversions.${conversion.id}.mapping`,
      status: 'pass',
      message: `Conversion ${conversion.id} maps to Google Ads action ${mapping.conversionActionName}.`,
    });
  }

  checks.push(
    ...checkUniqueValues({
      id: 'providers.googleAds.conversionActionNames',
      label: 'Google Ads conversion action name',
      values: mappedActionNames,
    }),
  );
  return checks;
}

function auditMetaConversions(
  conversions: MarketingConversion[],
  providerState: MarketingProviderAvailability,
): MarketingTrackingAuditCheck[] {
  if (!providerEnabled(providerState)) return [disabledProviderCheck('metaAds')];
  const checks: MarketingTrackingAuditCheck[] = [];
  const pixelEventNames: Array<{ value: string; sourceEventId: string }> = [];
  const capiEventNames: Array<{ value: string; sourceEventId: string }> = [];

  for (const conversion of conversions) {
    const mapping = conversion.mappings.meta;
    if (!mapping?.pixelEventName && !mapping?.capiEventName) {
      checks.push({
        id: `providers.metaAds.conversions.${conversion.id}.mapping`,
        status: missingMappingStatus(providerState),
        message: `Conversion ${conversion.id} has no Meta Pixel or CAPI event mapping.`,
      });
      continue;
    }
    if (mapping.pixelEventName) {
      pixelEventNames.push({
        value: mapping.pixelEventName,
        sourceEventId: conversion.sourceEventId,
      });
    }
    if (mapping.capiEventName) {
      capiEventNames.push({
        value: mapping.capiEventName,
        sourceEventId: conversion.sourceEventId,
      });
    }
    checks.push({
      id: `providers.metaAds.conversions.${conversion.id}.mapping`,
      status: 'pass',
      message: `Conversion ${conversion.id} maps to Meta ${[
        mapping.pixelEventName ? `Pixel ${mapping.pixelEventName}` : undefined,
        mapping.capiEventName ? `CAPI ${mapping.capiEventName}` : undefined,
      ]
        .filter(Boolean)
        .join(' and ')}.`,
    });
  }

  checks.push(
    ...checkUniqueMetaEvents({
      id: 'providers.metaAds.pixelEventNames',
      label: 'Meta Pixel event name',
      values: pixelEventNames,
    }),
    ...checkUniqueMetaEvents({
      id: 'providers.metaAds.capiEventNames',
      label: 'Meta CAPI event name',
      values: capiEventNames,
    }),
  );
  return checks;
}

export function auditProviderConversionMappings(args: {
  config: MarketingExecutionContext;
  registries: LoadedMarketingRegistries;
}): MarketingTrackingAuditCheck[] {
  const conversions = args.registries.conversions.value.conversions;
  return [
    ...auditGoogleAdsConversions(conversions, args.config.providers.googleAds.state),
    ...auditMetaConversions(conversions, args.config.providers.metaAds.state),
  ];
}
