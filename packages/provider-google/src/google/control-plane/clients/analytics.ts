import {
  asGoogleArray,
  asGoogleRecord,
  googleBearerHeaders,
  googleFetchImpl,
  optionalGoogleString,
  readGoogleJson,
  type GoogleControlPlaneFetch,
} from './shared.js';

export type GoogleAnalyticsPropertyResource = {
  account: string;
  accountDisplayName?: string;
  property: string;
  propertyId: string;
  displayName?: string;
};

export async function listGoogleAnalyticsProperties(args: {
  accessToken: string;
  fetch?: GoogleControlPlaneFetch;
}): Promise<GoogleAnalyticsPropertyResource[]> {
  const fetcher = googleFetchImpl(args.fetch);
  const properties: GoogleAnalyticsPropertyResource[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const url = new URL('https://analyticsadmin.googleapis.com/v1beta/accountSummaries');
    url.searchParams.set('pageSize', '200');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const value = asGoogleRecord(
      await readGoogleJson(
        await fetcher(url, {
          method: 'GET',
          headers: googleBearerHeaders(args.accessToken),
        }),
        'Google Analytics property inventory',
      ),
    );
    for (const accountEntry of asGoogleArray(value.accountSummaries)) {
      const account = asGoogleRecord(accountEntry);
      const accountName = optionalGoogleString(account.account);
      if (!accountName) continue;
      for (const propertyEntry of asGoogleArray(account.propertySummaries)) {
        const property = asGoogleRecord(propertyEntry);
        const propertyName = optionalGoogleString(property.property);
        if (!propertyName) continue;
        properties.push({
          account: accountName,
          accountDisplayName: optionalGoogleString(account.displayName),
          property: propertyName,
          propertyId: propertyName.replace(/^properties\//, ''),
          displayName: optionalGoogleString(property.displayName),
        });
      }
    }
    pageToken = optionalGoogleString(value.nextPageToken);
    if (!pageToken) break;
  }
  return properties;
}
