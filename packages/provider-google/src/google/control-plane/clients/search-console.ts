import {
  asGoogleArray,
  asGoogleRecord,
  googleBearerHeaders,
  googleFetchImpl,
  optionalGoogleString,
  readGoogleJson,
  type GoogleControlPlaneFetch,
} from './shared.js';

export type GoogleSearchConsoleSiteResource = {
  siteUrl: string;
  permissionLevel?: string;
};

export async function listGoogleSearchConsoleSites(args: {
  accessToken: string;
  fetch?: GoogleControlPlaneFetch;
}): Promise<GoogleSearchConsoleSiteResource[]> {
  const value = asGoogleRecord(
    await readGoogleJson(
      await googleFetchImpl(args.fetch)('https://www.googleapis.com/webmasters/v3/sites', {
        method: 'GET',
        headers: googleBearerHeaders(args.accessToken),
      }),
      'Search Console site inventory',
    ),
  );
  return asGoogleArray(value.siteEntry).flatMap((entry) => {
    const site = asGoogleRecord(entry);
    const siteUrl = optionalGoogleString(site.siteUrl);
    if (!siteUrl) return [];
    return [
      {
        siteUrl,
        permissionLevel: optionalGoogleString(site.permissionLevel),
      },
    ];
  });
}
