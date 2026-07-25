import type { Metadata } from 'next';
import { resolveSeoUrl } from './canonical-url';
import type { SiteSeoConfig } from './types';

export function createSiteMetadata(site: SiteSeoConfig): Metadata {
  const indexEnabled = site.indexingEnabled !== false;
  const defaultImage = resolveSeoUrl(site.siteUrl, site.defaultOgImage);

  return {
    metadataBase: new URL(site.siteUrl),
    title: {
      default: site.defaultTitle,
      template: site.titleTemplate,
    },
    description: site.defaultDescription,
    alternates: {
      canonical: site.siteUrl,
    },
    robots: {
      index: indexEnabled,
      follow: indexEnabled,
    },
    openGraph: {
      type: 'website',
      siteName: site.siteName,
      locale: site.defaultLocale,
      title: site.defaultTitle,
      description: site.defaultDescription,
      url: site.siteUrl,
      images: defaultImage ? [{ url: defaultImage }] : undefined,
    },
    twitter: {
      card: defaultImage ? 'summary_large_image' : 'summary',
      title: site.defaultTitle,
      description: site.defaultDescription,
      images: defaultImage ? [defaultImage] : undefined,
      creator: site.twitterHandle,
    },
  };
}
