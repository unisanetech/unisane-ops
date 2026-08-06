export type ParsedSitemap = {
  kind: 'index' | 'url-set';
  urls: string[];
};

export function parseSitemapXml(xml: string): ParsedSitemap {
  const kind = /<sitemapindex\b/i.test(xml) ? 'index' : 'url-set';
  const urls = [...xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)]
    .map((match) => decodeXml(match[1] ?? '').trim())
    .filter(Boolean);
  return { kind, urls: [...new Set(urls)].sort() };
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}
