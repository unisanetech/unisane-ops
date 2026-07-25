import type { SeoAbsoluteUrl, SeoPath, SeoUrlInput } from './types';

function isAbsoluteUrl(value: string): value is SeoAbsoluteUrl {
  return value.startsWith('https://') || value.startsWith('http://');
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function buildCanonicalUrl(siteUrl: SeoAbsoluteUrl, path: SeoPath): string {
  const base = `${trimTrailingSlash(siteUrl)}/`;
  return new URL(path, base).toString();
}

export function resolveSeoUrl(siteUrl: SeoAbsoluteUrl, value?: SeoUrlInput): string | undefined {
  if (!value) return undefined;
  return isAbsoluteUrl(value) ? value : buildCanonicalUrl(siteUrl, value);
}

export function buildAlternateLanguageUrls(
  siteUrl: SeoAbsoluteUrl,
  alternates?: Record<string, SeoUrlInput>,
): Record<string, string> | undefined {
  if (!alternates || Object.keys(alternates).length === 0) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(alternates).map(([key, value]) => [key, resolveSeoUrl(siteUrl, value)!]),
  );
}
