import type {
  MarketingRecommendation,
  MarketingRecommendationArtifact,
  MarketingRecommendationDecisionReceipt,
  MarketingReportProvider,
} from '@unisane/growth/marketing';
import type {
  MarketingConsolePriority,
  MarketingConsolePriorityLane,
  MarketingConsoleRecommendation,
  MarketingConsoleRecommendations,
} from './contracts.js';

function linkedProvider(
  recommendation: MarketingRecommendation,
  artifact: MarketingRecommendationArtifact,
): MarketingReportProvider | undefined {
  const alertIds = new Set(recommendation.alertIds);
  return artifact.alerts.find((alert) => alertIds.has(alert.id) && alert.provider)?.provider;
}

function laneFor(
  recommendation: MarketingRecommendation,
  provider: MarketingReportProvider | undefined,
): MarketingConsolePriorityLane {
  if (recommendation.action === 'fix_tracking') return 'analytics';
  if (recommendation.action === 'run_experiment') return 'experiments';
  if (recommendation.action === 'refresh_provider_data') {
    if (provider === 'searchConsole') return 'seo';
    if (provider === 'ga4') return 'analytics';
    if (provider === 'googleAds' || provider === 'metaAds') return 'advertising';
  }
  if (
    recommendation.action === 'investigate_conversion_mismatch' ||
    recommendation.action === 'pause_or_reduce_spend' ||
    recommendation.action === 'decrease_budget' ||
    recommendation.action === 'hold_scaling'
  ) {
    return 'advertising';
  }
  return 'overview';
}

function expectedOutcome(recommendation: MarketingRecommendation): string {
  const outcomes: Record<MarketingRecommendation['action'], string> = {
    fix_tracking: 'Restore trustworthy conversion and attribution evidence before scaling.',
    refresh_provider_data: 'Base the next decision on current provider evidence.',
    investigate_conversion_mismatch:
      'Explain the difference between provider-reported and confirmed conversions.',
    pause_or_reduce_spend: 'Limit avoidable spend while performance evidence is investigated.',
    decrease_budget: 'Bring spend back within the reviewed performance threshold.',
    run_experiment: 'Test a bounded hypothesis before making a broader optimization change.',
    hold_scaling: 'Avoid increasing spend until the supporting evidence becomes reliable.',
  };
  return outcomes[recommendation.action];
}

function effortLabel(recommendation: MarketingRecommendation): string {
  if (recommendation.action === 'refresh_provider_data') return 'Low effort';
  if (
    recommendation.action === 'pause_or_reduce_spend' ||
    recommendation.action === 'decrease_budget' ||
    recommendation.action === 'hold_scaling'
  ) {
    return 'Low effort after review';
  }
  if (recommendation.action === 'run_experiment') return 'High effort';
  return 'Medium effort';
}

function titleCase(value: string): string {
  const normalized = value.replace(/[-_]+/g, ' ');
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}

function evidenceSourceLabel(source: string): string {
  if (source === 'provider-pulls') return 'Provider report evidence';
  if (source === 'marketing-audit') return 'Marketing audit';
  if (source === 'strategy-object-report') return 'Growth strategy evidence';
  return titleCase(source);
}

function evidenceWindowLabel(window: string): string {
  if (window.startsWith('audit:')) return 'Current tracking audit';
  return window.replace('..', ' to ');
}

function primaryAction(
  recommendation: MarketingRecommendation,
  provider: MarketingReportProvider | undefined,
  experimentsAvailable: boolean,
): MarketingConsoleRecommendation['primaryAction'] {
  const advertisingPath = (section: 'campaigns' | 'conversions'): string => {
    if (provider === 'googleAds') return `/advertising/google/${section}`;
    if (provider === 'metaAds') return `/advertising/meta/${section}`;
    return `/advertising/all/${section}`;
  };
  if (recommendation.action === 'fix_tracking') {
    return { label: 'Review tracking health', path: '/analytics/tracking-health' };
  }
  if (recommendation.action === 'refresh_provider_data') {
    if (provider === 'searchConsole') {
      return { label: 'Review Search Console sync', path: '/connections/google/data-sync' };
    }
    if (provider === 'ga4') {
      return { label: 'Review Analytics sync', path: '/connections/google/data-sync' };
    }
    return {
      label: 'Review advertising sync',
      path:
        provider === 'metaAds' ? '/connections/meta/data-sync' : '/connections/google/data-sync',
    };
  }
  if (recommendation.action === 'investigate_conversion_mismatch') {
    return { label: 'Review conversions', path: advertisingPath('conversions') };
  }
  if (recommendation.action === 'run_experiment') {
    return experimentsAvailable
      ? { label: 'Review experiment idea', path: '/experiments/ideas' }
      : { label: 'Review campaign evidence', path: advertisingPath('campaigns') };
  }
  return { label: 'Review campaigns', path: advertisingPath('campaigns') };
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function decisionActions(input: {
  recommendation: MarketingRecommendation;
  artifactPath: string;
  decision: MarketingConsoleRecommendation['decision'];
}): Pick<MarketingConsoleRecommendation, 'acceptAction' | 'dismissAction'> {
  if (input.decision !== 'pending') return {};
  const base = [
    'unisane growth marketing recommend decision',
    '--cwd .',
    `--input ${shellQuote(input.artifactPath)}`,
    `--recommendation-id ${shellQuote(input.recommendation.id)}`,
  ].join(' ');
  const approvalArgs =
    input.recommendation.approvalTier === 'strict'
      ? " --decided-by '<operator>' --approval-ref '<approval-reference>'"
      : input.recommendation.approvalTier === 'standard'
        ? " --decided-by '<operator>'"
        : '';
  return {
    acceptAction: {
      id: `recommendation.${input.recommendation.id}.accept`,
      label:
        input.recommendation.approvalTier === 'none'
          ? 'Accept for planning'
          : 'Prepare reviewed acceptance',
      description:
        input.recommendation.approvalTier === 'none'
          ? 'Record acceptance as planning input. This does not change a provider account.'
          : 'Replace the review placeholders, then record the approved planning decision. This does not change a provider account.',
      command: `${base} --decision accepted${approvalArgs}`,
    },
    dismissAction: {
      id: `recommendation.${input.recommendation.id}.dismiss`,
      label: 'Dismiss with reason',
      description:
        'Replace the reason placeholder to record why this recommendation should not proceed.',
      command: `${base} --decision rejected --reason '<reason>'`,
    },
  };
}

function decisionFor(
  recommendationId: string,
  receipts: readonly MarketingRecommendationDecisionReceipt[],
): MarketingRecommendationDecisionReceipt | undefined {
  return receipts
    .filter((receipt) => receipt.recommendationId === recommendationId)
    .sort((left, right) => right.generatedAt.localeCompare(left.generatedAt))[0];
}

function projectRecommendation(input: {
  recommendation: MarketingRecommendation;
  artifact: MarketingRecommendationArtifact;
  artifactPath: string;
  receipts: readonly MarketingRecommendationDecisionReceipt[];
  experimentsAvailable: boolean;
}): MarketingConsoleRecommendation {
  const provider = linkedProvider(input.recommendation, input.artifact);
  const receipt = decisionFor(input.recommendation.id, input.receipts);
  const decision =
    receipt?.decision === 'accepted'
      ? ('accepted' as const)
      : receipt?.decision === 'rejected'
        ? ('dismissed' as const)
        : ('pending' as const);
  return {
    id: input.recommendation.id,
    lane: laneFor(input.recommendation, provider),
    ...(provider ? { provider } : {}),
    actionType: input.recommendation.action,
    severity: input.recommendation.severity,
    title: input.recommendation.title,
    expectedOutcome: expectedOutcome(input.recommendation),
    rationale: input.recommendation.rationale,
    evidenceLabel: `${evidenceSourceLabel(input.recommendation.source)} · ${evidenceWindowLabel(input.recommendation.dataWindow)}`,
    confidenceLabel: `${titleCase(input.recommendation.confidence)} confidence`,
    freshnessLabel: evidenceWindowLabel(input.recommendation.dataWindow),
    effortLabel: effortLabel(input.recommendation),
    riskLabel: `${titleCase(input.recommendation.risk)} risk`,
    approvalLabel:
      input.recommendation.approvalTier === 'none'
        ? 'No external approval required'
        : `${titleCase(input.recommendation.approvalTier)} approval required`,
    decision,
    decisionLabel:
      decision === 'accepted'
        ? 'Accepted for planning'
        : decision === 'dismissed'
          ? 'Dismissed'
          : 'Awaiting decision',
    primaryAction: primaryAction(input.recommendation, provider, input.experimentsAvailable),
    ...decisionActions({
      recommendation: input.recommendation,
      artifactPath: input.artifactPath,
      decision,
    }),
    technical: {
      owner: input.recommendation.owner,
      source: input.recommendation.source,
      alertIds: input.recommendation.alertIds,
      experimentIds: input.recommendation.experimentIds,
    },
  };
}

export function buildMarketingConsoleRecommendations(input: {
  artifact?: MarketingRecommendationArtifact;
  artifactPath?: string;
  receipts: readonly MarketingRecommendationDecisionReceipt[];
  experimentsAvailable: boolean;
}): MarketingConsoleRecommendations {
  if (!input.artifact || !input.artifactPath) {
    return {
      status: 'missing',
      headline: 'No cross-channel recommendation review is available yet.',
      summary:
        'Generate recommendations from the current reports before using them to guide optimization work.',
      items: [],
    };
  }
  const artifact = input.artifact;
  const artifactPath = input.artifactPath;
  const items = artifact.recommendations.map((recommendation) =>
    projectRecommendation({
      recommendation,
      artifact,
      artifactPath,
      receipts: input.receipts,
      experimentsAvailable: input.experimentsAvailable,
    }),
  );
  const pendingCount = items.filter((item) => item.decision === 'pending').length;
  const blockerCount = artifact.blockers.length;
  return {
    status: blockerCount > 0 ? 'warn' : items.length > 0 ? 'ready' : 'missing',
    headline:
      pendingCount > 0
        ? `${pendingCount} evidence-backed ${pendingCount === 1 ? 'recommendation needs' : 'recommendations need'} a decision.`
        : items.length > 0
          ? 'All current recommendations have a recorded decision.'
          : 'No optimization recommendation is supported by the current evidence.',
    summary:
      blockerCount > 0
        ? 'Resolve the evidence blockers before accepting any recommendation that could affect spend.'
        : 'Recommendations are planning input only; provider changes still require a separate guarded plan and apply workflow.',
    generatedAt: artifact.generatedAt,
    items,
  };
}

export function recommendationPriorities(
  recommendations: MarketingConsoleRecommendations,
): MarketingConsolePriority[] {
  return recommendations.items
    .filter((item) => item.decision === 'pending')
    .map((item) => ({
      id: `recommendation.${item.id}`,
      lane: item.lane,
      title: item.title,
      expectedOutcome: item.expectedOutcome,
      reason: item.rationale,
      evidence: item.evidenceLabel,
      confidenceLabel: item.confidenceLabel,
      freshnessLabel: item.freshnessLabel,
      effortLabel: item.effortLabel,
      priorityLabel:
        item.severity === 'critical' || item.severity === 'high'
          ? 'High priority'
          : item.severity === 'warn'
            ? 'Medium priority'
            : 'Low priority',
      riskLabel: `${item.riskLabel}. ${item.approvalLabel}.`,
      action: item.primaryAction,
    }));
}
