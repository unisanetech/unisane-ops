import type { MarketingAdsOptimizationResult } from '@unisane/growth/marketing';
import { renderMarketingRecommendationMarkdown } from '../../marketing/output/recommend.js';

export function renderAdsOptimizationMarkdown(result: MarketingAdsOptimizationResult): string {
  return renderMarketingRecommendationMarkdown(result).replace(
    '# Marketing Recommendations',
    '# Ads Optimization',
  );
}

export function printAdsOptimizationResult(
  result: MarketingAdsOptimizationResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderAdsOptimizationMarkdown(result));
}
