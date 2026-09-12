import { describe, expect, it, vi } from 'vitest';
import { buildGtmBootstrapScript, buildGtmScriptUrl, createBrowserGtmTransport } from '../next/gtm';

describe('gtm helpers', () => {
  it('builds the GTM script URL', () => {
    expect(buildGtmScriptUrl({ containerId: 'GTM-TEST' })).toBe(
      'https://www.googletagmanager.com/gtm.js?id=GTM-TEST',
    );
  });

  it('adds optional GTM preview parameters', () => {
    expect(
      buildGtmScriptUrl({
        containerId: 'GTM-TEST',
        dataLayerName: 'customLayer',
        auth: 'auth-token',
        preview: 'env-1',
      }),
    ).toBe(
      'https://www.googletagmanager.com/gtm.js?id=GTM-TEST&l=customLayer&gtm_auth=auth-token&gtm_preview=env-1&gtm_cookies_win=x',
    );
  });

  it('builds the standard GTM bootstrap event before gtm.js loads', () => {
    const script = buildGtmBootstrapScript({
      containerId: 'GTM-TEST',
      dataLayerName: 'customLayer',
    });

    expect(script).toContain('customLayer');
    expect(script).toContain('customLayer:GTM-TEST');
    expect(script).toContain('gtm.start');
    expect(script).toContain("event:'gtm.js'");
    expect(script).toContain('__unisaneGtmBootstrap');
  });

  it('escapes inline bootstrap values for script context', () => {
    const script = buildGtmBootstrapScript({
      containerId: 'GTM-TEST</script>',
      dataLayerName: 'customLayer',
    });

    expect(script).not.toContain('</script>');
    expect(script).toContain('GTM-TEST\\u003c/script\\u003e');
  });
  it('uses the Google command queue contract for consent and identity retrieval', () => {
    const browser: { dataLayer: unknown[]; gtag?: (...args: unknown[]) => void } = { dataLayer: [] };
    vi.stubGlobal('window', browser);
    try {
      createBrowserGtmTransport({ gtm: { containerId: 'GTM-TEST' } }).setConsent!('update', { analyticsStorage: 'granted' } as never);
      const command = browser.dataLayer[0] as IArguments;
      expect(Object.prototype.toString.call(command)).toBe('[object Arguments]');
      expect(Array.from(command).slice(0, 2)).toEqual(['consent', 'update']);
      const callback = vi.fn(); browser.gtag!('get', 'G-TEST', 'client_id', callback);
      expect(Array.from(browser.dataLayer[1] as IArguments)).toEqual(['get', 'G-TEST', 'client_id', callback]);
    } finally { vi.unstubAllGlobals(); }
  });

});
