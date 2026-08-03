import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { MarketingConsoleState } from '@unisane/growth/console';
import {
  CampaignPauseReviewPanel,
  campaignPauseApprovalCopy,
  selectCampaignPauseReviews,
} from './campaign-pause-review.js';

type CampaignPauseReview = MarketingConsoleState['advertising']['campaignPauseReviews'][number];

const review: CampaignPauseReview = {
  runId: 'growth.campaign-pause.test-run',
  schemaVersion: 1,
  kind: 'growth.campaign-pause-review',
  action: {
    id: 'growth.ads.campaign.pause',
    schemaVersion: 1,
    planId: 'plan.campaign-pause',
    planHash: 'a'.repeat(64),
  },
  projectId: 'true-resume',
  environmentId: 'production',
  target: {
    provider: 'googleAds',
    providerLabel: 'Google Ads',
    providerAccountId: 'account-7',
    campaignId: 'campaign-42',
  },
  effect: {
    title: 'Pause campaign delivery',
    summary: 'Requests the provider to pause delivery for this campaign.',
    risk: 'medium',
    reversibility: 'Enabling it later requires a separately reviewed action.',
  },
  evidence: {
    plannedRevision: 'evidence-revision-3',
    currentRevision: 'evidence-revision-3',
    status: 'current',
  },
  approval: {
    status: 'valid',
    approvalId: 'approval.campaign-pause',
    approvedBy: 'operator@example.test',
    expiresAt: '2026-08-03T10:09:00.000Z',
  },
  execution: {
    status: 'not-started',
    receiptId: null,
    completedAt: null,
  },
  verification: {
    status: 'not-started',
    checkedAt: null,
    notBefore: null,
    expiresAt: null,
    observedCampaignStatus: null,
  },
  status: 'ready-to-apply',
  headline: 'This campaign pause is approved and ready.',
  explanation: 'The approval matches the current plan and evidence.',
  nextStep: {
    id: 'apply-approved-pause',
    label: 'Apply the approved pause',
    reason: 'Use the guarded action while the plan and approval remain valid.',
    deepLink: '/advertising/all/overview',
  },
};

describe('campaign pause console review', () => {
  it('renders exact identity, lifecycle facts, impact, and one read-only next step', () => {
    const html = renderToStaticMarkup(<CampaignPauseReviewPanel review={review} />);

    expect(html).toContain('Google Ads · Account account-7 · Campaign campaign-42');
    expect(html).toContain('This campaign pause is approved and ready.');
    expect(html).toContain('Approved');
    expect(html).toContain('Not applied');
    expect(html).toContain('Pause campaign delivery · Medium risk');
    expect(html).toContain('Apply the approved pause');
    expect(html).not.toContain('<button');
  });

  it('shows only reviews belonging to campaigns in the selected provider view', () => {
    const metaReview: CampaignPauseReview = {
      ...review,
      action: { ...review.action, planId: 'plan.meta', planHash: 'b'.repeat(64) },
      target: {
        provider: 'metaAds',
        providerLabel: 'Meta Ads',
        providerAccountId: 'account-meta',
        campaignId: 'campaign-meta',
      },
    };
    const campaigns = [
      { id: 'googleAds:campaign-42', provider: 'googleAds' as const },
      { id: 'metaAds:campaign-meta', provider: 'metaAds' as const },
    ];

    expect(selectCampaignPauseReviews([review, metaReview], 'googleAds', campaigns)).toEqual([
      review,
    ]);
    expect(selectCampaignPauseReviews([review, metaReview], 'all', campaigns)).toEqual([
      review,
      metaReview,
    ]);
    expect(selectCampaignPauseReviews([review], 'all', [])).toEqual([]);
  });

  it('offers exact-plan approval only for a current unapproved plan', () => {
    const approvalRequired: CampaignPauseReview = {
      ...review,
      approval: {
        status: 'required',
        approvalId: null,
        approvedBy: null,
        expiresAt: null,
      },
      status: 'approval-required',
      headline: 'Approval is required before pausing this campaign.',
      explanation: 'No valid approval has been recorded for this exact pause plan.',
      nextStep: {
        id: 'request-approval',
        label: 'Review and approve this pause',
        reason: 'Confirm the exact target and effect.',
        deepLink: '/advertising/all/campaigns',
      },
    };
    const html = renderToStaticMarkup(
      <CampaignPauseReviewPanel review={approvalRequired} approvalAvailable />,
    );

    expect(html).toContain('Review approval');
    expect(campaignPauseApprovalCopy(approvalRequired)).toMatchObject({
      title: 'Approve this exact campaign pause?',
      description: 'Google Ads account account-7 · Campaign campaign-42',
      noEffectExplanation: expect.stringContaining(
        'does not contact Google Ads or pause the campaign',
      ),
    });

    const staleHtml = renderToStaticMarkup(
      <CampaignPauseReviewPanel
        review={{
          ...approvalRequired,
          evidence: { ...approvalRequired.evidence, status: 'stale' },
          status: 'plan-stale',
        }}
        approvalAvailable
      />,
    );
    expect(staleHtml).not.toContain('Review approval');
  });
});
