import { DEFAULT_TRANSACTION_REQUIRED_CONVERSION_EVENTS } from './conversion-event-map';
import { normalizeParamsToSnakeCase } from './snake-case';
import type { ResolvedWebConversionConfig, WebConversionConfig } from './types';
import { normalizeWebConversionCurrency } from './value-normalization';

export function defineWebConversionConfig(config: WebConversionConfig): WebConversionConfig {
  return config;
}

export function resolveWebConversionConfig(
  config: WebConversionConfig,
): ResolvedWebConversionConfig {
  const defaultCurrency = normalizeWebConversionCurrency({
    currency: config.defaultCurrency,
  });

  return {
    appId: config.appId,
    debug: config.debug ?? false,
    ...(defaultCurrency ? { defaultCurrency } : {}),
    defaultProperties: normalizeParamsToSnakeCase(config.defaultProperties),
    transactionIdRequiredEvents:
      config.transactionIdRequiredEvents?.map((eventName) => eventName.trim()).filter(Boolean) ??
      DEFAULT_TRANSACTION_REQUIRED_CONVERSION_EVENTS,
  };
}
