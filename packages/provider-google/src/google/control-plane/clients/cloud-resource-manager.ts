import {
  asGoogleRecord,
  googleBearerHeaders,
  googleFetchImpl,
  optionalGoogleString,
  readGoogleJson,
  type GoogleControlPlaneFetch,
} from './shared.js';

export type GoogleProjectResource = {
  projectId: string;
  projectNumber?: string;
  name?: string;
  lifecycleState?: string;
};

export async function readGoogleProject(args: {
  accessToken: string;
  projectId: string;
  fetch?: GoogleControlPlaneFetch;
}): Promise<GoogleProjectResource> {
  const value = asGoogleRecord(
    await readGoogleJson(
      await googleFetchImpl(args.fetch)(
        `https://cloudresourcemanager.googleapis.com/v1/projects/${encodeURIComponent(args.projectId)}`,
        {
          method: 'GET',
          headers: googleBearerHeaders(args.accessToken),
        },
      ),
      'Google project lookup',
    ),
  );
  return {
    projectId: optionalGoogleString(value.projectId) ?? args.projectId,
    projectNumber: optionalGoogleString(value.projectNumber),
    name: optionalGoogleString(value.name),
    lifecycleState: optionalGoogleString(value.lifecycleState),
  };
}
