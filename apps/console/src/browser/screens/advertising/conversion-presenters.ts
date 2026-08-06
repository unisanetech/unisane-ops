import type { MarketingConsoleAdvertisingConversion } from '@unisane/growth/console';

export function conversionMeasurementLabel(
  conversion: MarketingConsoleAdvertisingConversion,
): string {
  if (conversion.conversions === undefined) return 'Configured only';
  if (conversion.conversions === 0) return 'No outcomes';
  return 'Measured';
}

export function conversionMeasurementColor(
  conversion: MarketingConsoleAdvertisingConversion,
): 'success' | 'warning' {
  return conversion.conversions !== undefined && conversion.conversions > 0 ? 'success' : 'warning';
}

export function conversionNextStep(conversion: MarketingConsoleAdvertisingConversion): string {
  if (conversion.conversions === undefined) {
    return 'Confirm that the provider report includes this action before using it to judge performance or optimize spend.';
  }
  if (conversion.conversions === 0) {
    return 'Check tracking and the selected reporting window before concluding that this action produced no outcome.';
  }
  return 'Treat this as provider-attributed evidence and reconcile it with canonical outcomes before making budget decisions.';
}
