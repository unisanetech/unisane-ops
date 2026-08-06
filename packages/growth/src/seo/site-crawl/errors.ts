export class SiteCrawlCancelledError extends Error {
  constructor() {
    super('Site crawl was cancelled.');
    this.name = 'SiteCrawlCancelledError';
  }
}

export class SiteCrawlResponseTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Response exceeded the configured ${maxBytes}-byte limit.`);
    this.name = 'SiteCrawlResponseTooLargeError';
  }
}

export class SiteCrawlRequestBoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SiteCrawlRequestBoundaryError';
  }
}

export function throwIfSiteCrawlCancelled(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new SiteCrawlCancelledError();
  }
}

export function rethrowSiteCrawlCancellation(
  error: unknown,
  signal: AbortSignal | undefined,
): void {
  if (signal?.aborted || error instanceof SiteCrawlCancelledError) {
    throw new SiteCrawlCancelledError();
  }
}

export function siteCrawlErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown crawl request failure.';
}

export function siteCrawlFailureCode(
  error: unknown,
): 'fetch-failed' | 'invalid-url' | 'response-too-large' {
  if (error instanceof SiteCrawlResponseTooLargeError) {
    return 'response-too-large';
  }
  if (error instanceof SiteCrawlRequestBoundaryError) {
    return 'invalid-url';
  }
  return 'fetch-failed';
}
