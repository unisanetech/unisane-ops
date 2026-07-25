import {
  asGoogleArray,
  asGoogleRecord,
  googleBearerHeaders,
  googleFetchImpl,
  optionalGoogleString,
  readGoogleJson,
  type GoogleControlPlaneFetch,
} from './shared.js';

export type GoogleTagManagerAccountResource = {
  accountId: string;
  name?: string;
  path?: string;
};

export type GoogleTagManagerContainerResource = {
  accountId: string;
  containerId: string;
  publicId?: string;
  name?: string;
  path?: string;
};

export async function listGoogleTagManagerAccounts(args: {
  accessToken: string;
  fetch?: GoogleControlPlaneFetch;
}): Promise<GoogleTagManagerAccountResource[]> {
  const value = asGoogleRecord(
    await readGoogleJson(
      await googleFetchImpl(args.fetch)(
        'https://tagmanager.googleapis.com/tagmanager/v2/accounts',
        {
          method: 'GET',
          headers: googleBearerHeaders(args.accessToken),
        },
      ),
      'Google Tag Manager account inventory',
    ),
  );
  return asGoogleArray(value.account).flatMap((entry) => {
    const account = asGoogleRecord(entry);
    const accountId = optionalGoogleString(account.accountId);
    if (!accountId) return [];
    return [
      {
        accountId,
        name: optionalGoogleString(account.name),
        path: optionalGoogleString(account.path),
      },
    ];
  });
}

export async function listGoogleTagManagerContainers(args: {
  accessToken: string;
  accountId: string;
  fetch?: GoogleControlPlaneFetch;
}): Promise<GoogleTagManagerContainerResource[]> {
  const value = asGoogleRecord(
    await readGoogleJson(
      await googleFetchImpl(args.fetch)(
        `https://tagmanager.googleapis.com/tagmanager/v2/accounts/${encodeURIComponent(args.accountId)}/containers`,
        {
          method: 'GET',
          headers: googleBearerHeaders(args.accessToken),
        },
      ),
      'Google Tag Manager container inventory',
    ),
  );
  return asGoogleArray(value.container).flatMap((entry) => {
    const container = asGoogleRecord(entry);
    const containerId = optionalGoogleString(container.containerId);
    if (!containerId) return [];
    return [
      {
        accountId: args.accountId,
        containerId,
        publicId: optionalGoogleString(container.publicId),
        name: optionalGoogleString(container.name),
        path: optionalGoogleString(container.path),
      },
    ];
  });
}
