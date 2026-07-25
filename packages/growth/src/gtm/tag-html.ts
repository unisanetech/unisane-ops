import type { GoogleTagManagerParameterValue } from './contracts';

export function consentDefaultHtml(
  parameters: readonly { key: string; value: GoogleTagManagerParameterValue }[],
): string {
  const defaults = Object.fromEntries(
    parameters
      .filter((entry) => typeof entry.value === 'string' && entry.value.length > 0)
      .map((entry) => [entry.key, entry.value]),
  );
  return [
    '<script>',
    'window.dataLayer = window.dataLayer || [];',
    'window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};',
    `window.gtag('consent', 'default', ${JSON.stringify(defaults)});`,
    '</script>',
  ].join('\n');
}
