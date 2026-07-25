export type SeoPath = `/${string}`;
export type SeoAbsoluteUrl = `https://${string}` | `http://${string}`;
export type SeoUrlInput = SeoPath | SeoAbsoluteUrl;
export type SitemapChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export type SiteSeoConfig = {
  siteName: string;
  siteUrl: SeoAbsoluteUrl;
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultLocale: string;
  defaultOgImage?: SeoUrlInput;
  twitterHandle?: string;
  indexingEnabled?: boolean;
};

export type PageSeoInput = {
  title: string;
  description: string;
  path: SeoPath;
  index?: boolean;
  image?: SeoUrlInput;
  alternates?: Record<string, SeoUrlInput>;
  openGraphType?: 'website' | 'article';
};

export type SitemapEntry = {
  path: SeoPath;
  lastModified?: Date | string | undefined;
  changeFrequency?: SitemapChangeFrequency | undefined;
  priority?: number;
  index?: boolean;
};

export type RobotsInput = {
  allow?: SeoPath[];
  disallow?: SeoPath[];
  sitemap?: boolean;
};

export type JsonLd = {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: unknown;
};

export type OrganizationJsonLdInput = {
  description?: string;
  logo?: SeoUrlInput;
  sameAs?: string[];
};

export type WebSiteJsonLdInput = {
  description?: string;
};

export type SoftwareApplicationJsonLdInput = {
  description?: string;
  category?: string;
  operatingSystem?: string;
  applicationSubCategory?: string;
  offers?: {
    price?: number;
    priceCurrency?: string;
  };
};
