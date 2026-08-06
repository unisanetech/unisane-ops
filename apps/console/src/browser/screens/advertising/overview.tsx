import { Badge } from '@unisane/ui/badge';
import type { ConsoleScreenProps } from '../../contracts.js';
import { healthStatusLabel, statusColor } from '../../lib/format.js';
import { ContentSection, DataState, EvidenceRow, Summary } from '../../shared/content.js';
import { ChannelMetrics, SourceSummaries } from '../channels/shared.js';
import { AdvertisingProviderSpendComparison } from './provider-comparison-chart.js';
import { advertisingConnectionPath, advertisingView } from './view.js';

export function AdvertisingOverview({ state, route, navigate }: ConsoleScreenProps) {
  const advertising = advertisingView(state, route);
  return (
    <>
      <Summary headline={advertising.headline} detail={advertising.detail} />
      <ChannelMetrics
        metrics={advertising.metrics}
        ids={['spend', 'paid-clicks', 'paid-conversions', 'roas']}
      />
      {advertising.scope === 'all' ? (
        <ContentSection
          title="Provider comparison"
          description="Use provider reporting to compare delivery and cost; use canonical outcomes to judge business results."
        >
          <AdvertisingProviderSpendComparison providers={state.advertising.providers} />
        </ContentSection>
      ) : null}
      {advertising.scope !== 'metaAds' ? (
        <ContentSection
          title="What needs attention"
          description="Check tracking, delivery, and account setup separately so one healthy area does not hide another that needs attention."
        >
          {state.advertising.auditSections.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {state.advertising.auditSections.map((section) => (
                <EvidenceRow
                  key={section.id}
                  title={section.label}
                  detail={section.summary}
                  status={
                    <Badge variant="tonal" color={statusColor(section.status)} size="sm">
                      {healthStatusLabel(section.status)}
                    </Badge>
                  }
                />
              ))}
            </div>
          ) : (
            <DataState
              kind="stale"
              title="No advertising audit is available."
              description="Refresh the advertising evidence before using recommendations to guide spend."
              actionLabel="Review connection"
              onAction={() => navigate(advertisingConnectionPath(route.advertisingPlatform))}
            />
          )}
        </ContentSection>
      ) : null}
      <SourceSummaries sources={advertising.sources} />
    </>
  );
}
