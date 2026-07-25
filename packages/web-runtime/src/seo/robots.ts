import type { MetadataRoute } from 'next';
import type { RobotsInput, SiteSeoConfig } from './types';

export function createRobots(site: SiteSeoConfig, input: RobotsInput = {}): MetadataRoute.Robots {
  if (site.indexingEnabled === false) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      host: site.siteUrl,
    };
  }

  const allow = input.allow && input.allow.length > 0 ? input.allow : ['/'];
  const disallow = input.disallow && input.disallow.length > 0 ? input.disallow : undefined;

  return {
    rules: [
      {
        userAgent: '*',
        allow,
        disallow,
      },
    ],
    sitemap: input.sitemap === false ? undefined : `${site.siteUrl}/sitemap.xml`,
    host: site.siteUrl,
  };
}
