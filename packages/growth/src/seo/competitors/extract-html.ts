import type {
  CompetitorContentPattern,
  CompetitorKeywordSignal,
  CompetitorKeywordSignalSource,
  CompetitorOnPageSignals,
} from '../schema/competitor.js';

export type ExtractCompetitorHtmlMetadataOptions = {
  html: string;
  url: string;
};

export type ExtractCompetitorHtmlMetadataResult = {
  title?: string;
  h1?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  categoryPath: string[];
  headings: string[];
  contentPatterns: CompetitorContentPattern[];
  keywordSignals: CompetitorKeywordSignal[];
  onPageSignals: CompetitorOnPageSignals;
};

export function extractCompetitorHtmlMetadata(
  options: ExtractCompetitorHtmlMetadataOptions,
): ExtractCompetitorHtmlMetadataResult {
  const rawHtml = options.html;
  const normalizedHtml = stripIgnoredBlocks(options.html);
  const title = cleanText(readTagText(normalizedHtml, 'title'));
  const h1Tags = readTagTexts(normalizedHtml, 'h1').map(cleanText).filter(isDefined);
  const h1 = h1Tags[0];
  const metaDescription = cleanText(readMetaContent(normalizedHtml, 'description'));
  const canonicalUrl = cleanUrl(readLinkHref(normalizedHtml, 'canonical'), options.url);
  const headings = uniqueStrings(
    readHeadings(normalizedHtml).map(cleanText).filter(isDefined),
  ).slice(0, 12);
  const categoryPath = inferCategoryPath(normalizedHtml, options.url);
  const contentPatterns = inferContentPatterns(headings);
  const bodyText = cleanText(htmlToText(readBodyHtml(normalizedHtml) ?? normalizedHtml)) ?? '';
  const keywordSignals = extractKeywordSignals({
    title,
    metaDescription,
    h1Tags,
    headings,
    bodyText,
  });
  const onPageSignals = extractOnPageSignals({
    html: normalizedHtml,
    rawHtml,
    url: options.url,
    title,
    metaDescription,
    canonicalUrl,
    h1Count: h1Tags.length,
    bodyText,
  });

  return {
    title,
    h1,
    metaDescription,
    canonicalUrl,
    categoryPath,
    headings,
    contentPatterns,
    keywordSignals,
    onPageSignals,
  };
}

function stripIgnoredBlocks(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

function readTagText(html: string, tag: string): string | undefined {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(html);
  return match?.[1] ? htmlToText(match[1]) : undefined;
}

function readTagTexts(html: string, tag: string): string[] {
  const values: string[] = [];
  const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  let match = pattern.exec(html);
  while (match) {
    values.push(htmlToText(match[1] ?? ''));
    match = pattern.exec(html);
  }
  return values;
}

function readBodyHtml(html: string): string | undefined {
  return /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1];
}

function readMetaContent(html: string, name: string): string | undefined {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = readAttributes(tag);
    const tagName = attributes.name?.toLowerCase() ?? attributes.property?.toLowerCase();
    if (tagName === name.toLowerCase()) {
      return attributes.content;
    }
  }
  return undefined;
}

function readLinkHref(html: string, rel: string): string | undefined {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attributes = readAttributes(tag);
    const relValue = attributes.rel?.toLowerCase();
    if (relValue?.split(/\s+/).includes(rel.toLowerCase())) {
      return attributes.href;
    }
  }
  return undefined;
}

function readHeadings(html: string): string[] {
  const headings: string[] = [];
  const headingPattern = /<h([2-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match = headingPattern.exec(html);
  while (match) {
    headings.push(htmlToText(match[2] ?? ''));
    match = headingPattern.exec(html);
  }
  return headings;
}

function countHeadingLevel(html: string, level: 2 | 3): number {
  return html.match(new RegExp(`<h${level}\\b`, 'gi'))?.length ?? 0;
}

function readAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributePattern = /([a-zA-Z_:.-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match = attributePattern.exec(tag);
  while (match) {
    const key = match[1]?.toLowerCase();
    const value = match[3] ?? match[4] ?? match[5];
    if (key && value) {
      attributes[key] = decodeHtmlEntities(value.trim());
    }
    match = attributePattern.exec(tag);
  }
  return attributes;
}

function inferCategoryPath(html: string, url: string): string[] {
  const breadcrumbLabels = readBreadcrumbLabels(html);
  if (breadcrumbLabels.length > 0) {
    return breadcrumbLabels;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname
      .split('/')
      .filter((segment) => segment.length > 0)
      .map((segment) => titleCase(segment.replace(/[-_]+/g, ' ')));
  } catch {
    return [];
  }
}

function readBreadcrumbLabels(html: string): string[] {
  const breadcrumbBlock = html.match(
    /<(nav|ol|ul)\b[^>]*(breadcrumb|breadcrumbs)[^>]*>([\s\S]*?)<\/\1>/i,
  )?.[3];
  if (!breadcrumbBlock) {
    return [];
  }
  const labels: string[] = [];
  const anchorPattern = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  let anchorMatch = anchorPattern.exec(breadcrumbBlock);
  while (anchorMatch) {
    const label = cleanText(htmlToText(anchorMatch[1] ?? ''));
    if (label) {
      labels.push(label);
    }
    anchorMatch = anchorPattern.exec(breadcrumbBlock);
  }
  return uniqueStrings(labels);
}

function inferContentPatterns(headings: string[]): CompetitorContentPattern[] {
  return headings
    .map((heading) => heading.trim())
    .filter((heading) => heading.length > 0)
    .slice(0, 8)
    .map((heading) => ({ label: heading }));
}

function extractKeywordSignals(options: {
  title?: string;
  metaDescription?: string;
  h1Tags: string[];
  headings: string[];
  bodyText: string;
}): CompetitorKeywordSignal[] {
  const counts = new Map<string, { count: number; sources: Set<CompetitorKeywordSignalSource> }>();
  addKeywordTerms(counts, options.title, 'title', 3);
  addKeywordTerms(counts, options.metaDescription, 'metaDescription', 2);
  for (const h1 of options.h1Tags) {
    addKeywordTerms(counts, h1, 'h1', 3);
  }
  for (const heading of options.headings) {
    addKeywordTerms(counts, heading, 'heading', 2);
  }
  addKeywordTerms(counts, options.bodyText, 'body', 1);

  return [...counts.entries()]
    .map(([term, value]) => ({
      term,
      count: value.count,
      sources: sortKeywordSignalSources(value.sources),
    }))
    .sort((left, right) => {
      const sourceDelta = right.sources.length - left.sources.length;
      return sourceDelta || right.count - left.count || left.term.localeCompare(right.term);
    })
    .slice(0, 20);
}

function sortKeywordSignalSources(
  sources: Set<CompetitorKeywordSignalSource>,
): CompetitorKeywordSignalSource[] {
  return [...sources].sort(
    (left, right) => keywordSignalSourceOrder[left] - keywordSignalSourceOrder[right],
  );
}

function addKeywordTerms(
  counts: Map<string, { count: number; sources: Set<CompetitorKeywordSignalSource> }>,
  text: string | undefined,
  source: CompetitorKeywordSignalSource,
  weight: number,
): void {
  if (!text) {
    return;
  }
  const tokens = tokenize(text);
  for (const term of buildKeywordTerms(tokens)) {
    const existing = counts.get(term) ?? { count: 0, sources: new Set() };
    existing.count += weight;
    existing.sources.add(source);
    counts.set(term, existing);
  }
}

function buildKeywordTerms(tokens: string[]): string[] {
  const terms: string[] = [];
  for (const token of tokens) {
    if (!stopWords.has(token)) {
      terms.push(token);
    }
  }
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const pair = [tokens[index], tokens[index + 1]].filter(isDefined);
    if (pair.length === 2 && pair.some((token) => !stopWords.has(token))) {
      terms.push(pair.join(' '));
    }
  }
  for (let index = 0; index < tokens.length - 2; index += 1) {
    const triple = [tokens[index], tokens[index + 1], tokens[index + 2]].filter(isDefined);
    if (triple.length === 3 && !stopWords.has(triple[0] ?? '') && !stopWords.has(triple[2] ?? '')) {
      terms.push(triple.join(' '));
    }
  }
  return terms;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.replace(/^-+|-+$/g, ''))
    .filter((token) => token.length >= 3 && !/^\d+$/.test(token));
}

function extractOnPageSignals(options: {
  html: string;
  rawHtml: string;
  url: string;
  title?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  h1Count: number;
  bodyText: string;
}): CompetitorOnPageSignals {
  const linkCounts = countLinks(options.html, options.url);
  return {
    titleLength: options.title?.length,
    metaDescriptionLength: options.metaDescription?.length,
    h1Count: options.h1Count,
    h2Count: countHeadingLevel(options.html, 2),
    h3Count: countHeadingLevel(options.html, 3),
    wordCount: tokenize(options.bodyText).length,
    internalLinkCount: linkCounts.internal,
    externalLinkCount: linkCounts.external,
    canonicalPresent: options.canonicalUrl !== undefined,
    schemaTypes: extractSchemaTypes(options.rawHtml),
    ctaPatterns: extractCtaPatterns(options.html),
  };
}

function countLinks(html: string, baseUrl: string): { internal: number; external: number } {
  let internal = 0;
  let external = 0;
  const baseHost = safeHostname(baseUrl);
  for (const tag of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = readAttributes(tag).href;
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }
    const host = safeHostname(href, baseUrl);
    if (!host || host === baseHost) {
      internal += 1;
    } else {
      external += 1;
    }
  }
  return { internal, external };
}

function safeHostname(value: string, baseUrl?: string): string | undefined {
  try {
    return new URL(value, baseUrl).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function extractSchemaTypes(html: string): string[] {
  const types = new Set<string>();
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    collectSchemaTypes(safeJsonParse(match[1] ?? ''), types);
  }
  return [...types].sort();
}

function collectSchemaTypes(value: unknown, types: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectSchemaTypes(item, types);
    }
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }
  const record = value as Record<string, unknown>;
  const typeValue = record['@type'];
  if (typeof typeValue === 'string' && typeValue.trim()) {
    types.add(typeValue.trim());
  }
  if (Array.isArray(typeValue)) {
    for (const item of typeValue) {
      if (typeof item === 'string' && item.trim()) {
        types.add(item.trim());
      }
    }
  }
  for (const item of Object.values(record)) {
    collectSchemaTypes(item, types);
  }
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(decodeHtmlEntities(value.trim()));
  } catch {
    return undefined;
  }
}

function extractCtaPatterns(html: string): string[] {
  const labels = new Set<string>();
  for (const match of html.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const label = cleanText(htmlToText(match[2] ?? ''));
    const pattern = classifyCta(label);
    if (pattern) {
      labels.add(pattern);
    }
  }
  return [...labels].sort();
}

function classifyCta(label: string | undefined): string | undefined {
  const normalized = label?.toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (/\b(start|get started|create|build|make)\b/.test(normalized)) {
    return 'creation CTA';
  }
  if (/\b(download|export|pdf|docx)\b/.test(normalized)) {
    return 'download CTA';
  }
  if (/\b(templates?|examples?|samples?)\b/.test(normalized)) {
    return 'template/example CTA';
  }
  if (/\b(price|pricing|upgrade|subscribe|buy)\b/.test(normalized)) {
    return 'commercial CTA';
  }
  if (/\b(sign up|login|log in|try)\b/.test(normalized)) {
    return 'account CTA';
  }
  return undefined;
}

function cleanUrl(value: string | undefined, baseUrl: string): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function htmlToText(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, ' '));
}

function cleanText(value: string | undefined): string | undefined {
  const cleaned = value?.replace(/\s+/g, ' ').trim();
  return cleaned && cleaned.length > 0 ? cleaned : undefined;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function isDefined(value: string | undefined): value is string {
  return value !== undefined;
}

const stopWords = new Set([
  'about',
  'after',
  'also',
  'and',
  'are',
  'but',
  'can',
  'for',
  'from',
  'has',
  'have',
  'how',
  'into',
  'more',
  'not',
  'our',
  'that',
  'the',
  'this',
  'to',
  'use',
  'with',
  'you',
  'your',
]);

const keywordSignalSourceOrder: Record<CompetitorKeywordSignalSource, number> = {
  title: 1,
  metaDescription: 2,
  h1: 3,
  heading: 4,
  body: 5,
  manual: 6,
};
