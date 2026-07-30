import path from 'node:path';
import { loadMarketingRegistries } from './load-registries.js';
import type { MarketingConversion } from '../schema/conversion-registry.js';
import type { MarketingEvent } from '../schema/event-registry.js';
import type { MarketingExecutionContext } from '../schema/execution-context.js';

export type MarketingRegistryCheckStatus = 'pass' | 'warn' | 'error';

export type MarketingRegistryCheck = {
  id: string;
  status: MarketingRegistryCheckStatus;
  message: string;
  path?: string;
};

export type MarketingRegistryValidationReport = {
  ok: boolean;
  eventRegistryPath?: string;
  conversionRegistryPath?: string;
  eventCount: number;
  conversionCount: number;
  checks: MarketingRegistryCheck[];
};

export type MarketingRegistryValidationOptions = {
  cwd?: string;
  missingStatus?: MarketingRegistryCheckStatus;
};

function checkUniqueIds(collection: { id: string }[], label: string): MarketingRegistryCheck[] {
  const checks: MarketingRegistryCheck[] = [];
  const seen = new Set<string>();
  for (const item of collection) {
    if (seen.has(item.id)) {
      checks.push({
        id: `${label}.duplicate.${item.id}`,
        status: 'error',
        message: `Duplicate ${label} id: ${item.id}.`,
      });
    }
    seen.add(item.id);
  }
  if (checks.length === 0) {
    checks.push({
      id: `${label}.uniqueIds`,
      status: 'pass',
      message: `${label} ids are unique.`,
    });
  }
  return checks;
}

function propertyNameChecks(event: MarketingEvent): MarketingRegistryCheck[] {
  const names = new Set<string>();
  const checks: MarketingRegistryCheck[] = [];
  for (const property of [...event.requiredProperties, ...event.optionalProperties]) {
    if (names.has(property.name)) {
      checks.push({
        id: `events.${event.id}.property.${property.name}`,
        status: 'error',
        message: `Event ${event.id} declares property ${property.name} more than once.`,
      });
    }
    names.add(property.name);
  }
  return checks;
}

function conversionReferenceChecks(
  conversions: MarketingConversion[],
  eventIds: Set<string>,
): MarketingRegistryCheck[] {
  return conversions
    .filter((conversion) => !eventIds.has(conversion.sourceEventId))
    .map((conversion) => ({
      id: `conversions.${conversion.id}.sourceEventId`,
      status: 'error' as const,
      message: `Conversion ${conversion.id} references missing event ${conversion.sourceEventId}.`,
    }));
}

function lifecycleChecks(conversions: MarketingConversion[]): MarketingRegistryCheck[] {
  return conversions.flatMap((conversion) => {
    const checks: MarketingRegistryCheck[] = [];
    if (conversion.lifecycle === 'purchase' && !conversion.transactionIdRule) {
      checks.push({
        id: `conversions.${conversion.id}.transactionIdRule`,
        status: 'error',
        message: `Purchase conversion ${conversion.id} must declare transactionIdRule.`,
      });
    }
    if (
      conversion.lifecycle === 'purchase' &&
      (!conversion.valueRule || !conversion.currencyRule)
    ) {
      checks.push({
        id: `conversions.${conversion.id}.valueCurrencyRule`,
        status: 'error',
        message: `Purchase conversion ${conversion.id} must declare valueRule and currencyRule.`,
      });
    }
    return checks;
  });
}

function platformChecks(
  config: MarketingExecutionContext,
  eventPlatformId: string,
  conversionPlatformId: string,
): MarketingRegistryCheck[] {
  const checks: MarketingRegistryCheck[] = [];
  if (eventPlatformId !== config.platformId) {
    checks.push({
      id: 'events.platformId',
      status: 'error',
      message: `Event registry platformId ${eventPlatformId} does not match ${config.platformId}.`,
    });
  }
  if (conversionPlatformId !== config.platformId) {
    checks.push({
      id: 'conversions.platformId',
      status: 'error',
      message: `Conversion registry platformId ${conversionPlatformId} does not match ${config.platformId}.`,
    });
  }
  if (checks.length === 0) {
    checks.push({
      id: 'registries.platformId',
      status: 'pass',
      message: 'Registry platform ids match marketing config.',
    });
  }
  return checks;
}

export async function validateMarketingRegistries(
  config: MarketingExecutionContext,
  options: MarketingRegistryValidationOptions = {},
): Promise<MarketingRegistryValidationReport> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const missingStatus = options.missingStatus ?? 'error';

  try {
    const loaded = await loadMarketingRegistries(config, { cwd });
    const events = loaded.events.value.events;
    const conversions = loaded.conversions.value.conversions;
    const eventIds = new Set(events.map((event) => event.id));
    const checks: MarketingRegistryCheck[] = [
      {
        id: 'events.registry',
        status: 'pass',
        message: `Loaded ${events.length} marketing events.`,
        path: loaded.events.path,
      },
      {
        id: 'conversions.registry',
        status: 'pass',
        message: `Loaded ${conversions.length} marketing conversions.`,
        path: loaded.conversions.path,
      },
      ...platformChecks(
        config,
        loaded.events.value.platformId,
        loaded.conversions.value.platformId,
      ),
      ...checkUniqueIds(events, 'events'),
      ...checkUniqueIds(conversions, 'conversions'),
      ...events.flatMap(propertyNameChecks),
      ...conversionReferenceChecks(conversions, eventIds),
      ...lifecycleChecks(conversions),
    ];

    return {
      ok: checks.every((check) => check.status !== 'error'),
      eventRegistryPath: loaded.events.path,
      conversionRegistryPath: loaded.conversions.path,
      eventCount: events.length,
      conversionCount: conversions.length,
      checks,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown marketing registry error';
    return {
      ok: missingStatus !== 'error',
      eventCount: 0,
      conversionCount: 0,
      checks: [
        {
          id: 'registries.load',
          status: missingStatus,
          message,
        },
      ],
    };
  }
}
