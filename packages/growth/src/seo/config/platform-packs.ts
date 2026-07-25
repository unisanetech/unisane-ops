export type SeoPlatformPack = {
  platformId: string;
  seoPatternPack: string;
  keywordPatternPack: string;
  defaultCountry: string;
  defaultLanguage: string;
  opportunityDefaults: {
    basePath: string;
    ctaLabel: string;
    ctaTarget: string;
  };
  internalLinkDefaults: {
    hubLabel?: string;
    maxRelated: number;
    includeConversionLinks: boolean;
  };
};

const genericPlatformPack: SeoPlatformPack = {
  platformId: 'generic',
  seoPatternPack: 'generic',
  keywordPatternPack: 'tool',
  defaultCountry: 'US',
  defaultLanguage: 'en',
  opportunityDefaults: {
    basePath: 'seo-pages',
    ctaLabel: 'Get started',
    ctaTarget: '/',
  },
  internalLinkDefaults: {
    maxRelated: 3,
    includeConversionLinks: false,
  },
};

const platformPacks: Record<string, SeoPlatformPack> = {
  'true-resume': {
    platformId: 'true-resume',
    seoPatternPack: 'true-resume',
    keywordPatternPack: 'resume-examples',
    defaultCountry: 'US',
    defaultLanguage: 'en',
    opportunityDefaults: {
      basePath: 'resume-examples',
      ctaLabel: 'Start with this example',
      ctaTarget: '/resumes/new',
    },
    internalLinkDefaults: {
      hubLabel: 'All resume examples',
      maxRelated: 3,
      includeConversionLinks: true,
    },
  },
} satisfies Record<string, SeoPlatformPack>;

export function getSeoPlatformPack(platformId: string): SeoPlatformPack {
  return (
    platformPacks[platformId] ?? {
      ...genericPlatformPack,
      platformId,
    }
  );
}
