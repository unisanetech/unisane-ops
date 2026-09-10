import { GtmSetupControls } from './gtm-setup-controls.js';
import { GtmReleaseControls } from './gtm-release-controls.js';
import { GtmWorkspaceControls } from './gtm-workspace-controls.js';
import { GtmDiagnosis } from './gtm-diagnosis.js';
import { Badge } from '@unisane/ui/badge';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import {
  formatDateTime,
  formatNumber,
  healthStatusLabel,
  humanize,
  statusColor,
} from '../../lib/format.js';
import { ContentSection, MetricCard, MetricGrid } from '../../shared/content.js';

export function TagManagerWorkspace({ state }: Pick<ConsoleScreenProps, 'state'>) {
  const workspace = state.tagManager;
  const technicalFields = Object.entries(workspace.technical).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );

  return (
    <ContentSection
      title="Tag Manager workspace"
      description="Compare project-owned measurement intent with the selected provider workspace before any change."
    >
      <Card variant="outlined" padding="md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Typography variant="cardTitle">{workspace.headline}</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
              {workspace.detail}
            </Typography>
          </div>
          <Badge variant="tonal" color={statusColor(workspace.status)} size="sm">
            {healthStatusLabel(workspace.status)}
          </Badge>
        </div>
        <div className="mt-5">
          <MetricGrid>
            <MetricCard
              label="Managed resources"
              value={
                workspace.resourceCount === undefined
                  ? 'Not available'
                  : formatNumber(workspace.resourceCount)
              }
              helper="Resources found in the latest workspace inventory."
            />
            <MetricCard
              label="Pending changes"
              value={
                workspace.pendingChangeCount === undefined
                  ? 'Review needed'
                  : formatNumber(workspace.pendingChangeCount)
              }
              helper="Differences in the latest current change review."
            />
            <MetricCard
              label="Last workspace sync"
              value={
                workspace.lastSyncedAt ? formatDateTime(workspace.lastSyncedAt) : 'Not recorded'
              }
              helper="Latest read-only provider inventory."
            />
          </MetricGrid>
        </div>
        {workspace.lastPreviewAt || workspace.lastPublishedAt ? (
          <Typography variant="labelSmall" className="text-on-surface-variant mt-4">
            {workspace.lastPreviewAt
              ? `Last preview ${formatDateTime(workspace.lastPreviewAt)}`
              : 'No preview recorded'}
            {workspace.lastPublishedAt
              ? ` · Last publication ${formatDateTime(workspace.lastPublishedAt)}`
              : ''}
          </Typography>
        ) : null}
        {technicalFields.length ? (
          <details className="border-outline-subtle mt-4 border-t pt-3">
            <summary className="text-primary cursor-pointer text-sm font-medium">
              View technical details
            </summary>
            <dl className="mt-3 grid gap-2">
              {technicalFields.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm font-medium">{humanize(key)}</dt>
                  <dd className="text-on-surface-variant text-sm break-all">{value}</dd>
                </div>
              ))}
            </dl>
          </details>
        ) : null}
      </Card>
      <GtmDiagnosis />
      <GtmSetupControls />
      <GtmWorkspaceControls />
      <GtmReleaseControls />
    </ContentSection>
  );
}
