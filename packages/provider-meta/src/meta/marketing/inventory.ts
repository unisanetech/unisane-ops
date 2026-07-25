import type { FetchLike } from '@unisane/growth/contracts';
import { asArray, asRecord, optionalString } from './graph-utils.js';

export type MetaSocialInventoryResourceType = 'business' | 'page' | 'instagramActor';

export type MetaSocialInventoryResource = {
  type: MetaSocialInventoryResourceType;
  id: string;
  title?: string;
  parentId?: string;
  state: string;
  metadata?: Record<string, string>;
};

export type MetaSocialInventory = {
  resources: MetaSocialInventoryResource[];
  warnings: string[];
};

async function readGraphJson(args: {
  url: URL;
  accessToken: string;
  fetch: FetchLike;
  label: string;
}): Promise<unknown> {
  const response = await args.fetch(args.url, {
    headers: { authorization: `Bearer ${args.accessToken}` },
  });
  if (response.ok) return response.json();
  let body = '';
  try {
    body = await response.text();
  } catch {
    body = '';
  }
  throw new Error(
    `${args.label} inventory failed with ${response.status} ${response.statusText}${body ? `: ${body.slice(0, 300)}` : ''}`,
  );
}

async function fetchGraphRows(args: {
  path: string;
  fields: string;
  accessToken: string;
  fetch: FetchLike;
  apiVersion: string;
  pageSize: number;
  maxPages: number;
  label: string;
}): Promise<unknown[]> {
  const rows: unknown[] = [];
  let next: string | undefined;
  const firstUrl = new URL(`https://graph.facebook.com/${args.apiVersion}/${args.path}`);
  firstUrl.searchParams.set('fields', args.fields);
  firstUrl.searchParams.set('limit', String(args.pageSize));
  next = String(firstUrl);
  for (let page = 0; next && page < args.maxPages; page += 1) {
    const value = await readGraphJson({
      url: new URL(next),
      accessToken: args.accessToken,
      fetch: args.fetch,
      label: args.label,
    });
    rows.push(...asArray(asRecord(value).data));
    next = optionalString(asRecord(asRecord(value).paging).next);
  }
  return rows;
}

function parseBusiness(value: unknown): MetaSocialInventoryResource | undefined {
  const business = asRecord(value);
  const id = optionalString(business.id);
  if (!id) return undefined;
  return {
    type: 'business',
    id,
    title: optionalString(business.name),
    state: 'accessible',
  };
}

function parsePageAndInstagram(value: unknown): MetaSocialInventoryResource[] {
  const page = asRecord(value);
  const id = optionalString(page.id);
  if (!id) return [];
  const instagram = asRecord(page.instagram_business_account);
  const instagramId = optionalString(instagram.id);
  return [
    {
      type: 'page',
      id,
      title: optionalString(page.name),
      state: 'accessible',
      metadata: {
        ...(optionalString(page.category) ? { category: optionalString(page.category) ?? '' } : {}),
      },
    },
    ...(instagramId
      ? [
          {
            type: 'instagramActor' as const,
            id: instagramId,
            parentId: id,
            title: optionalString(instagram.username) ?? optionalString(instagram.name),
            state: 'accessible',
            metadata: {
              ...(optionalString(instagram.username)
                ? { username: optionalString(instagram.username) ?? '' }
                : {}),
            },
          },
        ]
      : []),
  ];
}

export async function collectMetaSocialInventory(args: {
  accessToken: string;
  fetch: FetchLike;
  apiVersion: string;
  pageSize: number;
  maxPages: number;
}): Promise<MetaSocialInventory> {
  const resources: MetaSocialInventoryResource[] = [];
  const warnings: string[] = [];
  try {
    resources.push(
      ...(
        await fetchGraphRows({
          path: 'me/businesses',
          fields: 'id,name',
          accessToken: args.accessToken,
          fetch: args.fetch,
          apiVersion: args.apiVersion,
          pageSize: args.pageSize,
          maxPages: args.maxPages,
          label: 'Meta business',
        })
      )
        .map(parseBusiness)
        .filter((resource): resource is MetaSocialInventoryResource => Boolean(resource)),
    );
  } catch (error) {
    warnings.push(
      `Meta business inventory skipped: ${
        error instanceof Error ? error.message : 'Unknown provider error.'
      }`,
    );
  }
  try {
    resources.push(
      ...(
        await fetchGraphRows({
          path: 'me/accounts',
          fields: 'id,name,category,instagram_business_account{id,username,name}',
          accessToken: args.accessToken,
          fetch: args.fetch,
          apiVersion: args.apiVersion,
          pageSize: args.pageSize,
          maxPages: args.maxPages,
          label: 'Meta page',
        })
      ).flatMap(parsePageAndInstagram),
    );
  } catch (error) {
    warnings.push(
      `Meta page/Instagram inventory skipped: ${
        error instanceof Error ? error.message : 'Unknown provider error.'
      }`,
    );
  }
  return { resources, warnings };
}
