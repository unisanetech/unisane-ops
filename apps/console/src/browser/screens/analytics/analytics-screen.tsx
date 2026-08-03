import { Badge } from '@unisane/ui/badge';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { healthStatusLabel, humanize, statusColor } from '../../lib/format.js';
import { ContentSection, DataState, EvidenceRow, Summary } from '../../shared/content.js';
import { RecommendationList } from '../../shared/recommendation-list.js';
import { ChannelMetrics, SourceSummary } from '../channels/shared.js';
import { AnalyticsDataTable } from './analytics-data-table.js';
import { TagManagerWorkspace } from './tag-manager-workspace.js';

export function AnalyticsScreen(props: ConsoleScreenProps) {
  switch (props.route.id) {
    case 'analytics.traffic':
      return <AnalyticsRows {...props} kind="traffic" />;
    case 'analytics.visitors':
      return <AnalyticsRows {...props} kind="visitors" />;
    case 'analytics.conversions':
      return <AnalyticsRows {...props} kind="conversions" />;
    case 'analytics.tracking-health':
      return <TrackingHealth {...props} />;
    default:
      return <AnalyticsOverview {...props} />;
  }
}

function AnalyticsOverview({ state, navigate }: ConsoleScreenProps) {
  const analytics = state.analytics;
  const measurement = analytics.measurementAudit.workflow.presentation;
  return (
    <>
      <Summary headline={analytics.headline} detail={analytics.detail} />
      {analytics.source.available ? (
        <ChannelMetrics
          metrics={analytics.metrics}
          ids={['sessions', 'users', 'analytics-conversions', 'revenue']}
        />
      ) : (
        <ContentSection>
          <DataState
            kind="unavailable"
            title="Visitor reporting is unavailable."
            description="The latest Analytics reports contain no usable rows, so this page does not display misleading zero metrics or an empty chart."
            actionLabel="Review Analytics connection"
            onAction={() => navigate('/connections/google/data-sync')}
          />
        </ContentSection>
      )}
      <ContentSection title="Measurement confidence">
        <EvidenceRow
          title={measurement.headline}
          detail={measurement.whyItMatters}
          status={
            <Badge variant="tonal" color={statusColor(analytics.trackingHealth.status)} size="sm">
              {healthStatusLabel(analytics.trackingHealth.status)}
            </Badge>
          }
        />
      </ContentSection>
      <SourceSummary source={analytics.source} />
    </>
  );
}

function AnalyticsRows({
  state,
  navigate,
  kind,
}: ConsoleScreenProps & { kind: 'traffic' | 'visitors' | 'conversions' }) {
  const rows = state.analytics[kind];
  const hasMeasuredConversions =
    kind !== 'conversions' || rows.some((row) => (row.conversions ?? 0) > 0);
  const labels = {
    traffic: {
      headline: 'Traffic by acquisition channel',
      detail: 'Compare the sources bringing sessions and visitors to the selected site.',
      firstColumn: 'Channel',
    },
    visitors: {
      headline: 'Where visitors begin',
      detail:
        'Compare landing pages that started measured visits. This report does not infer visitor identity or demographics.',
      firstColumn: 'Landing page',
    },
    conversions: {
      headline: hasMeasuredConversions
        ? 'Conversions by source'
        : 'Traffic is measured, but no Analytics conversions are recorded.',
      detail: hasMeasuredConversions
        ? 'Keep acquisition source and measured outcomes together.'
        : 'This is a measured zero, not missing traffic. Check the conversion definition and Tag Manager setup before judging channel performance.',
      firstColumn: 'Source',
    },
  }[kind];
  return (
    <>
      <Summary headline={labels.headline} detail={labels.detail} />
      {kind === 'conversions' && rows.length > 0 && !hasMeasuredConversions ? (
        <ContentSection>
          <DataState
            title="Confirm that the intended outcome is being measured."
            description="Tracking health separates Analytics access, report freshness, and Tag Manager configuration so you can repair the missing signal safely."
            actionLabel="Review tracking health"
            onAction={() => navigate('/analytics/tracking-health')}
          />
        </ContentSection>
      ) : null}
      {rows.length ? (
        <ContentSection
          title={
            kind === 'conversions' && !hasMeasuredConversions
              ? 'Sources receiving traffic without recorded outcomes'
              : `${humanize(kind)} evidence`
          }
          description={`Results for ${state.dateWindow.label.toLowerCase()}; previous-period comparison is not available yet.`}
        >
          <AnalyticsDataTable rows={rows} firstColumn={labels.firstColumn} />
        </ContentSection>
      ) : (
        <ContentSection>
          <DataState
            kind="stale"
            title={`No ${kind} rows are available.`}
            description="Refresh the selected Google Analytics property before using this report to make a decision."
            actionLabel={
              kind === 'conversions' ? 'Review tracking health' : 'Review Analytics connection'
            }
            onAction={() =>
              navigate(
                kind === 'conversions'
                  ? '/analytics/tracking-health'
                  : '/connections/google/data-sync',
              )
            }
          />
        </ContentSection>
      )}
      <SourceSummary source={state.analytics.source} />
    </>
  );
}

function TrackingHealth(props: ConsoleScreenProps) {
  const { state, navigate } = props;
  const health = state.analytics.trackingHealth;
  const audit = state.analytics.measurementAudit;
  const presentation = audit.workflow.presentation;
  const recommendations = state.recommendations.items.filter((item) => item.lane === 'analytics');
  return (
    <>
      <Summary headline={presentation.headline} detail={presentation.whyItMatters} />
      <ContentSection title="Measurement decision">
        <DataState
          kind={
            audit.status === 'blocked' ? 'error' : audit.status === 'attention' ? 'stale' : 'empty'
          }
          title={presentation.nextStep.label}
          description={presentation.nextStep.reason}
          {...(presentation.nextStep.deepLink &&
          presentation.nextStep.deepLink !== '/analytics/tracking-health'
            ? {
                actionLabel: 'Open next step',
                onAction: () => navigate(presentation.nextStep.deepLink!),
              }
            : {})}
        />
      </ContentSection>
      <ContentSection
        title="Outcome reconciliation"
        description="Canonical outcomes are authoritative. Advertising-provider conversions remain separately labelled attribution evidence."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid content-start gap-3">
            <Typography variant="titleSmall">Canonical outcomes</Typography>
            {audit.canonicalOutcomes.length ? (
              audit.canonicalOutcomes.map((outcome) => (
                <Card key={outcome.outcomeId} variant="outlined" padding="sm">
                  <Typography variant="labelLarge">{outcome.label}</Typography>
                  <Typography variant="headlineSmall" className="mt-2">
                    {outcome.count}
                  </Typography>
                  <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                    {outcome.source} · {humanize(outcome.freshness)}
                  </Typography>
                </Card>
              ))
            ) : (
              <DataState
                kind="error"
                title="Canonical outcomes are unavailable."
                description="Provider-attributed conversions cannot substitute for server-confirmed business outcomes."
              />
            )}
          </div>
          <div className="grid content-start gap-3">
            <Typography variant="titleSmall">Provider-attributed conversions</Typography>
            {audit.attributionComparisons.length ? (
              audit.attributionComparisons.map((comparison) => (
                <Card
                  key={`${comparison.providerId}.${comparison.outcomeId}`}
                  variant="outlined"
                  padding="sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Typography variant="labelLarge">
                        {humanize(comparison.providerId)}
                      </Typography>
                      <Typography variant="headlineSmall" className="mt-2">
                        {comparison.attributedCount}
                      </Typography>
                    </div>
                    <Badge variant="tonal" color="info" size="sm">
                      Attributed
                    </Badge>
                  </div>
                  <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
                    {comparison.explanation}
                  </Typography>
                </Card>
              ))
            ) : (
              <DataState
                kind="unavailable"
                title="No provider attribution is available."
                description="The canonical outcome remains usable when provider comparison evidence is not recorded."
              />
            )}
          </div>
        </div>
      </ContentSection>
      <ContentSection
        title="Observed measurement"
        description={`${health.audit.evidenceLabel}. This audit is read-only and does not install scripts or change provider configuration.`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card variant="outlined" padding="sm">
            <Typography variant="labelMedium" className="text-on-surface-variant">
              Expected events observed
            </Typography>
            <Typography variant="titleMedium" className="mt-1">
              {health.audit.observedEventCount} of {health.audit.expectedEventCount}
            </Typography>
          </Card>
          <Card variant="outlined" padding="sm">
            <Typography variant="labelMedium" className="text-on-surface-variant">
              Expected conversions confirmed
            </Typography>
            <Typography variant="titleMedium" className="mt-1">
              {health.audit.observedConversionCount} of {health.audit.expectedConversionCount}
            </Typography>
          </Card>
        </div>
      </ContentSection>
      <ContentSection
        title="Detected emitters"
        description="These systems can send browser or server measurement events for the current project."
      >
        {health.audit.emitters.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {health.audit.emitters.map((emitter) => (
              <Card key={emitter.id} variant="outlined" padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Typography variant="labelLarge">{emitter.label}</Typography>
                    <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                      {emitter.detail}
                    </Typography>
                  </div>
                  <Badge variant="tonal" color={statusColor(emitter.status)} size="sm">
                    {emitter.status === 'warn' ? 'Direct' : 'Detected'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <DataState
            kind="error"
            title="No event emitter was detected."
            description="The audit could not find Web Runtime, Tag Manager, direct gtag, Meta Pixel, or supported server conversion transports in the scanned project source."
          />
        )}
      </ContentSection>
      <ContentSection
        title="Tracking findings"
        description="Fix blocked findings before trusting conversion totals; warnings name missing or suppressed evidence that still needs review."
      >
        {health.audit.findings.length ? (
          <div className="grid gap-3">
            {health.audit.findings.map((finding) => (
              <Card key={finding.id} variant="outlined" padding="sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Typography variant="labelLarge">{finding.title}</Typography>
                    <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                      {finding.detail}
                    </Typography>
                  </div>
                  <Badge variant="tonal" color={statusColor(finding.status)} size="sm">
                    {finding.status === 'blocked' ? 'Blocked' : 'Review'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="outlined" padding="sm">
            <Typography variant="labelLarge">No tracking conflicts were found.</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
              The observed evidence matches the expected events, conversions, environment, and
              payload requirements.
            </Typography>
          </Card>
        )}
      </ContentSection>
      <ContentSection title="Measurement checks">
        <div className="grid gap-3">
          {health.checks.map((check) => (
            <Card key={check.id} variant="outlined" padding="sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Typography variant="labelLarge">{check.label}</Typography>
                  <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                    {check.detail}
                  </Typography>
                </div>
                <Badge variant="tonal" color={statusColor(check.status)} size="sm">
                  {healthStatusLabel(check.status)}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </ContentSection>
      <TagManagerWorkspace {...props} />
      {recommendations.length ? (
        <ContentSection
          title="Recommended measurement work"
          description="Each item keeps evidence, expected outcome, review level, and the recorded decision together."
        >
          <RecommendationList items={recommendations} {...props} />
        </ContentSection>
      ) : null}
      <ContentSection>
        <DataState
          title="Need to repair measurement?"
          description="Connections keeps access and resource selection in one place; this page only explains measurement confidence."
          actionLabel="Review connections"
          onAction={() => navigate('/connections')}
        />
      </ContentSection>
    </>
  );
}
