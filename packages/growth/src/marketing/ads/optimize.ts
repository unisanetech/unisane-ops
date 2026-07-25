import type { MarketingConfig } from '../schema/marketing-config.js';
import {
  buildMarketingRecommendations,
  writeMarketingRecommendations,
  type MarketingRecommendationOptions,
  type MarketingRecommendationResult,
} from '../recommendations/recommendations.js';
import type { MarketingRecommendationArtifact } from '../schema/recommendation.js';

export type MarketingAdsOptimizationOptions = MarketingRecommendationOptions;
export type MarketingAdsOptimizationResult = MarketingRecommendationResult;

export async function buildMarketingAdsOptimization(
  config: MarketingConfig,
  options: MarketingAdsOptimizationOptions = {},
): Promise<MarketingRecommendationArtifact> {
  return buildMarketingRecommendations(config, options);
}

export async function writeMarketingAdsOptimization(
  config: MarketingConfig,
  options: MarketingAdsOptimizationOptions = {},
): Promise<MarketingAdsOptimizationResult> {
  return writeMarketingRecommendations(config, options);
}
