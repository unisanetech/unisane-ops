import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { CardGrid } from '@unisane/ui/card-grid';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { readHelpSource } from '../../routing/help-context.js';
import { resolveConsoleRoute } from '../../../routes.js';
import { ContentSection, StatusBadge } from '../../shared/content.js';

const guidanceByFamily: Record<string, string[]> = {
  overview: [
    'Start with “What needs attention”; it is ordered from current evidence.',
    'A displayed zero is a measured result. Missing data is labelled unavailable.',
    'Open a growth area when you need the underlying channel evidence.',
  ],
  seo: [
    'Research estimates where demand may exist; Search Console validates current visibility.',
    'Opportunities keep expected outcome, confidence, effort, and evidence together.',
    'Site health only reports issue types supported by the current checks.',
  ],
  advertising: [
    'Treat spend, delivery, and conversion measurement as separate signals.',
    'A configured conversion action does not prove that an outcome occurred.',
    'Recommendations require review before any provider-changing command is prepared.',
  ],
  analytics: [
    'Traffic and landing-page reports describe measured sessions, not user identity.',
    'Zero conversions require a measurement check before channel performance is judged.',
    'Tracking health separates access, report freshness, and Tag Manager configuration.',
  ],
  connections: [
    'Access shows the Google identity and service-level permissions.',
    'Resources identifies the exact site, property, container, or customer in use.',
    'Data updates and Activity explain freshness and provider events independently.',
  ],
  'connection-detail': [
    'Access shows the Google identity and service-level permissions.',
    'Resources identifies the exact site, property, container, or customer in use.',
    'Data updates and Activity explain freshness and provider events independently.',
  ],
  activity: [
    'Filter by activity type or provider to narrow the history.',
    'Provider details remain collapsed until they are needed for diagnosis.',
    'Recorded changes show actor and approval context when it is available.',
  ],
  settings: [
    'Console preferences are local to this browser.',
    'Automations are project reporting jobs, not browser preferences.',
    'Provider accounts and resources remain under Connections.',
  ],
};

export function HelpScreen({ state, navigate }: ConsoleScreenProps) {
  const sourcePath = readHelpSource();
  const sourceRoute = resolveConsoleRoute(sourcePath, state.capabilities);
  const guidance = guidanceByFamily[sourceRoute.family] ?? guidanceByFamily.overview!;
  const priority = state.priorities[0];
  return (
    <>
      <ContentSection>
        <Card variant="outlined" padding="md">
          <Typography variant="panelTitle">Help for {sourceRoute.title}</Typography>
          <Typography variant="bodyMedium" className="text-on-surface-variant mt-2">
            {sourceRoute.description}
          </Typography>
          <Button className="mt-5" variant="tonal" onClick={() => navigate(sourceRoute.path)}>
            Return to {sourceRoute.label}
          </Button>
        </Card>
      </ContentSection>
      <ContentSection title="How to use this page">
        <Card variant="outlined" padding="md">
          <ol className="grid gap-3">
            {guidance.map((item, index) => (
              <li className="flex gap-3" key={item}>
                <Typography component="span" variant="labelMedium" className="text-primary">
                  {index + 1}.
                </Typography>
                <Typography component="span" variant="bodyMedium">
                  {item}
                </Typography>
              </li>
            ))}
          </ol>
        </Card>
      </ContentSection>
      <ContentSection
        title="Status meanings"
        description="Status labels use one plain-language system across the Console."
      >
        <CardGrid minItemWidth="sm">
          <StatusMeaning
            status="current"
            label="Healthy"
            detail="Current usable evidence is available."
          />
          <StatusMeaning
            status="warn"
            label="Needs review"
            detail="Useful evidence exists, but something should be checked."
          />
          <StatusMeaning
            status="blocked"
            label="Action required"
            detail="The workflow cannot be trusted or continued yet."
          />
          <StatusMeaning
            status="missing"
            label="Not available"
            detail="The required evidence has not been recorded."
          />
        </CardGrid>
      </ContentSection>
      <ContentSection title="What should I do next?">
        <Card variant="outlined" padding="md">
          <Typography variant="panelTitle">
            {priority?.title ?? 'Review the latest growth evidence'}
          </Typography>
          <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
            {priority?.reason ?? state.overview.detail}
          </Typography>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button size="sm" onClick={() => navigate(priority?.action.path ?? '/overview')}>
              {priority?.action.label ?? 'Open overview'}
            </Button>
            <Button variant="tonal" size="sm" onClick={() => navigate('/connections')}>
              Review data sources
            </Button>
            <Button variant="tonal" size="sm" onClick={() => navigate('/activity')}>
              Review activity
            </Button>
          </div>
        </Card>
      </ContentSection>
    </>
  );
}

function StatusMeaning({
  status,
  label,
  detail,
}: {
  status: 'current' | 'warn' | 'blocked' | 'missing';
  label: string;
  detail: string;
}) {
  return (
    <Card variant="outlined" padding="sm">
      <StatusBadge status={status} label={label} />
      <Typography variant="bodySmall" className="text-on-surface-variant mt-3">
        {detail}
      </Typography>
    </Card>
  );
}
