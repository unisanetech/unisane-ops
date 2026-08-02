import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import {
  ConsoleCardGrid,
  ContentSection,
  EvidenceRow,
  InsightCard,
  StatusBadge,
  Summary,
} from '../../shared/content.js';

export function SeoHealthScreen({ state, navigate }: ConsoleScreenProps) {
  const health = state.seo.siteHealth;
  const affectedGroups = health.groups.filter((group) => group.issues.length > 0);
  return (
    <>
      <Summary headline={health.headline} detail={health.detail} />
      <ContentSection
        title="Coverage checked"
        description={`Current search-page evidence · ${state.seo.freshnessLabel}.`}
      >
        <ConsoleCardGrid minItemWidth="md">
          {health.groups.map((group) => (
            <EvidenceRow
              key={group.id}
              title={group.label}
              detail={
                group.issues.length
                  ? 'Supported evidence needs review.'
                  : 'Latest checks found no supported issue.'
              }
              status={
                <StatusBadge
                  status={group.issues.length ? 'warn' : 'current'}
                  label={group.issues.length ? `${group.issues.length} to review` : 'Clear'}
                />
              }
            />
          ))}
        </ConsoleCardGrid>
      </ContentSection>
      {affectedGroups.length ? (
        <ContentSection
          title="Needs attention"
          description="Only groups with supported issue evidence appear here."
        >
          <div className="grid gap-4">
            {affectedGroups.map((group) => (
              <Card variant="outlined" padding="md" key={group.id}>
                <Typography variant="panelTitle">{group.label}</Typography>
                <div className="mt-4 grid gap-4">
                  {group.issues.map((issue) => (
                    <div
                      className="flex flex-wrap items-start justify-between gap-3"
                      key={issue.id}
                    >
                      <div>
                        <Typography variant="labelLarge">{issue.title}</Typography>
                        <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                          {issue.impact} Affected: {issue.affectedLabel}.
                        </Typography>
                        <Typography variant="labelSmall" className="text-on-surface-variant mt-2">
                          {issue.firstSeenLabel} · {issue.lastCheckedLabel}
                        </Typography>
                      </div>
                      <StatusBadge status={issue.status} label={issue.confidenceLabel} />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outlined" size="sm" onClick={() => navigate('/seo/pages')}>
                    Review affected pages
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ContentSection>
      ) : (
        <ContentSection>
          <InsightCard
            title="No supported search-health issue is visible."
            description="The latest available checks did not find an indexing, crawling, sitemap, structured-data, or linking problem. Continue monitoring after important site changes."
            actionLabel="Review search pages"
            onAction={() => navigate('/seo/pages')}
            density="compact"
          />
        </ContentSection>
      )}
    </>
  );
}
