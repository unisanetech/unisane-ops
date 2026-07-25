import {
  asGoogleArray,
  asGoogleRecord,
  googleBearerHeaders,
  googleFetchImpl,
  optionalGoogleString,
  readGoogleJson,
  type GoogleControlPlaneFetch,
} from './shared.js';

export type GoogleAdsCustomerResource = {
  resourceName: string;
  customerId: string;
};

function customerIdFromResource(resourceName: string): string {
  return resourceName.replace(/^customers\//, '');
}

export async function listGoogleAdsAccessibleCustomers(args: {
  accessToken: string;
  developerToken: string;
  apiVersion?: string;
  fetch?: GoogleControlPlaneFetch;
}): Promise<GoogleAdsCustomerResource[]> {
  const apiVersion = args.apiVersion ?? 'v22';
  const value = asGoogleRecord(
    await readGoogleJson(
      await googleFetchImpl(args.fetch)(
        `https://googleads.googleapis.com/${apiVersion}/customers:listAccessibleCustomers`,
        {
          method: 'GET',
          headers: {
            ...googleBearerHeaders(args.accessToken),
            'developer-token': args.developerToken,
          },
        },
      ),
      'Google Ads customer inventory',
    ),
  );
  return asGoogleArray(value.resourceNames)
    .map(optionalGoogleString)
    .filter((resourceName): resourceName is string => Boolean(resourceName))
    .map((resourceName) => ({
      resourceName,
      customerId: customerIdFromResource(resourceName),
    }));
}
