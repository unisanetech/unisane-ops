import { discardMarketingFixtureEvidence } from '@unisane/growth/marketing';
import type { MarketingCliOptions } from '../options.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export async function marketingEvidenceDiscardFixtures(
  options: MarketingCliOptions,
): Promise<number> {
  try {
    if (!options.provider) {
      throw new Error('[MARKETING_EVIDENCE_PROVIDER_REQUIRED] Pass --provider <provider>.');
    }
    const result = discardMarketingFixtureEvidence({
      cwd: options.cwd ?? process.cwd(),
      provider: options.provider as 'googleAds' | 'metaAds' | 'ga4' | 'searchConsole',
      confirm: options.yes === true,
    });
    if (options.json) printJson(result);
    else if (result.applied) {
      console.log(`Removed ${result.removedPaths.length} ${result.provider} fixture artifacts.`);
    } else {
      console.log(
        `Preview: ${result.candidatePaths.length} ${result.provider} fixture artifacts. Pass --yes to remove them.`,
      );
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown evidence cleanup error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
