import { describe, expect, it } from 'vitest';
import {
  CONSOLE_ROUTES,
  consoleNavigation,
  resolveConsoleRoute,
  tabsForRoute,
  type ConsoleCapability,
} from './routes.js';

const baseCapabilities: ConsoleCapability[] = ['seo', 'advertising', 'analytics'];

describe('console route catalog', () => {
  it('declares the complete human-first page catalog with no retired top-level routes', () => {
    expect(CONSOLE_ROUTES.map((route) => route.path)).toEqual([
      '/overview',
      '/seo/overview',
      '/seo/opportunities',
      '/seo/pages',
      '/seo/queries',
      '/seo/site-health',
      '/seo/research',
      '/advertising/overview',
      '/advertising/campaigns',
      '/advertising/conversions',
      '/advertising/recommendations',
      '/advertising/change-history',
      '/analytics/overview',
      '/analytics/traffic',
      '/analytics/visitors',
      '/analytics/conversions',
      '/analytics/tracking-health',
      '/experiments/overview',
      '/experiments/running',
      '/experiments/results',
      '/experiments/ideas',
      '/connections',
      '/activity',
      '/settings',
      '/settings/automations',
      '/help',
    ]);
    expect(CONSOLE_ROUTES.every((route) => route.path.startsWith('/'))).toBe(true);
  });

  it('shows Experiments only when selected and resolves provider detail tabs', () => {
    const withoutExperiments = consoleNavigation(baseCapabilities).flatMap((group) => group.items);
    expect(withoutExperiments.map((item) => item.label)).not.toContain('Experiments');
    expect(resolveConsoleRoute('/experiments/results', baseCapabilities).path).toBe('/overview');

    const withExperiments = [...baseCapabilities, 'experiments'] satisfies ConsoleCapability[];
    const selectedNavigation = consoleNavigation(withExperiments).flatMap((group) => group.items);
    expect(selectedNavigation.map((item) => item.label)).toContain('Experiments');
    expect(resolveConsoleRoute('/experiments/results', withExperiments).path).toBe(
      '/experiments/results',
    );

    const provider = resolveConsoleRoute('/connections/google/data-sync', withExperiments);
    expect(provider).toEqual(
      expect.objectContaining({
        id: 'connections.provider.data-sync',
        family: 'connection-detail',
        label: 'Data sync',
      }),
    );
    expect(tabsForRoute(provider).map((route) => route.label)).toEqual([
      'Overview',
      'Access',
      'Resources',
      'Data sync',
      'Activity',
    ]);
  });
});
