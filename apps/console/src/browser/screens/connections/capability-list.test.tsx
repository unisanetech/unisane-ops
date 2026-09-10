import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { GrowthCapabilityReview } from '@unisane/growth/console';
import { MetaCapabilityList } from './capability-list.js';

describe('Meta capability presentation', () => {
  it('explains an unavailable host without inventing readiness', () => {
    const html = renderToStaticMarkup(<MetaCapabilityList />);
    expect(html).toContain('not supplied by this console host');
    expect(html).not.toContain('prerequisites satisfied');
  });
  it('presents shared reasons, next steps and verification limits', () => {
    const review: GrowthCapabilityReview = {
      schemaVersion: 1,
      actionId: 'growth.capabilities.review',
      projectId: 'store',
      environmentId: 'production',
      provider: 'meta',
      observedAt: '2026-09-06T00:00:00Z',
      liveVerified: false,
      capabilities: [
        {
          id: 'meta.ads.reporting',
          title: 'Ads reports',
          implementation: 'implemented',
          verification: 'fixture-proven',
          effect: 'read-network',
          hostState: 'bound',
          hostReason: 'Host callback bound.',
          assessment: 'ads-insights',
          executionSurfaces: ['cli'],
          nextStep: 'Refresh connection verification.',
          status: 'blocked',
          accountState: 'evidence-stale',
          reasons: ['Recorded access is stale.'],
        },
      ],
      presentation: {
        headline: 'No recorded read prerequisites satisfied.',
        whyItMatters: 'This is an offline review.',
      },
    };
    const html = renderToStaticMarkup(<MetaCapabilityList review={review} />);
    expect(html).toContain('Recorded access is stale.');
    expect(html).toContain('Refresh connection verification.');
    expect(html).toContain('Not available for execution');
    expect(html).toContain('Live verification has not been performed');
    expect(html).toContain('Execution interfaces: cli');
  });
});
