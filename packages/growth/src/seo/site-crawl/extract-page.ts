import { createHash } from 'node:crypto';

export type ExtractSitePageEvidenceOptions = {
  html: string;
  url: string;
  siteOrigin: string;
};

export type ExtractSitePageEvidenceResult = {
  contentHash: string;
  title?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  h1?: string;
  headings: string[];
  robotsDirectives: string[];
  schemaTypes: string[];
  wordCount: number;
  internalLinks: string[];
  externalLinkCount: number;
};

export function extractSitePageEvidence(
  options: ExtractSitePageEvidenceOptions,
): ExtractSitePageEvidenceResult {
  const html = stripIgnoredBlocks(options.html);
  const title = cleanText(readTagTexts(html, 'title')[0]);
  const h1 = cleanText(readTagTexts(html, 'h1')[0]);
  const headings = unique(
    [2, 3].flatMap((level) => readTagTexts(html, `h${level}`).map(cleanText).filter(isDefined)),
  ).slice(0, 24);
  const metaDescription = cleanText(readMetaContent(html, 'description'));
  const canonicalUrl = resolveHttpUrl(readLinkHref(html, 'canonical'), options.url);
  const robotsDirectives = unique(
    [readMetaContent(html, 'robots'), readMetaContent(html, 'googlebot')]
      .filter(isDefined)
      .flatMap((value) => value.split(',').map((directive) => directive.trim().toLowerCase()))
      .filter(Boolean),
  ).sort();
  const links = extractLinks(html, options.url);
  const internalLinks = unique(
    links.filter((url) => url.origin === options.siteOrigin).map(normalizeUrl),
  ).sort();
  const externalLinkCount = unique(
    links.filter((url) => url.origin !== options.siteOrigin).map(normalizeUrl),
  ).length;
  const bodyHtml = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? html;
  const bodyText = cleanText(htmlToText(bodyHtml)) ?? '';

  return {
    contentHash: createHash('sha256').update(options.html).digest('hex'),
    ...(title ? { title } : {}),
    ...(metaDescription ? { metaDescription } : {}),
    ...(canonicalUrl ? { canonicalUrl } : {}),
    ...(h1 ? { h1 } : {}),
    headings,
    robotsDirectives,
    schemaTypes: extractSchemaTypes(options.html),
    wordCount: bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0,
    internalLinks,
    externalLinkCount,
  };
}

function stripIgnoredBlocks(html: string): string {
  return html
    .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
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

function readMetaContent(html: string, name: string): string | undefined {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = readAttributes(tag);
    const tagName = attributes.name?.toLowerCase() ?? attributes.property?.toLowerCase();
    if (tagName === name) {
      return attributes.content;
    }
  }
  return undefined;
}

function readLinkHref(html: string, rel: string): string | undefined {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attributes = readAttributes(tag);
    if (attributes.rel?.toLowerCase().split(/\s+/).includes(rel)) {
      return attributes.href;
    }
  }
  return undefined;
}

function extractLinks(html: string, baseUrl: string): URL[] {
  const urls: URL[] = [];
  for (const tag of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = readAttributes(tag).href;
    const resolved = resolveUrl(href, baseUrl);
    if (resolved) {
      urls.push(resolved);
    }
  }
  return urls;
}

function extractSchemaTypes(html: string): string[] {
  const types = new Set<string>();
  for (const match of html.matchAll(/["']@type["']\s*:\s*["']([^"']+)["']/gi)) {
    if (match[1]) {
      types.add(match[1].trim());
    }
  }
  for (const tag of html.match(/<[^>]+\bitemtype\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)/gi) ?? []) {
    const value = readAttributes(tag).itemtype;
    const type = value?.split('/').filter(Boolean).at(-1);
    if (type) {
      types.add(type);
    }
  }
  return [...types].sort();
}

function readAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern = /([a-zA-Z_:.-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match = pattern.exec(tag);
  while (match) {
    const key = match[1]?.toLowerCase();
    const value = match[3] ?? match[4] ?? match[5];
    if (key && value !== undefined) {
      attributes[key] = decodeHtmlEntities(value.trim());
    }
    match = pattern.exec(tag);
  }
  return attributes;
}

function resolveHttpUrl(value: string | undefined, baseUrl: string): string | undefined {
  const url = resolveUrl(value, baseUrl);
  return url ? normalizeUrl(url) : undefined;
}

function resolveUrl(value: string | undefined, baseUrl: string): URL | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const url = new URL(value, baseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return undefined;
    }
    url.hash = '';
    return url;
  } catch {
    return undefined;
  }
}

function normalizeUrl(url: URL): string {
  url.hash = '';
  return url.href;
}

function htmlToText(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, ' '));
}

function cleanText(value: string | undefined): string | undefined {
  const cleaned = value?.replace(/\s+/g, ' ').trim();
  return cleaned || undefined;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function isDefined(value: string | undefined): value is string {
  return value !== undefined;
}
