import type { KeywordCandidate, KeywordCandidateFile } from '../schema/keyword.js';
import type { KeywordSeed, KeywordSeedFile } from '../schema/seed.js';
import { getKeywordPatternPack } from './pattern-packs.js';
import { createKeywordId, normalizeKeywordTerm } from './normalize-keywords.js';

export type ExpandKeywordSeedsOptions = {
  seedFile: KeywordSeedFile;
  patternPackId: string;
};

export function expandKeywordSeeds(options: ExpandKeywordSeedsOptions): KeywordCandidateFile {
  const patternPack = getKeywordPatternPack(options.patternPackId);
  const candidates = new Map<string, KeywordCandidate>();

  for (const seed of options.seedFile.seeds) {
    for (const pattern of patternPack.patterns) {
      const term = renderPattern(pattern, seed);
      const normalizedTerm = normalizeKeywordTerm(term);
      if (!normalizedTerm) {
        continue;
      }

      const key = `${seed.platformId}:${normalizedTerm}`;
      if (candidates.has(key)) {
        continue;
      }

      candidates.set(key, {
        id: createKeywordId([patternPack.id, seed.id, normalizedTerm]),
        term,
        normalizedTerm,
        platformId: seed.platformId,
        sourceSeedId: seed.id,
        sourceTerm: seed.term,
        pattern,
        patternPack: patternPack.id,
        intent: seed.intent,
        topic: seed.topic,
        role: seed.role,
        category: seed.category,
        country: seed.country,
        language: seed.language,
      });
    }
  }

  return {
    version: 1,
    platformId: options.seedFile.platformId,
    patternPack: patternPack.id,
    candidates: Array.from(candidates.values()).sort((left, right) =>
      left.normalizedTerm.localeCompare(right.normalizedTerm),
    ),
  };
}

function renderPattern(pattern: string, seed: KeywordSeed): string {
  const topic = seed.topic?.trim() || seed.term.trim();
  return pattern.replaceAll('{topic}', topic).replace(/\s+/g, ' ').trim();
}
