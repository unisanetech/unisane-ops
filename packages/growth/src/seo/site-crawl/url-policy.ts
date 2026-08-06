export function normalizeSiteCrawlRequestedUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('siteUrl must be an absolute HTTP or HTTPS URL.');
  }
  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) {
    throw new Error('siteUrl must be an absolute HTTP or HTTPS URL without credentials.');
  }
  url.hash = '';
  return url.href;
}

export function normalizeSameOriginSiteCrawlUrl(value: string, origin: string): string | undefined {
  try {
    const url = new URL(value, origin);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.origin !== origin) {
      return undefined;
    }
    url.hash = '';
    return url.href;
  } catch {
    return undefined;
  }
}
