import type { MarketingConsoleState } from '@unisane/growth/console';
import { humanize } from '../../lib/format.js';
import { ComparisonBarChart } from '../../shared/comparison-bar-chart.js';

type MeasurementAudit = MarketingConsoleState['analytics']['measurementAudit'];

export function MeasurementOutcomeComparisons({
  audit,
}: {
  audit: Pick<MeasurementAudit, 'canonicalOutcomes' | 'attributionComparisons'>;
}) {
  const outcomeIds = [
    ...new Set([
      ...audit.canonicalOutcomes.map((outcome) => outcome.outcomeId),
      ...audit.attributionComparisons.map((comparison) => comparison.outcomeId),
    ]),
  ];

  if (!outcomeIds.length) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {outcomeIds.map((outcomeId) => {
        const canonical = audit.canonicalOutcomes.find(
          (outcome) => outcome.outcomeId === outcomeId,
        );
        const attributed = audit.attributionComparisons.filter(
          (comparison) => comparison.outcomeId === outcomeId,
        );
        return (
          <ComparisonBarChart
            key={outcomeId}
            title={canonical?.label ?? humanize(outcomeId)}
            description={
              canonical
                ? 'Compare the authoritative product outcome with separately attributed provider reports.'
                : 'Provider attribution is recorded, but no canonical product outcome is available for comparison.'
            }
            items={[
              ...(canonical
                ? [
                    {
                      id: `canonical.${outcomeId}`,
                      label: 'Canonical outcome',
                      value: canonical.count,
                      valueLabel: canonical.count.toLocaleString(),
                      detail: `${canonical.source} · ${humanize(canonical.freshness)}`,
                      tone: 'primary' as const,
                    },
                  ]
                : []),
              ...attributed.map((comparison, index) => ({
                id: `${comparison.providerId}.${outcomeId}`,
                label: `${humanize(comparison.providerId)} attributed`,
                value: comparison.attributedCount,
                valueLabel: comparison.attributedCount.toLocaleString(),
                detail: `${comparison.explanation} ${comparison.source} · ${humanize(comparison.freshness)}.`,
                tone: index === 0 ? ('info' as const) : ('secondary' as const),
              })),
            ]}
            caption={
              canonical
                ? 'Provider attribution may differ because of attribution models and windows; the canonical outcome remains authoritative.'
                : 'Do not substitute provider attribution for a missing canonical outcome.'
            }
            compact
          />
        );
      })}
    </div>
  );
}
