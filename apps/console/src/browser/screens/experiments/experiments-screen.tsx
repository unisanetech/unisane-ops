import { Badge } from '@unisane/ui/badge';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { humanize } from '../../lib/format.js';
import { ContentSection, DataState, Summary } from '../../shared/content.js';

export function ExperimentsScreen({ state, route }: ConsoleScreenProps) {
  const experiments = state.experiments;
  if (route.id === 'experiments.ideas') {
    return (
      <>
        <Summary headline={experiments.headline} detail={experiments.detail} />
        <ContentSection title="Testable ideas">
          {experiments.ideas.length ? (
            <div className="grid gap-3">
              {experiments.ideas.map((idea) => (
                <Card key={idea.id} variant="outlined" padding="sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Typography variant="labelLarge">{idea.title}</Typography>
                      <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                        {idea.target} · {idea.rationale}
                      </Typography>
                    </div>
                    <Badge variant="tonal" color="info" size="sm">
                      {humanize(idea.priority)}
                    </Badge>
                  </div>
                  <Typography variant="labelSmall" className="text-on-surface-variant mt-3">
                    Expected: {idea.expectedImpact}
                  </Typography>
                </Card>
              ))}
            </div>
          ) : (
            <ExperimentEmpty kind="ideas" />
          )}
        </ContentSection>
      </>
    );
  }

  const kind = route.id === 'experiments.running' ? 'running' : 'results';
  if (route.id === 'experiments.overview') {
    return (
      <>
        <Summary headline={experiments.headline} detail={experiments.detail} />
        <ContentSection>
          <ExperimentEmpty kind="running" />
        </ContentSection>
      </>
    );
  }
  return (
    <>
      <Summary
        headline={`No ${kind} experiment evidence is available.`}
        detail="The console does not promote planned ideas into measured work."
      />
      <ContentSection>
        <ExperimentEmpty kind={kind} />
      </ContentSection>
    </>
  );
}

function ExperimentEmpty({ kind }: { kind: 'running' | 'results' | 'ideas' }) {
  const copy = {
    running: {
      title: 'No experiment is collecting evidence.',
      description: 'Start an approved test with a measurable outcome before it appears here.',
    },
    results: {
      title: 'No measured experiment result is available.',
      description: 'Completed tests will appear only after their evidence supports a decision.',
    },
    ideas: {
      title: 'No experiment idea is available.',
      description: 'Add a testable hypothesis with a target and expected outcome first.',
    },
  }[kind];
  return <DataState title={copy.title} description={copy.description} />;
}
