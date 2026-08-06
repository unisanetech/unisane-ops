import type {
  MarketingConsoleConnectionAction,
  MarketingConsoleState,
} from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import { formatDateTime, humanize, statusColor } from '../../lib/format.js';

type SeoOpportunity = MarketingConsoleState['seo']['opportunityReview']['opportunities'][number];
type SeoEvidence = MarketingConsoleState['seo']['opportunityReview']['evidence'][number];
type SeoWorkflow = MarketingConsoleState['seo']['opportunityWorkflows'][number];
type StepState = 'complete' | 'current' | 'pending' | 'attention';

const stepColors: Record<StepState, 'success' | 'primary' | 'secondary' | 'warning'> = {
  complete: 'success',
  current: 'primary',
  pending: 'secondary',
  attention: 'warning',
};

function recommendationFor(workflow: SeoWorkflow) {
  if (workflow.stage === 'research-required') {
    return {
      label: 'Research before deciding',
      color: 'warning' as const,
      detail:
        'This opportunity is promising, but the recorded evidence is not reliable enough for selection yet.',
    };
  }
  if (workflow.stage === 'approval-required') {
    return {
      label: 'Recommended for selection review',
      color: 'success' as const,
      detail:
        'This is a supported opportunity. Confirm the proposed page and known limitations before selecting it.',
    };
  }
  return {
    label: workflow.stageLabel,
    color: statusColor(workflow.status),
    detail: workflow.summary,
  };
}

function workflowSteps(workflow: SeoWorkflow): Array<{
  label: string;
  value: string;
  state: StepState;
}> {
  const researchBlocked = workflow.stage === 'research-required';
  const preparationCurrent = ['approval-required', 'ready-to-prepare'].includes(workflow.stage);
  const publicationCurrent = workflow.stage === 'prepared';
  const verificationCurrent = ['waiting-to-verify', 'ready-to-verify', 'needs-attention'].includes(
    workflow.stage,
  );
  return [
    {
      label: 'Evidence',
      value: researchBlocked ? 'Needs review' : 'Recorded',
      state: researchBlocked ? 'attention' : 'complete',
    },
    {
      label: 'Prepare',
      value: workflow.packet ? 'Brief ready' : preparationCurrent ? workflow.stageLabel : 'Pending',
      state: workflow.packet ? 'complete' : preparationCurrent ? 'current' : 'pending',
    },
    {
      label: 'Publish',
      value: workflow.publication ? 'Recorded' : publicationCurrent ? 'External step' : 'Pending',
      state: workflow.publication ? 'complete' : publicationCurrent ? 'current' : 'pending',
    },
    {
      label: 'Measure',
      value: workflow.verification
        ? humanize(workflow.verification.outcome)
        : verificationCurrent
          ? workflow.stageLabel
          : 'Pending',
      state: workflow.verification
        ? workflow.stage === 'needs-attention'
          ? 'attention'
          : 'complete'
        : verificationCurrent
          ? 'current'
          : 'pending',
    },
  ];
}

function ReviewMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card variant="outlined" padding="sm" className="min-w-0">
      <Typography variant="labelSmall" className="text-on-surface-variant">
        {label}
      </Typography>
      <Typography variant="titleMedium" className="mt-1 font-semibold break-words tabular-nums">
        {value}
      </Typography>
      <Typography variant="labelSmall" className="text-on-surface-variant mt-1">
        {note}
      </Typography>
    </Card>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Typography variant="titleMedium" component="h3" className="font-semibold">
      {children}
    </Typography>
  );
}

export function SeoOpportunityReviewPane({
  opportunity,
  evidence,
  workflow,
  onReviewAction,
  onResearch,
  onClose,
}: {
  opportunity: SeoOpportunity;
  evidence: SeoEvidence[];
  workflow: SeoWorkflow;
  onReviewAction: (action: MarketingConsoleConnectionAction) => void;
  onResearch: () => void;
  onClose: () => void;
}) {
  const recommendation = recommendationFor(workflow);
  const page = workflow.selectionReview;
  const demand = opportunity.signals.estimatedMonthlySearches;
  const competition = opportunity.signals.competitionIndex;
  const supportingEvidence = opportunity.evidenceIds
    .map((id) => evidence.find((item) => item.evidenceId === id))
    .filter((item): item is SeoEvidence => item !== undefined);
  const nextAction = workflow.nextAction;

  return (
    <section
      className="ops-seo-review-pane flex h-full min-h-0 flex-col"
      aria-label="Opportunity selection review"
    >
      <div className="ops-seo-review-pane__body min-h-0 flex-1 overflow-y-auto">
        <div className="p-5">
          <Badge variant="tonal" color={recommendation.color} size="sm">
            {recommendation.label}
          </Badge>
          <Typography
            variant="titleLarge"
            component="h2"
            className="mt-3 font-semibold tracking-tight"
          >
            {opportunity.title}
          </Typography>
          <Typography variant="bodyMedium" className="text-on-surface-variant mt-2">
            {recommendation.detail}
          </Typography>
        </div>

        <div className="ops-seo-review-pane__section px-5 py-5">
          <SectionTitle>Decision summary</SectionTitle>
          <div className="ops-seo-review-pane__metrics mt-3">
            <ReviewMetric
              label="Estimated demand"
              value={demand === undefined ? 'Not available' : demand.toLocaleString()}
              note="Monthly provider estimate"
            />
            <ReviewMetric
              label="Competition"
              value={competition === undefined ? 'Not available' : `${competition}/100`}
              note="Provider estimate"
            />
            <ReviewMetric
              label="Opportunity score"
              value={`${opportunity.score}/100`}
              note={`Ranked #${opportunity.rank}`}
            />
            <ReviewMetric
              label="Market"
              value={opportunity.market ?? 'Not recorded'}
              note={`${humanize(opportunity.confidence)} confidence`}
            />
          </div>
        </div>

        <div className="ops-seo-review-pane__section px-5 py-5">
          <SectionTitle>Why this is recommended</SectionTitle>
          <Typography variant="bodyMedium" className="text-on-surface-variant mt-2">
            {opportunity.rationale}
          </Typography>
          <Typography variant="labelMedium" className="text-on-surface-variant mt-3">
            It ranks #{opportunity.rank} among the currently returned opportunities and is supported
            by {supportingEvidence.length} recorded evidence source
            {supportingEvidence.length === 1 ? '' : 's'}.
          </Typography>
        </div>

        <div className="ops-seo-review-pane__section px-5 py-5">
          <SectionTitle>Proposed page</SectionTitle>
          <dl className="mt-3 grid gap-3">
            <div>
              <dt className="text-on-surface-variant text-label-small">Route</dt>
              <dd className="text-body-medium mt-0.5 break-all">
                {page?.routePath ?? opportunity.routePath ?? 'Not recorded'}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant text-label-small">Primary keyword</dt>
              <dd className="text-body-medium mt-0.5">
                {page?.primaryKeyword ?? opportunity.primaryKeyword ?? 'Not recorded'}
              </dd>
            </div>
            {page ? (
              <>
                <div>
                  <dt className="text-on-surface-variant text-label-small">Page title</dt>
                  <dd className="text-body-medium mt-0.5">{page.title}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant text-label-small">Planned sections</dt>
                  <dd className="text-body-medium mt-1">
                    <ul className="grid gap-2 pl-5">
                      {page.sections.map((section) => (
                        <li key={section.heading}>
                          <span className="font-medium">{section.heading}</span>
                          <span className="text-on-surface-variant"> — {section.purpose}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                {page.supportingKeywords.length ? (
                  <div>
                    <dt className="text-on-surface-variant text-label-small">
                      Supporting keywords
                    </dt>
                    <dd className="text-body-medium mt-0.5 break-words">
                      {page.supportingKeywords.join(', ')}
                    </dd>
                  </div>
                ) : null}
              </>
            ) : (
              <Typography variant="labelSmall" className="text-on-surface-variant">
                The detailed page outline becomes available when the recorded opportunity plan is
                present.
              </Typography>
            )}
          </dl>
        </div>

        <div className="ops-seo-review-pane__section px-5 py-5">
          <SectionTitle>Evidence reviewed</SectionTitle>
          <div className="mt-3 grid gap-3">
            {supportingEvidence.map((item) => (
              <div key={item.evidenceId} className="border-outline-weak rounded-sm border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Typography variant="labelMedium" className="font-semibold">
                    {item.source}
                  </Typography>
                  <Badge
                    variant="tonal"
                    color={item.freshness === 'fresh' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {humanize(item.freshness)}
                  </Badge>
                </div>
                <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                  {item.summary}
                </Typography>
                <Typography variant="labelSmall" className="text-on-surface-variant mt-2">
                  {humanize(item.kind)} evidence · observed {formatDateTime(item.observedAt)}
                </Typography>
              </div>
            ))}
          </div>
        </div>

        <div className="ops-seo-review-pane__section px-5 py-5">
          <SectionTitle>What remains uncertain</SectionTitle>
          {opportunity.limitations.length ? (
            <ul className="text-on-surface-variant text-body-medium mt-3 grid gap-2 pl-5">
              {opportunity.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          ) : (
            <Typography variant="bodyMedium" className="text-on-surface-variant mt-2">
              No additional limitation was recorded for this opportunity. Provider demand and
              competition remain estimates, not observed site outcomes.
            </Typography>
          )}
        </div>

        <div className="ops-seo-review-pane__section px-5 py-5">
          <SectionTitle>Workflow</SectionTitle>
          <div className="mt-3 grid gap-3">
            {workflowSteps(workflow).map((step, index) => (
              <div key={step.label} className="flex min-w-0 items-start gap-3">
                <Badge variant="tonal" color={stepColors[step.state]} size="sm">
                  {index + 1}
                </Badge>
                <div className="min-w-0">
                  <Typography variant="labelMedium" className="font-semibold">
                    {step.label}
                  </Typography>
                  <Typography variant="bodySmall" className="text-on-surface-variant mt-0.5">
                    {step.value}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ops-seo-review-pane__section px-5 py-5">
          <Card variant="low" padding="sm" className="border-outline-weak border">
            <Typography variant="labelMedium" className="font-semibold">
              What approval does
            </Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
              Approval records your selection of this exact opportunity. It does not create, edit,
              publish, or deploy a page. You will review the local command before anything is
              recorded.
            </Typography>
          </Card>
        </div>
      </div>

      <footer className="border-outline-weak bg-surface shrink-0 border-t p-4">
        <div className="grid gap-2">
          {nextAction ? (
            <Button size="sm" onClick={() => onReviewAction(nextAction)}>
              {nextAction.label}
            </Button>
          ) : null}
          <Button variant="outlined" size="sm" onClick={onResearch}>
            Research evidence first
          </Button>
          <Button variant="text" size="sm" onClick={onClose}>
            Not now
          </Button>
        </div>
      </footer>
    </section>
  );
}
