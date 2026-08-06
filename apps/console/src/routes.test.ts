import { describe, expect, it } from 'vitest';
import { CONSOLE_ROUTES } from './routes.js';

function mode(path: string) {
  return CONSOLE_ROUTES.find((route) => route.path === path)?.temporalMode;
}

describe('console temporal route semantics', () => {
  it('separates performance, event, snapshot, evidence-context, and current-state pages', () => {
    expect(mode('/seo/pages')).toBe('performance-range');
    expect(mode('/advertising/all/change-history')).toBe('event-range');
    expect(mode('/seo/research')).toBe('snapshot');
    expect(mode('/seo/opportunities')).toBe('evidence-context');
    expect(mode('/analytics/tracking-health')).toBe('current');
  });

  it('does not expose the removed data history destination', () => {
    expect(CONSOLE_ROUTES.some((route) => route.path === '/data-history')).toBe(false);
  });
});
