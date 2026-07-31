import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { ContentSection, EmptyState, StatusBadge, Summary } from '../../shared/content.js';

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
        <Card variant="outlined" padding="md">
          <div className="grid gap-4">
            {health.groups.map((group) => (
              <div className="flex flex-wrap items-center justify-between gap-3" key={group.id}>
                <Typography variant="labelLarge">{group.label}</Typography>
                <StatusBadge
                  status={group.issues.length ? 'warn' : 'current'}
                  label={
                    group.issues.length
                      ? `${group.issues.length} to review`
                      : 'No supported issue detected'
                  }
                />
              </div>
            ))}
          </div>
        </Card>
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
                <Button
                  className="mt-4"
                  variant="outlined"
                  size="sm"
                  onClick={() => navigate('/seo/pages')}
                >
                  Review affected pages
                </Button>
              </Card>
            ))}
          </div>
        </ContentSection>
      ) : (
        <ContentSection>
          <EmptyState
            title="No supported search-health issue is visible."
            description="The latest available checks did not find an indexing, crawling, sitemap, structured-data, or linking problem. Continue monitoring after important site changes."
            actionLabel="Review search pages"
            onAction={() => navigate('/seo/pages')}
          />
        </ContentSection>
      )}
    </>
  );
}
