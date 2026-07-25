import { resolveSeoUrl } from './canonical-url';
import type {
  JsonLd,
  OrganizationJsonLdInput,
  SiteSeoConfig,
  SoftwareApplicationJsonLdInput,
  WebSiteJsonLdInput,
} from './types';

export function createOrganizationJsonLd(
  site: SiteSeoConfig,
  input: OrganizationJsonLdInput = {},
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.siteName,
    url: site.siteUrl,
    description: input.description ?? site.defaultDescription,
    logo: resolveSeoUrl(site.siteUrl, input.logo ?? site.defaultOgImage),
    sameAs: input.sameAs,
  };
}

export function createWebSiteJsonLd(site: SiteSeoConfig, input: WebSiteJsonLdInput = {}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.siteName,
    url: site.siteUrl,
    description: input.description ?? site.defaultDescription,
  };
}

export function createSoftwareApplicationJsonLd(
  site: SiteSeoConfig,
  input: SoftwareApplicationJsonLdInput = {},
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: site.siteName,
    url: site.siteUrl,
    description: input.description ?? site.defaultDescription,
    applicationCategory: input.category ?? 'BusinessApplication',
    applicationSubCategory: input.applicationSubCategory,
    operatingSystem: input.operatingSystem ?? 'Web',
    offers: input.offers,
  };
}
