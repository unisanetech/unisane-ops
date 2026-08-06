import {
  SiteCrawlRequestBoundaryError,
  SiteCrawlResponseTooLargeError,
  throwIfSiteCrawlCancelled,
} from './errors.js';

export type SiteCrawlFetch = typeof fetch;

export async function fetchSiteCrawlResponse(
  url: string,
  options: {
    fetchImpl: SiteCrawlFetch;
    signal?: AbortSignal;
    timeoutMs: number;
    headers: Record<string, string>;
  },
): Promise<Response> {
  const origin = new URL(url).origin;
  let currentUrl = url;
  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    const response = await fetchOnceWithTimeout(currentUrl, options);
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }
    const location = response.headers.get('location');
    if (!location) {
      return response;
    }
    const redirectedUrl = new URL(location, currentUrl);
    if (redirectedUrl.origin !== origin) {
      throw new SiteCrawlRequestBoundaryError(
        `Cross-origin redirect from ${currentUrl} to ${redirectedUrl.href} was denied.`,
      );
    }
    redirectedUrl.hash = '';
    currentUrl = redirectedUrl.href;
  }
  throw new SiteCrawlRequestBoundaryError('More than five redirects were denied.');
}

export async function readSiteCrawlResponseText(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const contentLength = Number.parseInt(response.headers.get('content-length') ?? '', 10);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new SiteCrawlResponseTooLargeError(maxBytes);
  }
  if (!response.body) {
    return '';
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let byteCount = 0;
  let text = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }
      byteCount += chunk.value.byteLength;
      if (byteCount > maxBytes) {
        void reader.cancel();
        throw new SiteCrawlResponseTooLargeError(maxBytes);
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

async function fetchOnceWithTimeout(
  url: string,
  options: {
    fetchImpl: SiteCrawlFetch;
    signal?: AbortSignal;
    timeoutMs: number;
    headers: Record<string, string>;
  },
): Promise<Response> {
  throwIfSiteCrawlCancelled(options.signal);
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeout = setTimeout(
    () => controller.abort(new Error('Request timed out.')),
    options.timeoutMs,
  );
  try {
    return await options.fetchImpl(url, {
      headers: options.headers,
      signal: controller.signal,
      redirect: 'manual',
    });
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }
}
