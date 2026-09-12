import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWebTrackingClient } from '../client';
import { createBrowserGtmTransport } from '../next/gtm';
import {
  mergeWebTrackingAttributionFromSearch,
  readWebTrackingAttributionFromCookies,
} from '../attribution';
import { createWebTrackingDedupeStore } from '../dedupe';

const granted = { adStorage: 'granted', adUserData: 'granted' } as const;
function setup(enabled = true, consent = {}) {
  const store = {
    read: vi.fn(() => ({ fbp: 'fb.1.123.browser' })),
    write: vi.fn(),
    clear: vi.fn(),
  };
  const transport = { push: vi.fn(), setConsent: vi.fn() };
  const client = createWebTrackingClient({
    config: { appId: 'test', enabled, consent: { defaultState: consent } },
    attributionStore: store,
    transport,
  });
  return { client, store, transport };
}
afterEach(() => vi.unstubAllGlobals());

describe('tracking lifecycle guarantees', () => {
  it('has no store or transport side effects while disabled', () => {
    const { client, store, transport } = setup(false, granted);
    client.captureAttribution('?fbclid=AbC');
    client.setConsent(granted);
    client.track({ name: 'view' });
    client.trackPageView();
    expect(store.read).not.toHaveBeenCalled();
    expect(store.write).not.toHaveBeenCalled();
    expect(store.clear).not.toHaveBeenCalled();
    expect(transport.push).not.toHaveBeenCalled();
    expect(transport.setConsent).not.toHaveBeenCalled();
  });
  it('captures only after consent and removes identifiers on withdrawal', () => {
    const { client, store, transport } = setup();
    expect(client.captureAttribution('?fbclid=AbC')).toEqual({});
    expect(store.read).not.toHaveBeenCalled();
    client.setConsent(granted);
    client.captureAttribution('?fbclid=AbC');
    client.track({ name: 'view' });
    expect(transport.push.mock.calls.at(-1)?.[0].fbp).toBe('fb.1.123.browser');
    client.setConsent({ adStorage: 'denied' });
    client.track({ name: 'view' });
    expect(store.clear).toHaveBeenCalledOnce();
    expect(client.getAttribution()).toEqual({});
    expect(transport.push.mock.calls.at(-1)?.[0]).not.toHaveProperty('fbp');
  });
  it('withholds attribution when storage is granted but advertising data use is denied', () => {
    const { client, transport } = setup(true, { adStorage: 'granted' });
    client.captureAttribution('?fbclid=AbC');
    client.track({ name: 'view' });
    expect(transport.push.mock.calls[0]?.[0]).not.toHaveProperty('fbc');
  });
  it('refreshes browser identifiers and keeps the original timestamp for the same click', () => {
    const current = { fbc: 'fb.1.123.AbC' };
    expect(
      mergeWebTrackingAttributionFromSearch({ current, search: '?fbclid=AbC', now: 999 }),
    ).toEqual(current);
    expect(
      mergeWebTrackingAttributionFromSearch({ current, search: '?fbclid=NewABC', now: 999 }).fbc,
    ).toBe('fb.1.999.NewABC');
    expect(
      mergeWebTrackingAttributionFromSearch({ current, search: '?fbclid=' + 'X'.repeat(481) }),
    ).toEqual(current);
  });
  it('ignores malformed cookies instead of breaking tracking', () => {
    expect(readWebTrackingAttributionFromCookies('bad=%E0%A4%A; _fbp=fb.1.123.browser')).toEqual({
      fbp: 'fb.1.123.browser',
    });
  });
  it('honors a semantic dedupe key even when every call has a new random event id', () => {
    const { client, transport } = setup();
    client.track({ name: 'start', eventId: 'a', dedupe: { key: 'same-action' } });
    client.track({ name: 'start', eventId: 'b', dedupe: { key: 'same-action' } });
    expect(transport.push).toHaveBeenCalledOnce();
  });
  it('does not expire a long-lived key when another event has a short TTL', () => {
    const store = createWebTrackingDedupeStore();
    store.shouldDrop('long', 10000, 0);
    store.shouldDrop('short', 1, 50);
    expect(store.shouldDrop('long', 10000, 100)).toBe(true);
  });
  it('does not let custom parameters override the canonical event identity', () => {
    const { client, transport } = setup();
    client.track({
      name: 'view',
      eventId: 'real',
      params: { event: 'purchase', eventId: 'fake', appId: 'foreign' },
    });
    expect(transport.push.mock.calls[0]?.[0]).toMatchObject({
      event: 'view',
      event_id: 'real',
      app_id: 'test',
    });
  });
  it('clears GTM merging state before each event', () => {
    const window = { dataLayer: [] as unknown[] };
    vi.stubGlobal('window', window);
    const transport = createBrowserGtmTransport({ gtm: { containerId: 'GTM-TEST' } });
    transport.push({ event: 'view', items: [1, 2, 3] });
    transport.push({ event: 'add', items: [1] });
    expect(window.dataLayer[2]).toMatchObject({ items: null, fbp: null, transaction_id: null });
    expect(window.dataLayer[3]).toEqual({ event: 'add', items: [1] });
  });
});
