import type {
  MarketingConsoleExperiments,
  MarketingConsoleMetadataExperimentRow,
} from './contracts.js';

export function buildMarketingConsoleExperiments(
  metadataIdeas: MarketingConsoleMetadataExperimentRow[],
): MarketingConsoleExperiments {
  const ideas = metadataIdeas.map((idea) => ({
    id: idea.id,
    title: idea.proposedTitle,
    target: idea.routePath,
    priority: idea.priority,
    rationale: idea.rationale,
    expectedImpact: idea.expectedImpact,
    kind: 'metadata' as const,
  }));

  return {
    status: ideas.length ? 'warn' : 'missing',
    headline: ideas.length
      ? `${ideas.length} testable idea${ideas.length === 1 ? '' : 's'} are ready for review.`
      : 'No experiment evidence is available yet.',
    detail: ideas.length
      ? 'These are planned metadata ideas, not running tests or measured results. Start measurement before treating any idea as an experiment.'
      : 'Ideas, running tests, and results stay separate so plans cannot be mistaken for evidence.',
    running: [],
    results: [],
    ideas,
  };
}
