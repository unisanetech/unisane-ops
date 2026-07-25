import type { MetadataRoute } from 'next';
import { buildCanonicalUrl } from './canonical-url';
import type { SiteSeoConfig, SitemapEntry } from './types';

export function createSitemap(site: SiteSeoConfig, entries: SitemapEntry[]): MetadataRoute.Sitemap {
  if (site.indexingEnabled === false) {
    return [];
  }

  return entries
    .filter((entry) => entry.index !== false)
    .map((entry) => ({
      url: buildCanonicalUrl(site.siteUrl, entry.path),
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    }));
}
