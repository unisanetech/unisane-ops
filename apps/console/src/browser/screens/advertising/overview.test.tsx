import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { MarketingConsoleState } from '@unisane/growth/console';
import type { ConsoleRoute } from '../../../routes.js';
import { AdvertisingOverview } from './overview.js';

const metaView = {
  scope: 'metaAds' as const,
  label: 'Meta Ads',
  sources: [],
  headline: 'No Meta Ads campaign results are available yet.',
  detail: 'Connect Meta Ads before comparing performance.',
  metrics: [],
  campaigns: [],
  conversions: [],
  changeHistory: [],
  adSets: [],
  ads: [],
  creatives: [],
};

const state = {
  advertising: {
    combined: metaView,
    providers: [metaView],
    auditSections: [
      {
        id: 'readiness',
        label: 'Ads readiness',
        status: 'ready',
        summary: '91% ready with 6 actions.',
      },
    ],
  },
} as unknown as MarketingConsoleState;

const route = {
  id: 'advertising.metaAds.overview',
  path: '/advertising/meta/overview',
  family: 'advertising',
  label: 'Overview',
  title: 'Meta Ads overview',
  description: 'Review Meta Ads performance.',
  temporalMode: 'performance-range',
  advertisingPlatform: 'metaAds',
  advertisingSection: 'overview',
} satisfies ConsoleRoute;

describe('AdvertisingOverview', () => {
  it('does not present cross-platform audit readiness as Meta readiness', () => {
    const html = renderToStaticMarkup(
      <AdvertisingOverview
        state={state}
        route={route}
        navigate={vi.fn()}
        openOverlay={vi.fn()}
        openSupportingPane={vi.fn()}
        closeSupportingPane={vi.fn()}
      />,
    );

    expect(html).toContain('No Meta Ads performance summary is available for this period.');
    expect(html).toContain('Saved report snapshots are listed above');
    expect(html).not.toContain('Ads readiness');
    expect(html).not.toContain('91% ready');
  });
});
