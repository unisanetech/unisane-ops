import { describe, expect, it } from 'vitest';
import {
  mergeWebTrackingAttributionFromSearch,
  readWebTrackingAttributionFromCookies,
} from '../attribution';

describe('web tracking attribution helpers', () => {
  it('reads standard attribution cookies', () => {
    const state = readWebTrackingAttributionFromCookies(
      '_fbc=fb.1.111.fbclid; _fbp=fb.1.111.browser; _unisane_gclid=gclid-123',
    );

    expect(state).toEqual({
      fbc: 'fb.1.111.fbclid',
      fbp: 'fb.1.111.browser',
      gclid: 'gclid-123',
    });
  });

  it('captures click ids from the url search string', () => {
    const state = mergeWebTrackingAttributionFromSearch({
      current: {},
      search: '?gclid=gclid-abc&fbclid=fbclid-xyz&ttclid=ttclid-123',
      now: 1700000000000,
    });

    expect(state).toEqual({
      gclid: 'gclid-abc',
      fbc: 'fb.1.1700000000000.fbclid-xyz',
      ttclid: 'ttclid-123',
    });
  });
});
