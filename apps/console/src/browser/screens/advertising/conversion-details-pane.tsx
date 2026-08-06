import type {
  MarketingConsoleAdvertisingConversion,
  MarketingConsoleSourceSummary,
} from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import { formatNumber } from '../../lib/format.js';
import { formatMoney } from '../channels/shared.js';
import {
  conversionMeasurementColor,
  conversionMeasurementLabel,
  conversionNextStep,
} from './conversion-presenters.js';
import {
  AdvertisingDetailMetric,
  AdvertisingDetailSection,
  AdvertisingSourceEvidence,
} from './detail-pane-primitives.js';

export function ConversionDetailsPane({
  conversion,
  source,
}: {
  conversion: MarketingConsoleAdvertisingConversion;
  source?: MarketingConsoleSourceSummary;
}) {
  return (
    <section
      className="ops-advertising-detail-pane flex h-full min-h-0 flex-col"
      aria-label="Conversion action details"
    >
      <div className="ops-advertising-detail-pane__body min-h-0 flex-1 overflow-y-auto">
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="tonal" color={conversionMeasurementColor(conversion)} size="sm">
              {conversionMeasurementLabel(conversion)}
            </Badge>
            <Badge variant="tonal" color="secondary" size="sm">
              {conversion.providerLabel}
            </Badge>
          </div>
          <Typography variant="bodyMedium" className="text-on-surface-variant mt-3">
            Review what the provider report includes before using this conversion action to assess
            performance.
          </Typography>
        </div>

        <AdvertisingDetailSection title="Reported result">
          <div className="ops-advertising-detail-pane__metrics">
            <AdvertisingDetailMetric
              label="Provider-attributed outcomes"
              value={
                conversion.conversions === undefined
                  ? 'Not included'
                  : formatNumber(conversion.conversions)
              }
            />
            <AdvertisingDetailMetric
              label="Provider-attributed value"
              value={
                conversion.conversionValue === undefined
                  ? 'Not included'
                  : formatMoney(conversion.conversionValue, conversion.currencyCode)
              }
            />
          </div>
        </AdvertisingDetailSection>

        <AdvertisingDetailSection title="Measurement evidence">
          <Card variant="low" padding="sm" className="border-outline-weak border">
            <Typography variant="bodyMedium">{conversion.measurementLabel}</Typography>
          </Card>
          <Typography variant="bodySmall" className="text-on-surface-variant mt-3">
            A configured action proves setup exists. It does not by itself prove that an outcome was
            observed or reconciled with the product's canonical conversion record.
          </Typography>
        </AdvertisingDetailSection>

        <AdvertisingDetailSection title="Recommended next step">
          <Typography variant="bodyMedium">{conversionNextStep(conversion)}</Typography>
        </AdvertisingDetailSection>

        <AdvertisingDetailSection title="Reporting context">
          <AdvertisingSourceEvidence
            source={source}
            fallbackLabel={conversion.providerLabel}
            fallbackDetail="Conversion evidence comes from the selected advertising provider report."
          />
        </AdvertisingDetailSection>
      </div>
    </section>
  );
}
