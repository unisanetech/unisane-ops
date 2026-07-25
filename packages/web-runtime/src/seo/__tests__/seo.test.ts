import { describe, expect, it } from 'vitest';
import { buildAlternateLanguageUrls, buildCanonicalUrl } from '../canonical-url';
import { createOrganizationJsonLd, createSoftwareApplicationJsonLd } from '../json-ld';
import { createNoIndexMetadata, createPageMetadata } from '../page-metadata';
import { createRobots } from '../robots';
import { createSitemap } from '../sitemap';
import type { SiteSeoConfig } from '../types';

const site = {
  siteName: 'Unisane',
  siteUrl: 'https://example.com',
  defaultTitle: 'Unisane Platform',
  titleTemplate: '%s | Unisane',
  defaultDescription: 'Composable vertical platforms.',
  defaultLocale: 'en_US',
  defaultOgImage: '/images/social.png',
} satisfies SiteSeoConfig;

describe('@unisane/web-runtime/seo', () => {
  it('builds canonical and alternate URLs from one site base', () => {
    expect(buildCanonicalUrl('https://example.com/', '/pricing')).toBe(
      'https://example.com/pricing',
    );
    expect(
      buildAlternateLanguageUrls(site.siteUrl, {
        en: '/pricing',
        de: 'https://de.example.com/preise',
      }),
    ).toEqual({
      en: 'https://example.com/pricing',
      de: 'https://de.example.com/preise',
    });
  });

  it('derives page metadata and explicit no-index behavior', () => {
    const metadata = createPageMetadata(site, {
      title: 'Pricing',
      description: 'Choose a plan.',
      path: '/pricing',
      alternates: { en: '/pricing' },
    });

    expect(metadata.alternates).toEqual({
      canonical: 'https://example.com/pricing',
      languages: { en: 'https://example.com/pricing' },
    });
    expect(metadata.openGraph).toMatchObject({
      url: 'https://example.com/pricing',
      images: [{ url: 'https://example.com/images/social.png' }],
    });
    expect(
      createNoIndexMetadata(site, {
        title: 'Private',
        description: 'Private page.',
        path: '/private',
      }).robots,
    ).toEqual({ index: false, follow: false });
  });

  it('disables robots and sitemap output when site indexing is disabled', () => {
    const privateSite = { ...site, indexingEnabled: false } satisfies SiteSeoConfig;
    expect(createRobots(privateSite)).toEqual({
      rules: [{ userAgent: '*', disallow: '/' }],
      host: 'https://example.com',
    });
    expect(createSitemap(privateSite, [{ path: '/' }])).toEqual([]);
  });

  it('filters non-indexable sitemap entries and emits canonical URLs', () => {
    expect(
      createSitemap(site, [
        { path: '/', priority: 1 },
        { path: '/private', index: false },
      ]),
    ).toEqual([
      {
        url: 'https://example.com/',
        lastModified: undefined,
        changeFrequency: undefined,
        priority: 1,
      },
    ]);
  });

  it('derives organization and software JSON-LD from site truth', () => {
    expect(createOrganizationJsonLd(site)).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Unisane',
      logo: 'https://example.com/images/social.png',
    });
    expect(createSoftwareApplicationJsonLd(site)).toMatchObject({
      '@type': 'SoftwareApplication',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
    });
  });
});
