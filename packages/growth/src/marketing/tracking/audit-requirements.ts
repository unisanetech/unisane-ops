import type { LoadedMarketingRegistries } from '../registry/load-registries.js';
import type { MarketingConversion } from '../schema/conversion-registry.js';
import type { MarketingEvent } from '../schema/event-registry.js';
import type { MarketingTrackingAuditCheck, SourceFile } from './audit-types.js';

const VALUE_GOALS = new Set(['purchase', 'refund']);

function filesWithLiteral(files: SourceFile[], literal: string): SourceFile[] {
  return files.filter((file) => file.source.includes(literal));
}

function sourcesContain(files: SourceFile[], token: string): boolean {
  return files.some((file) => file.source.includes(token));
}

function checkSourceToken(input: {
  id: string;
  label: string;
  files: SourceFile[];
  token: string;
  missingStatus: 'warn' | 'error';
}): MarketingTrackingAuditCheck {
  return {
    id: input.id,
    status: sourcesContain(input.files, input.token) ? 'pass' : input.missingStatus,
    message: sourcesContain(input.files, input.token)
      ? `${input.label} source includes ${input.token}.`
      : `${input.label} source does not show ${input.token}.`,
    path: input.files[0]?.path,
  };
}

function sourceEventForConversion(
  events: readonly MarketingEvent[],
  conversion: MarketingConversion,
): MarketingEvent | undefined {
  return events.find((event) => event.id === conversion.sourceEventId);
}

function hasProviderConversionMapping(conversion: MarketingConversion): boolean {
  return Boolean(conversion.mappings.googleAds || conversion.mappings.meta);
}

function requiresValueCurrency(conversion: MarketingConversion): boolean {
  return (
    VALUE_GOALS.has(conversion.goal) || Boolean(conversion.valueRule || conversion.currencyRule)
  );
}

function eventRequirementChecks(
  event: MarketingEvent,
  files: SourceFile[],
): MarketingTrackingAuditCheck[] {
  const checks: MarketingTrackingAuditCheck[] = [];
  if (!event.dedupeRule) {
    checks.push({
      id: `events.${event.id}.dedupeRule`,
      status: event.source === 'server' ? 'error' : 'warn',
      message: `Event ${event.id} does not declare a dedupe rule.`,
    });
  }

  if (event.source === 'browser') {
    const eventFiles = filesWithLiteral(files, event.name);
    if (eventFiles.length) {
      checks.push(
        checkSourceToken({
          id: `events.${event.id}.eventId.source`,
          label: `Browser event ${event.name}`,
          files: eventFiles,
          token: 'eventId',
          missingStatus: 'warn',
        }),
      );
      if (event.dedupeRule) {
        checks.push(
          checkSourceToken({
            id: `events.${event.id}.dedupe.source`,
            label: `Browser event ${event.name}`,
            files: eventFiles,
            token: 'dedupe',
            missingStatus: sourcesContain(eventFiles, 'createWebTrackingEventId') ? 'warn' : 'warn',
          }),
        );
      }
    }
  }

  if (
    event.transactionIdRule &&
    !event.requiredProperties.some((prop) => prop.name === 'transactionId')
  ) {
    checks.push({
      id: `events.${event.id}.transactionId.requiredProperty`,
      status: 'error',
      message: `Event ${event.id} has transactionIdRule but transactionId is not a required property.`,
    });
  }
  if (event.valueRule && !event.requiredProperties.some((prop) => prop.name === 'value')) {
    checks.push({
      id: `events.${event.id}.value.requiredProperty`,
      status: 'error',
      message: `Event ${event.id} has valueRule but value is not a required property.`,
    });
  }
  if (event.currencyRule && !event.requiredProperties.some((prop) => prop.name === 'currency')) {
    checks.push({
      id: `events.${event.id}.currency.requiredProperty`,
      status: 'error',
      message: `Event ${event.id} has currencyRule but currency is not a required property.`,
    });
  }

  return checks;
}

function conversionRequirementChecks(input: {
  conversion: MarketingConversion;
  sourceEvent?: MarketingEvent;
  files: SourceFile[];
}): MarketingTrackingAuditCheck[] {
  const { conversion, sourceEvent, files } = input;
  const checks: MarketingTrackingAuditCheck[] = [];
  const conversionFiles = filesWithLiteral(files, conversion.sourceEventId);

  if (!sourceEvent) {
    return [
      {
        id: `conversions.${conversion.id}.sourceEvent`,
        status: 'error',
        message: `Conversion ${conversion.id} references missing source event ${conversion.sourceEventId}.`,
      },
    ];
  }

  if (hasProviderConversionMapping(conversion) && !sourceEvent.consent.categories.includes('ads')) {
    checks.push({
      id: `conversions.${conversion.id}.adsConsent`,
      status: 'error',
      message: `Conversion ${conversion.id} maps to ads providers but source event consent does not include ads.`,
    });
  } else if (hasProviderConversionMapping(conversion)) {
    checks.push({
      id: `conversions.${conversion.id}.adsConsent`,
      status: 'pass',
      message: `Conversion ${conversion.id} source event consent includes ads.`,
    });
  }

  if (!sourceEvent.dedupeRule) {
    checks.push({
      id: `conversions.${conversion.id}.sourceDedupeRule`,
      status: 'error',
      message: `Conversion ${conversion.id} source event ${sourceEvent.id} does not declare a dedupe rule.`,
    });
  }

  if (conversionFiles.length > 0 && conversion.confirmationSource === 'server') {
    checks.push(
      checkSourceToken({
        id: `conversions.${conversion.id}.eventId.source`,
        label: `Server conversion ${conversion.sourceEventId}`,
        files: conversionFiles,
        token: 'eventId',
        missingStatus: 'error',
      }),
    );
  }

  if (conversionFiles.length > 0 && conversion.transactionIdRule) {
    checks.push(
      checkSourceToken({
        id: `conversions.${conversion.id}.transactionId.source`,
        label: `Conversion ${conversion.sourceEventId}`,
        files: conversionFiles,
        token: 'transactionId',
        missingStatus: 'error',
      }),
    );
  }

  if (requiresValueCurrency(conversion)) {
    if (!conversion.valueRule) {
      checks.push({
        id: `conversions.${conversion.id}.valueRule`,
        status: 'error',
        message: `Conversion ${conversion.id} requires value but does not declare valueRule.`,
      });
    }
    if (!conversion.currencyRule) {
      checks.push({
        id: `conversions.${conversion.id}.currencyRule`,
        status: 'error',
        message: `Conversion ${conversion.id} requires currency but does not declare currencyRule.`,
      });
    }
    if (conversionFiles.length > 0) {
      checks.push(
        checkSourceToken({
          id: `conversions.${conversion.id}.value.source`,
          label: `Value conversion ${conversion.sourceEventId}`,
          files: conversionFiles,
          token: 'value',
          missingStatus: 'error',
        }),
        checkSourceToken({
          id: `conversions.${conversion.id}.currency.source`,
          label: `Value conversion ${conversion.sourceEventId}`,
          files: conversionFiles,
          token: 'currency',
          missingStatus: 'error',
        }),
      );
    }
  }

  return checks;
}

export function auditTrackingRequirements(input: {
  registries: LoadedMarketingRegistries;
  files: SourceFile[];
}): MarketingTrackingAuditCheck[] {
  const events = input.registries.events.value.events;
  const conversions = input.registries.conversions.value.conversions;
  const checks = [
    ...events.flatMap((event) => eventRequirementChecks(event, input.files)),
    ...conversions.flatMap((conversion) =>
      conversionRequirementChecks({
        conversion,
        sourceEvent: sourceEventForConversion(events, conversion),
        files: input.files,
      }),
    ),
  ];

  return checks.length
    ? checks
    : [
        {
          id: 'requirements.none',
          status: 'pass',
          message: 'No additional tracking requirement checks were needed.',
        },
      ];
}
