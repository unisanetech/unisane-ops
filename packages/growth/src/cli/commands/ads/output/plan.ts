import type {
  MarketingAdsPlanArtifact,
  MarketingAdsPlanCandidate,
  MarketingAdsPlanResult,
} from '@unisane/growth/marketing';

function candidateLine(candidate: MarketingAdsPlanCandidate): string {
  return [
    `${candidate.provider}/${candidate.strategyObjectId}`,
    `source=${candidate.source}`,
    `actions=${candidate.actions.length}`,
    `blockers=${candidate.blockers.length}`,
    `keywords=${candidate.keywords.length}`,
    `budget=${candidate.budgetGuardrail.dailyBudgetAmount ?? 'review'}`,
    candidate.googleSearchSettings
      ? `googleSearch=search:${candidate.googleSearchSettings.targetGoogleSearch ? 'on' : 'off'},partners:${candidate.googleSearchSettings.targetSearchNetwork ? 'on' : 'off'},display:${candidate.googleSearchSettings.targetContentNetwork ? 'on' : 'off'}`
      : undefined,
    `utm=${candidate.utm.campaign}`,
  ]
    .filter(Boolean)
    .join(' ');
}

export function renderAdsPlanMarkdown(result: MarketingAdsPlanResult): string {
  const artifact: MarketingAdsPlanArtifact = result.artifact;
  const lines = [
    '# Ads Plan',
    '',
    `Generated: ${artifact.generatedAt}`,
    `Platform: ${artifact.platformId}`,
    `App: ${artifact.appId}`,
    `Provider filter: ${artifact.providerFilter}`,
    `Dry run: ${result.dryRun ? 'yes' : 'no'}`,
    `Output: ${result.path ?? '-'}`,
    '',
    '## Safety',
    `- Non-mutating: ${artifact.nonMutating ? 'yes' : 'no'}`,
    `- Live mutation allowed: ${artifact.mutationPolicy.liveMutationAllowed ? 'yes' : 'no'}`,
    `- Apply requires reviewed plan: ${artifact.mutationPolicy.applyRequiresReviewedPlan ? 'yes' : 'no'}`,
    `- Apply requires receipt: ${artifact.mutationPolicy.applyRequiresReceipt ? 'yes' : 'no'}`,
    `- Creative assets: ${artifact.creativeAssets.length}`,
    '',
    '## Blockers',
  ];

  if (artifact.blockers.length === 0) {
    lines.push('- None.');
  } else {
    lines.push(...artifact.blockers.map((blocker) => `- ${blocker}`));
  }

  lines.push('', '## Candidates');
  if (artifact.candidates.length === 0) {
    lines.push('- No candidates.');
  } else {
    lines.push(...artifact.candidates.map((candidate) => `- ${candidateLine(candidate)}`));
  }

  lines.push('', '## Creative Assets');
  if (artifact.creativeAssets.length === 0) {
    lines.push('- No creative assets.');
  } else {
    lines.push(
      ...artifact.creativeAssets.map(
        (asset) =>
          `- ${asset.provider}/${asset.assetType} ${asset.owner} approval=${asset.approvalStatus} policy=${asset.policyStatus} destination=${asset.destinationUrl ?? '-'}`,
      ),
    );
  }

  lines.push('', '## Next', artifact.nextWorkflowStep, '');
  return lines.join('\n');
}

export function printAdsPlanResult(
  result: MarketingAdsPlanResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderAdsPlanMarkdown(result));
}
