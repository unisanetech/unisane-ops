export function renderMetaPixelHtml(input: {
  pixelId: string;
  eventName: string;
  eventId?: string;
  value?: string;
  currency?: string;
}) {
  const literal = (value: string) => JSON.stringify(value).replace(/</g, '\\u003c');
  if (Boolean(input.value !== undefined) !== Boolean(input.currency !== undefined))
    throw new Error(
      '[GTM_META_VALUE_CURRENCY_REQUIRED] Meta value and currency must be supplied together.',
    );
  const data =
    input.value === undefined
      ? '{}'
      : `{value:Number(${literal(input.value)}),currency:${literal(input.currency!)}}`;
  const options = input.eventId === undefined ? '{}' : `{eventID:${literal(input.eventId)}}`;
  return [
    '<script>',
    '(function(){',
    '!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?',
    'n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;',
    "n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;",
    't.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}',
    "(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');",
    `var pixel=${literal(input.pixelId)}, data=${data}, options=${options};`,
    'if (!/^[0-9]+$/.test(pixel)) return;',
    ...(input.value === undefined
      ? []
      : [
          `if (!${literal(input.value)}.trim() || !isFinite(data.value) || data.value < 0 || !/^[A-Z]{3}$/.test(data.currency)) return;`,
        ]),
    ...(input.eventId === undefined
      ? []
      : [
          'if (!options.eventID || options.eventID === "undefined" || options.eventID === "null") return;',
        ]),
    'var initialized=window.__unisaneMetaInitialized||(window.__unisaneMetaInitialized=Object.create(null));',
    "if (!initialized[pixel]) {fbq('init',pixel); initialized[pixel]=true;}",
    `fbq('trackSingle',pixel,${literal(input.eventName)},data,options);`,
    '})();',
    '</script>',
  ].join('\n');
}
