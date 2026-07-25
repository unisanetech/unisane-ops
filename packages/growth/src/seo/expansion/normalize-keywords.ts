export function normalizeKeywordTerm(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, ' ');
}

export function createKeywordId(parts: string[]): string {
  return parts
    .map((part) => normalizeKeywordTerm(part).replace(/\s+/g, '-'))
    .filter(Boolean)
    .join(':');
}
