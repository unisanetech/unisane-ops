import type { PageOpportunity } from '../schema/opportunity.js';

export type SeoOpportunityPatternPack = {
  id: string;
  description: string;
  sourceKeywordPatternPacks: string[];
  basePath: string;
  cta: {
    label: string;
    target: string;
  };
  internalLinks: {
    hubLabel?: string;
    maxRelated: number;
    includeConversionLinks: boolean;
  };
  createTitle: (label: string) => string;
  createH1: (label: string) => string;
  createMetaDescription: (label: string) => string;
  createSections: (label: string) => PageOpportunity['sections'];
  createInternalLinks: (basePath: string) => PageOpportunity['internalLinks'];
};

const genericSeoPatternPack: SeoOpportunityPatternPack = {
  id: 'generic',
  description: 'Generic SEO landing-page planning defaults.',
  sourceKeywordPatternPacks: ['saas', 'tool', 'marketplace', 'commerce', 'local-service'],
  basePath: 'seo-pages',
  cta: {
    label: 'Get started',
    target: '/',
  },
  internalLinks: {
    maxRelated: 3,
    includeConversionLinks: false,
  },
  createTitle: (label) => `${label} Page`,
  createH1: (label) => label,
  createMetaDescription: (label) =>
    `Plan a focused ${label.toLowerCase()} page with clear keywords, sections, links, and CTA.`,
  createSections: (label) => [
    {
      id: 'overview',
      heading: label,
      purpose: 'State the page purpose and match the primary keyword directly.',
      required: true,
    },
    {
      id: 'decision-help',
      heading: 'How to choose',
      purpose: 'Help users decide whether this page matches their need.',
      required: true,
    },
    {
      id: 'next-step',
      heading: 'Next step',
      purpose: 'Use a clear CTA mapped to the product workflow.',
      required: true,
    },
  ],
  createInternalLinks: (basePath) => [
    {
      label: 'SEO opportunities',
      path: `/${basePath}`,
    },
  ],
};

const trueResumeSeoPatternPack: SeoOpportunityPatternPack = {
  id: 'true-resume',
  description: 'True Resume resume examples and role-specific resume SEO defaults.',
  sourceKeywordPatternPacks: ['resume-examples'],
  basePath: 'resume-examples',
  cta: {
    label: 'Start with this example',
    target: '/resumes/new',
  },
  internalLinks: {
    hubLabel: 'All resume examples',
    maxRelated: 3,
    includeConversionLinks: true,
  },
  createTitle: (label) => `${label} Resume Examples and Format`,
  createH1: (label) => `${label} resume examples and format`,
  createMetaDescription: (label) =>
    `Compare ${label.toLowerCase()} resume examples for different experience levels, then use the format that fits your background.`,
  createSections: (label) => [
    {
      id: 'examples-by-experience',
      heading: `${label} resume examples by experience level`,
      purpose: 'Show several complete examples for different candidate stages.',
      required: true,
    },
    {
      id: 'what-to-include',
      heading: `What to include in a ${label.toLowerCase()} resume`,
      purpose: 'Explain the practical sections, skills, and proof points users should prepare.',
      required: true,
    },
    {
      id: 'format-tips',
      heading: `${label} resume format tips`,
      purpose: 'Keep formatting advice short, scannable, and tied to recruiter readability.',
      required: true,
    },
    {
      id: 'related-examples',
      heading: 'Related resume examples',
      purpose: 'Link to adjacent roles and the main examples hub to prevent orphan pages.',
      required: true,
    },
    {
      id: 'start-with-example',
      heading: 'Start with this example',
      purpose: 'Move readers into the builder with the selected sample content.',
      required: true,
    },
  ],
  createInternalLinks: (basePath) => [
    {
      label: 'All resume examples',
      path: `/${basePath}`,
    },
    {
      label: 'Resume templates',
      path: '/templates',
    },
  ],
};

export const seoOpportunityPatternPacks = {
  generic: genericSeoPatternPack,
  'true-resume': trueResumeSeoPatternPack,
} satisfies Record<string, SeoOpportunityPatternPack>;

export type BuiltInSeoOpportunityPatternPackId = keyof typeof seoOpportunityPatternPacks;

export function getSeoOpportunityPatternPack(id: string): SeoOpportunityPatternPack {
  return (
    seoOpportunityPatternPacks[id as BuiltInSeoOpportunityPatternPackId] ??
    seoOpportunityPatternPacks.generic
  );
}

export function getSeoOpportunityPatternPackForKeywordPack(
  sourceKeywordPatternPack: string,
): SeoOpportunityPatternPack {
  return (
    Object.values(seoOpportunityPatternPacks).find((pack) =>
      pack.sourceKeywordPatternPacks.includes(sourceKeywordPatternPack),
    ) ?? seoOpportunityPatternPacks.generic
  );
}
