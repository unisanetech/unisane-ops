import type {
  MarketingAlertAcknowledgementReceipt,
  MarketingAlertAcknowledgementResult,
} from '@unisane/growth/marketing';

export function renderMarketingAlertAcknowledgementMarkdown(
  result: MarketingAlertAcknowledgementResult,
): string {
  const receipt: MarketingAlertAcknowledgementReceipt = result.receipt;
  return [
    '# Marketing Alert Acknowledgement',
    '',
    `Generated: ${receipt.generatedAt}`,
    `Platform: ${receipt.platformId}`,
    `App: ${receipt.appId}`,
    `Alert: ${receipt.alertId}`,
    `Severity: ${receipt.severity}`,
    `Root cause: ${receipt.rootCauseKey}`,
    `Acknowledged by: ${receipt.acknowledgedBy}`,
    `Output: ${result.path}`,
    '',
    '## Policy',
    `- Deletes evidence: ${receipt.policy.deletesEvidence ? 'yes' : 'no'}`,
    `- High severity reason required: ${receipt.policy.highSeverityReasonRequired ? 'yes' : 'no'}`,
    `- Grouped by root cause: ${receipt.policy.recurringAlertsGroupedByRootCause ? 'yes' : 'no'}`,
    '',
    '## Next',
    receipt.nextWorkflowStep,
    '',
  ].join('\n');
}

export function printMarketingAlertAcknowledgementResult(
  result: MarketingAlertAcknowledgementResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderMarketingAlertAcknowledgementMarkdown(result));
}
