export type KeywordPatternPack = {
  id: string;
  description: string;
  patterns: string[];
};

export const keywordPatternPacks = {
  'resume-examples': {
    id: 'resume-examples',
    description: 'Resume examples, formats, templates, and role-specific resume modifiers.',
    patterns: [
      '{topic}',
      '{topic} resume example',
      '{topic} resume examples',
      '{topic} resume format',
      '{topic} resume template',
      '{topic} resume sample',
      'entry level {topic} resume',
      'senior {topic} resume',
      '{topic} resume skills',
      '{topic} resume summary',
      '{topic} resume bullet points',
      '{topic} resume objective',
      'best {topic} resume',
    ],
  },
  saas: {
    id: 'saas',
    description: 'B2B SaaS product, workflow, and buying-intent keyword modifiers.',
    patterns: [
      '{topic}',
      '{topic} software',
      '{topic} platform',
      '{topic} tool',
      'best {topic} software',
      '{topic} alternatives',
      '{topic} pricing',
      '{topic} for small business',
    ],
  },
  tool: {
    id: 'tool',
    description: 'Free tool, generator, checker, and converter keyword modifiers.',
    patterns: [
      '{topic}',
      '{topic} tool',
      '{topic} generator',
      '{topic} checker',
      'free {topic} tool',
      'online {topic} tool',
      'best {topic} tool',
    ],
  },
  marketplace: {
    id: 'marketplace',
    description: 'Marketplace category and buyer-intent keyword modifiers.',
    patterns: [
      '{topic}',
      '{topic} marketplace',
      'find {topic}',
      'hire {topic}',
      'best {topic}',
      '{topic} services',
    ],
  },
  commerce: {
    id: 'commerce',
    description: 'Commerce category, comparison, and shopping keyword modifiers.',
    patterns: [
      '{topic}',
      'buy {topic}',
      'best {topic}',
      '{topic} online',
      '{topic} price',
      '{topic} reviews',
    ],
  },
  'local-service': {
    id: 'local-service',
    description: 'Local service discovery and transactional keyword modifiers.',
    patterns: [
      '{topic}',
      '{topic} near me',
      '{topic} service',
      'best {topic} near me',
      'local {topic}',
      '{topic} cost',
    ],
  },
} satisfies Record<string, KeywordPatternPack>;

export type BuiltInKeywordPatternPackId = keyof typeof keywordPatternPacks;

export function getKeywordPatternPack(id: string): KeywordPatternPack {
  const patternPack = keywordPatternPacks[id as BuiltInKeywordPatternPackId];
  if (!patternPack) {
    throw new Error(
      `Unknown keyword pattern pack "${id}". Available packs: ${Object.keys(keywordPatternPacks).join(', ')}.`,
    );
  }
  return patternPack;
}
