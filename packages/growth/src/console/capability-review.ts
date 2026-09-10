import {
  growthCapabilityReviewOutputSchema,
  type GrowthCapabilityReviewer,
} from '../capabilities/contracts.js';
export type {
  GrowthCapabilityReviewer,
  GrowthCapabilityReview,
} from '../capabilities/contracts.js';

export async function loadConsoleCapabilityReview(
  review: GrowthCapabilityReviewer | undefined,
  target: {
    projectId: string;
    environmentId: string;
  },
) {
  if (!review) return undefined;
  const result = growthCapabilityReviewOutputSchema.parse(await review(target));
  if (result.projectId !== target.projectId || result.environmentId !== target.environmentId) {
    throw new Error(
      '[GROWTH_CAPABILITIES_TARGET_MISMATCH] Capability review does not match the console project and environment.',
    );
  }
  return result;
}
