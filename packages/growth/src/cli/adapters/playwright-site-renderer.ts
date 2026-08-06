import { chromium, type Browser } from 'playwright-core';
import type { SitePageRenderer } from '@unisane/growth/seo';

export type CreatePlaywrightSiteRendererOptions = {
  channel?: string;
  executablePath?: string;
};

export function createPlaywrightSiteRenderer(
  options: CreatePlaywrightSiteRendererOptions = {},
): SitePageRenderer {
  let browser: Browser | undefined;
  const browserName = options.executablePath
    ? `chromium:${options.executablePath}`
    : `chromium:${options.channel ?? 'chrome'}`;
  return {
    driver: 'playwright',
    browser: browserName,
    async render(request) {
      browser ??= await chromium.launch({
        headless: true,
        ...(options.executablePath
          ? { executablePath: options.executablePath }
          : { channel: options.channel ?? 'chrome' }),
      });
      const context = await browser.newContext({
        serviceWorkers: 'block',
        javaScriptEnabled: true,
      });
      const page = await context.newPage();
      const requestedOrigin = new URL(request.url).origin;
      await page.route('**/*', async (route) => {
        const resourceUrl = route.request().url();
        if (
          isAllowedResource(resourceUrl, requestedOrigin, route.request().isNavigationRequest())
        ) {
          await route.continue();
        } else {
          await route.abort('blockedbyclient');
        }
      });
      const onAbort = () => void page.close().catch(() => undefined);
      request.signal?.addEventListener('abort', onAbort, { once: true });
      try {
        const response = await page.goto(request.url, {
          waitUntil: 'domcontentloaded',
          timeout: request.timeoutMs,
        });
        if (request.settleMs > 0) await page.waitForTimeout(request.settleMs);
        return {
          finalUrl: page.url(),
          html: await page.content(),
          ...(response ? { statusCode: response.status() } : {}),
        };
      } finally {
        request.signal?.removeEventListener('abort', onAbort);
        await context.close();
      }
    },
    async close() {
      await browser?.close();
      browser = undefined;
    },
  };
}

function isAllowedResource(
  value: string,
  requestedOrigin: string,
  isNavigationRequest: boolean,
): boolean {
  if (!isNavigationRequest) return true;
  if (value.startsWith('data:') || value.startsWith('blob:') || value === 'about:blank')
    return true;
  try {
    return new URL(value).origin === requestedOrigin;
  } catch {
    return false;
  }
}
