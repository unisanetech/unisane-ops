import type { MarketingConsoleRecommendation } from '@unisane/growth/console';
import { ActionCluster } from '@unisane/ui/action-cluster';
import { Badge } from '@unisane/ui/badge';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../contracts.js';
import { humanize } from '../lib/format.js';

type RecommendationListProps = Pick<ConsoleScreenProps, 'route' | 'navigate' | 'openOverlay'> & {
  items: MarketingConsoleRecommendation[];
};

function severityColor(
  severity: MarketingConsoleRecommendation['severity'],
): 'info' | 'warning' | 'error' {
  if (severity === 'critical' || severity === 'high') return 'error';
  if (severity === 'warn') return 'warning';
  return 'info';
}

function decisionColor(
  decision: MarketingConsoleRecommendation['decision'],
): 'info' | 'success' | 'secondary' {
  if (decision === 'accepted') return 'success';
  if (decision === 'dismissed') return 'secondary';
  return 'info';
}

export function RecommendationList({
  items,
  route,
  navigate,
  openOverlay,
}: RecommendationListProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id} variant="outlined" padding="md">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="tonal" color={severityColor(item.severity)} size="sm">
                  {humanize(item.severity)}
                </Badge>
                <Badge variant="tonal" color={decisionColor(item.decision)} size="sm">
                  {item.decisionLabel}
                </Badge>
              </div>
              <Typography variant="cardTitle" className="mt-3">
                {item.title}
              </Typography>
              <Typography variant="bodyMedium" className="mt-2">
                {item.expectedOutcome}
              </Typography>
              <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
                {item.rationale}
              </Typography>
              <Typography variant="labelSmall" className="text-on-surface-variant mt-3">
                {item.evidenceLabel}
              </Typography>
              <Typography variant="labelSmall" className="text-on-surface-variant mt-1">
                {item.confidenceLabel} · {item.effortLabel} · {item.riskLabel}
              </Typography>
              <Typography variant="labelSmall" className="text-on-surface-variant mt-1">
                {item.approvalLabel}
              </Typography>
            </div>
          </div>
          <ActionCluster align="start" className="mt-5">
            {route.path !== item.primaryAction.path ? (
              <Button variant="tonal" size="sm" onClick={() => navigate(item.primaryAction.path)}>
                {item.primaryAction.label}
              </Button>
            ) : null}
            {item.acceptAction ? (
              <Button
                size="sm"
                onClick={() => openOverlay({ kind: 'command', action: item.acceptAction! })}
              >
                {item.acceptAction.label}
              </Button>
            ) : null}
            {item.dismissAction ? (
              <Button
                variant="text"
                size="sm"
                onClick={() => openOverlay({ kind: 'command', action: item.dismissAction! })}
              >
                {item.dismissAction.label}
              </Button>
            ) : null}
          </ActionCluster>
          <details className="border-outline-subtle mt-4 border-t pt-3">
            <summary className="text-primary cursor-pointer text-sm font-medium">
              View technical details
            </summary>
            <div className="mt-3 grid gap-1">
              <Typography variant="bodySmall">
                <strong>Owner:</strong> {item.technical.owner}
              </Typography>
              <Typography variant="bodySmall">
                <strong>Source:</strong> {item.technical.source}
              </Typography>
              {item.technical.alertIds.length ? (
                <Typography variant="bodySmall" className="break-all">
                  <strong>Alerts:</strong> {item.technical.alertIds.join(', ')}
                </Typography>
              ) : null}
              {item.technical.experimentIds.length ? (
                <Typography variant="bodySmall" className="break-all">
                  <strong>Experiments:</strong> {item.technical.experimentIds.join(', ')}
                </Typography>
              ) : null}
            </div>
          </details>
        </Card>
      ))}
    </div>
  );
}
