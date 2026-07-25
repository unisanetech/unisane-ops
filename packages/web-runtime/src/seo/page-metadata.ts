import type { Metadata } from 'next';
import { buildAlternateLanguageUrls, buildCanonicalUrl, resolveSeoUrl } from './canonical-url';
import type { PageSeoInput, SiteSeoConfig } from './types';

function isIndexEnabled(site: SiteSeoConfig, page: PageSeoInput): boolean {
  return site.indexingEnabled !== false && page.index !== false;
}

export function createPageMetadata(site: SiteSeoConfig, page: PageSeoInput): Metadata {
  const canonical = buildCanonicalUrl(site.siteUrl, page.path);
  const indexEnabled = isIndexEnabled(site, page);
  const image = resolveSeoUrl(site.siteUrl, page.image ?? site.defaultOgImage);

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical,
      languages: buildAlternateLanguageUrls(site.siteUrl, page.alternates),
    },
    robots: {
      index: indexEnabled,
      follow: indexEnabled,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: canonical,
      type: page.openGraphType ?? 'website',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: page.title,
      description: page.description,
      images: image ? [image] : undefined,
    },
  };
}

export function createNoIndexMetadata(
  site: SiteSeoConfig,
  page: Omit<PageSeoInput, 'index'>,
): Metadata {
  return createPageMetadata(site, { ...page, index: false });
}

export function createNoIndexRobotsMetadata(): Metadata {
  return {
    robots: {
      index: false,
      follow: false,
    },
  };
}
