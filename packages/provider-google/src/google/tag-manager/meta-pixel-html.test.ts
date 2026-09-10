import vm from 'node:vm';
import { expect, it, vi } from 'vitest';
import { renderMetaPixelHtml } from './meta-pixel-html.js';
function execute(html: string, context: vm.Context) {
  vm.runInContext(html.replace(/^<script>\n/, '').replace(/\n<\/script>$/, ''), context);
}
it('initializes a pixel once, preserves numeric value/currency/event ID and targets only that pixel', () => {
  const fbq = vi.fn();
  const window = { fbq };
  const context = vm.createContext({ window, fbq, document: {} });
  const html = renderMetaPixelHtml({
    pixelId: '123',
    eventName: 'Purchase',
    eventId: 'order-1',
    value: '1200',
    currency: 'BDT',
  });
  execute(html, context);
  execute(html, context);
  expect(fbq.mock.calls.filter((call) => call[0] === 'init')).toHaveLength(1);
  expect(fbq.mock.calls.filter((call) => call[0] === 'trackSingle')[0]).toEqual([
    'trackSingle',
    '123',
    'Purchase',
    { value: 1200, currency: 'BDT' },
    { eventID: 'order-1' },
  ]);
});
it('does not fabricate values or emit invalid monetary/event-ID observations', () => {
  const fbq = vi.fn();
  const context = vm.createContext({ window: { fbq }, fbq, document: {} });
  for (const input of [
    { value: '', currency: 'BDT', eventId: 'id' },
    { value: 'NaN', currency: 'USD', eventId: 'id' },
    { value: '1', currency: 'invalid', eventId: 'id' },
    { value: '1', currency: 'USD', eventId: 'undefined' },
  ])
    execute(renderMetaPixelHtml({ pixelId: '123', eventName: 'Purchase', ...input }), context);
  expect(fbq).not.toHaveBeenCalled();
  expect(() => renderMetaPixelHtml({ pixelId: '123', eventName: 'Purchase', value: '1' })).toThrow(
    'GTM_META_VALUE_CURRENCY_REQUIRED',
  );
});
