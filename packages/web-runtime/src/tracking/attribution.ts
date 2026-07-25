import type { WebTrackingAttributionState } from './types';

type CookieOptions = {
  domain?: string;
  path?: string;
  maxAgeSec?: number;
  secure?: boolean;
};

const ATTRIBUTION_COOKIE_KEYS = {
  fbc: '_fbc',
  fbp: '_fbp',
  gclid: '_unisane_gclid',
  gbraid: '_unisane_gbraid',
  wbraid: '_unisane_wbraid',
  msclkid: '_unisane_msclkid',
  ttclid: '_unisane_ttclid',
} as const;

function parseCookieString(cookieString: string): Record<string, string> {
  return cookieString
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, entry) => {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex <= 0) return acc;
      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function buildCookieString(name: string, value: string, options: CookieOptions): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAgeSec !== undefined) parts.push(`Max-Age=${options.maxAgeSec}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  parts.push('SameSite=Lax');
  if (options.secure) parts.push('Secure');

  return parts.join('; ');
}

function createFbcValue(fbclid: string, now: number): string {
  return `fb.1.${now}.${fbclid}`;
}

export function readWebTrackingAttributionFromCookies(
  cookieString: string,
): WebTrackingAttributionState {
  const cookies = parseCookieString(cookieString);

  return {
    ...(cookies[ATTRIBUTION_COOKIE_KEYS.fbc] ? { fbc: cookies[ATTRIBUTION_COOKIE_KEYS.fbc] } : {}),
    ...(cookies[ATTRIBUTION_COOKIE_KEYS.fbp] ? { fbp: cookies[ATTRIBUTION_COOKIE_KEYS.fbp] } : {}),
    ...(cookies[ATTRIBUTION_COOKIE_KEYS.gclid]
      ? { gclid: cookies[ATTRIBUTION_COOKIE_KEYS.gclid] }
      : {}),
    ...(cookies[ATTRIBUTION_COOKIE_KEYS.gbraid]
      ? { gbraid: cookies[ATTRIBUTION_COOKIE_KEYS.gbraid] }
      : {}),
    ...(cookies[ATTRIBUTION_COOKIE_KEYS.wbraid]
      ? { wbraid: cookies[ATTRIBUTION_COOKIE_KEYS.wbraid] }
      : {}),
    ...(cookies[ATTRIBUTION_COOKIE_KEYS.msclkid]
      ? { msclkid: cookies[ATTRIBUTION_COOKIE_KEYS.msclkid] }
      : {}),
    ...(cookies[ATTRIBUTION_COOKIE_KEYS.ttclid]
      ? { ttclid: cookies[ATTRIBUTION_COOKIE_KEYS.ttclid] }
      : {}),
  };
}

export function mergeWebTrackingAttributionFromSearch(args: {
  current: WebTrackingAttributionState;
  search?: string;
  now?: number;
}): WebTrackingAttributionState {
  const query = args.search?.startsWith('?') ? args.search.slice(1) : (args.search ?? '');
  const params = new URLSearchParams(query);
  const next = { ...args.current };
  const now = args.now ?? Date.now();

  const gclid = params.get('gclid');
  const gbraid = params.get('gbraid');
  const wbraid = params.get('wbraid');
  const msclkid = params.get('msclkid');
  const ttclid = params.get('ttclid');
  const fbclid = params.get('fbclid');

  if (gclid) next.gclid = gclid;
  if (gbraid) next.gbraid = gbraid;
  if (wbraid) next.wbraid = wbraid;
  if (msclkid) next.msclkid = msclkid;
  if (ttclid) next.ttclid = ttclid;
  if (fbclid) next.fbc = createFbcValue(fbclid, now);

  return next;
}

export function createBrowserCookieAttributionStore(options?: {
  domain?: string;
  path?: string;
  maxAgeDays?: number;
}): {
  read: () => WebTrackingAttributionState;
  write: (state: WebTrackingAttributionState) => void;
} {
  return {
    read() {
      if (typeof document === 'undefined') return {};
      return readWebTrackingAttributionFromCookies(document.cookie);
    },
    write(state) {
      if (typeof document === 'undefined') return;
      const maxAgeSec = Math.max(1, Math.round((options?.maxAgeDays ?? 90) * 24 * 60 * 60));
      const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const cookieOptions: CookieOptions = {
        ...(options?.domain ? { domain: options.domain } : {}),
        path: options?.path ?? '/',
        maxAgeSec,
        secure,
      };

      if (state.fbc) {
        document.cookie = buildCookieString(ATTRIBUTION_COOKIE_KEYS.fbc, state.fbc, cookieOptions);
      }
      if (state.fbp) {
        document.cookie = buildCookieString(ATTRIBUTION_COOKIE_KEYS.fbp, state.fbp, cookieOptions);
      }
      if (state.gclid) {
        document.cookie = buildCookieString(
          ATTRIBUTION_COOKIE_KEYS.gclid,
          state.gclid,
          cookieOptions,
        );
      }
      if (state.gbraid) {
        document.cookie = buildCookieString(
          ATTRIBUTION_COOKIE_KEYS.gbraid,
          state.gbraid,
          cookieOptions,
        );
      }
      if (state.wbraid) {
        document.cookie = buildCookieString(
          ATTRIBUTION_COOKIE_KEYS.wbraid,
          state.wbraid,
          cookieOptions,
        );
      }
      if (state.msclkid) {
        document.cookie = buildCookieString(
          ATTRIBUTION_COOKIE_KEYS.msclkid,
          state.msclkid,
          cookieOptions,
        );
      }
      if (state.ttclid) {
        document.cookie = buildCookieString(
          ATTRIBUTION_COOKIE_KEYS.ttclid,
          state.ttclid,
          cookieOptions,
        );
      }
    },
  };
}
