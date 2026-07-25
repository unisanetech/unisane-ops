import {
  asGoogleArray,
  asGoogleRecord,
  googleBearerHeaders,
  googleFetchImpl,
  optionalGoogleString,
  readGoogleJson,
  type GoogleControlPlaneFetch,
} from './shared.js';

export type GoogleServiceUsageResource = {
  name: string;
  serviceName: string;
  title?: string;
  state: 'ENABLED' | 'DISABLED' | 'UNKNOWN';
};

export type GoogleServiceEnableResult = {
  serviceName: string;
  operationName?: string;
};

function serviceNameFromResource(name: string): string {
  return name.split('/services/')[1] ?? name;
}

export async function listGoogleEnabledServices(args: {
  accessToken: string;
  projectId: string;
  fetch?: GoogleControlPlaneFetch;
}): Promise<GoogleServiceUsageResource[]> {
  const fetcher = googleFetchImpl(args.fetch);
  const services: GoogleServiceUsageResource[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 20; page += 1) {
    const url = new URL(
      `https://serviceusage.googleapis.com/v1/projects/${encodeURIComponent(args.projectId)}/services`,
    );
    url.searchParams.set('filter', 'state:ENABLED');
    url.searchParams.set('pageSize', '200');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const value = asGoogleRecord(
      await readGoogleJson(
        await fetcher(url, {
          method: 'GET',
          headers: googleBearerHeaders(args.accessToken),
        }),
        'Google Service Usage inventory',
      ),
    );
    for (const entry of asGoogleArray(value.services)) {
      const service = asGoogleRecord(entry);
      const name = optionalGoogleString(service.name);
      if (!name) continue;
      services.push({
        name,
        serviceName: serviceNameFromResource(name),
        title: optionalGoogleString(asGoogleRecord(service.config).title),
        state:
          service.state === 'ENABLED' || service.state === 'DISABLED' ? service.state : 'UNKNOWN',
      });
    }
    pageToken = optionalGoogleString(value.nextPageToken);
    if (!pageToken) break;
  }
  return services;
}

export async function enableGoogleService(args: {
  accessToken: string;
  projectId: string;
  serviceName: string;
  fetch?: GoogleControlPlaneFetch;
}): Promise<GoogleServiceEnableResult> {
  const value = asGoogleRecord(
    await readGoogleJson(
      await googleFetchImpl(args.fetch)(
        `https://serviceusage.googleapis.com/v1/projects/${encodeURIComponent(args.projectId)}/services/${encodeURIComponent(args.serviceName)}:enable`,
        {
          method: 'POST',
          headers: googleBearerHeaders(args.accessToken),
          body: '{}',
        },
      ),
      `Google API enable ${args.serviceName}`,
    ),
  );
  return {
    serviceName: args.serviceName,
    operationName: optionalGoogleString(value.name),
  };
}
