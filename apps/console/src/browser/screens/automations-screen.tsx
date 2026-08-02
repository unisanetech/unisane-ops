import { ActionCluster } from '@unisane/ui/action-cluster';
import { Badge } from '@unisane/ui/badge';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../contracts.js';
import { formatDateTime, humanize, statusColor } from '../lib/format.js';
import {
  ConsoleCardGrid,
  ContentSection,
  DataState,
  MetricCard,
  MetricGrid,
  Summary,
} from '../shared/content.js';

export function AutomationsScreen({ state, openOverlay, navigate }: ConsoleScreenProps) {
  const automations = state.automations;
  return (
    <>
      <Summary headline={automations.headline} detail={automations.summary} />
      <ContentSection>
        <MetricGrid>
          <MetricCard
            label="Planned updates"
            value={automations.items.length}
            helper="Selected-provider reporting jobs in the local plan."
          />
          <MetricCard
            label="Active schedules"
            value={0}
            helper="No scheduler activation evidence is recorded."
          />
          <MetricCard
            label="Next run"
            value="Not scheduled"
            helper="A next run appears only after scheduler activation is verified."
          />
        </MetricGrid>
      </ContentSection>
      <ContentSection
        title="Reporting automations"
        description="Configure only the provider updates this project actually uses."
      >
        {automations.items.length ? (
          <ConsoleCardGrid minItemWidth="md">
            {automations.items.map((item) => (
              <Card variant="outlined" padding="md" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Typography variant="labelSmall" className="text-on-surface-variant">
                      {item.providerLabel}
                    </Typography>
                    <Typography variant="cardTitle" className="mt-1">
                      {item.name}
                    </Typography>
                  </div>
                  <Badge variant="tonal" color={statusColor(item.status)} size="sm">
                    {item.statusLabel}
                  </Badge>
                </div>
                <Typography variant="bodySmall" className="text-on-surface-variant mt-3">
                  {item.purpose}
                </Typography>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-on-surface-variant">Frequency</dt>
                    <dd>{item.frequencyLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">Timezone</dt>
                    <dd>{item.timezoneLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">Last success</dt>
                    <dd>
                      {item.lastSuccessAt
                        ? formatDateTime(item.lastSuccessAt)
                        : item.lastSuccessLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant">Next run</dt>
                    <dd>{item.nextRunLabel}</dd>
                  </div>
                </dl>
                {item.issue && item.issue !== automations.sharedIssue ? (
                  <Typography variant="bodySmall" className="text-warning mt-4">
                    {item.issue}
                  </Typography>
                ) : null}
                <ActionCluster align="start" className="mt-5">
                  <Button
                    size="sm"
                    onClick={() => openOverlay({ kind: 'command', action: item.runNow })}
                  >
                    Run now
                  </Button>
                  <Button
                    variant="tonal"
                    size="sm"
                    onClick={() => openOverlay({ kind: 'command', action: item.edit })}
                  >
                    Edit setup
                  </Button>
                </ActionCluster>
                <details className="border-outline-subtle mt-4 border-t pt-3">
                  <summary className="text-primary cursor-pointer text-sm font-medium">
                    Technical details
                  </summary>
                  <Typography variant="bodySmall" className="mt-3">
                    Report family: {humanize(item.technical.reportType)}
                  </Typography>
                  {item.technical.schedulePath ? (
                    <Typography variant="bodySmall" className="mt-1 break-all">
                      Plan evidence: {item.technical.schedulePath}
                    </Typography>
                  ) : null}
                </details>
              </Card>
            ))}
          </ConsoleCardGrid>
        ) : (
          <DataState
            kind="unavailable"
            title="No reporting automation is ready to configure."
            description="Create a reporting plan after connecting the provider data this project should keep current."
            actionLabel="Review connections"
            onAction={() => navigate('/connections')}
          />
        )}
      </ContentSection>
    </>
  );
}
