import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type {
  GoogleTagManagerContainerManifest,
  GoogleTagManagerParameter,
  GoogleTagManagerParameterValue,
  GoogleTagManagerTag,
  GoogleTagManagerTrigger,
} from '../../gtm/index.js';
import type { LoadedMarketingRegistries } from '../registry/load-registries.js';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import type { MarketingTrackingAuditCheck } from './audit-types.js';

type LoadedModule = {
  default?: unknown;
  googleTagManagerContainer?: unknown;
  gtmContainer?: unknown;
};

export type MarketingGtmAuditOptions = {
  cwd?: string;
  missingStatus?: MarketingTrackingAuditCheck['status'];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isGoogleTagManagerManifest(value: unknown): value is GoogleTagManagerContainerManifest {
  if (!isRecord(value)) return false;
  return (
    typeof value.appId === 'string' &&
    typeof value.accountId === 'string' &&
    typeof value.containerId === 'string' &&
    typeof value.namespace === 'string' &&
    isRecord(value.environments)
  );
}

function ensureWithinCwd(cwd: string, resolvedPath: string): void {
  const normalizedCwd = path.resolve(cwd);
  const normalizedPath = path.resolve(resolvedPath);
  const cwdPrefix = normalizedCwd.endsWith(path.sep)
    ? normalizedCwd
    : `${normalizedCwd}${path.sep}`;
  if (normalizedPath !== normalizedCwd && !normalizedPath.startsWith(cwdPrefix)) {
    throw new Error(
      `[MARKETING_GTM_MANIFEST_PATH_OUTSIDE_CWD] GTM manifest path must stay inside the working directory: ${resolvedPath}`,
    );
  }
}

function manifestFromModule(moduleValue: LoadedModule): unknown {
  return moduleValue.default ?? moduleValue.googleTagManagerContainer ?? moduleValue.gtmContainer;
}

async function loadGtmManifest(
  cwd: string,
  relativePath: string,
): Promise<{ manifest: GoogleTagManagerContainerManifest; path: string }> {
  const resolvedPath = path.resolve(cwd, relativePath);
  ensureWithinCwd(cwd, resolvedPath);
  if (!existsSync(resolvedPath)) {
    throw new Error(
      `[MARKETING_GTM_MANIFEST_NOT_FOUND] GTM manifest was not found at ${resolvedPath}.`,
    );
  }

  const imported = (await import(pathToFileURL(resolvedPath).href)) as LoadedModule;
  const manifest = manifestFromModule(imported);
  if (!isGoogleTagManagerManifest(manifest)) {
    throw new Error(
      `[MARKETING_GTM_MANIFEST_INVALID_EXPORT] GTM manifest at ${resolvedPath} must export a GoogleTagManagerContainerManifest.`,
    );
  }
  return { manifest, path: resolvedPath };
}

function parameterValueToString(value: GoogleTagManagerParameterValue | undefined): string | null {
  if (typeof value === 'string') return value;
  return null;
}

function parameterValue(
  parameters: readonly GoogleTagManagerParameter[] | undefined,
  key: string,
): string | null {
  return parameterValueToString(parameters?.find((parameter) => parameter.key === key)?.value);
}

function canonicalDataLayerEvents(registries: LoadedMarketingRegistries): Set<string> {
  return new Set(
    registries.events.value.events
      .flatMap((event) => [event.name, event.mappings.gtm?.dataLayerEvent])
      .filter((eventName): eventName is string => Boolean(eventName)),
  );
}

function canonicalGa4Events(registries: LoadedMarketingRegistries): Set<string> {
  return new Set(
    registries.events.value.events
      .flatMap((event) => [event.name, event.mappings.ga4?.eventName])
      .filter((eventName): eventName is string => Boolean(eventName)),
  );
}

function conversionSourceEventIds(registries: LoadedMarketingRegistries): Set<string> {
  return new Set(
    registries.conversions.value.conversions.map((conversion) => conversion.sourceEventId),
  );
}

function triggerBySlug(
  triggers: readonly GoogleTagManagerTrigger[] | undefined,
): Map<string, GoogleTagManagerTrigger> {
  return new Map((triggers ?? []).map((trigger) => [trigger.slug, trigger]));
}

function auditDataLayerTriggers(
  triggers: readonly GoogleTagManagerTrigger[] | undefined,
  canonicalEvents: Set<string>,
): MarketingTrackingAuditCheck[] {
  const dataLayerTriggers = (triggers ?? []).filter(
    (trigger) => trigger.type === 'data_layer_event',
  );
  const checks: MarketingTrackingAuditCheck[] = dataLayerTriggers
    .filter((trigger) => trigger.eventName && !canonicalEvents.has(trigger.eventName))
    .map((trigger) => ({
      id: `gtm.triggers.${trigger.slug}.eventName`,
      status: 'error' as const,
      message: `GTM data-layer trigger ${trigger.slug} uses non-canonical event ${trigger.eventName}.`,
    }));

  if (checks.length === 0) {
    checks.push({
      id: 'gtm.triggers.canonicalEvents',
      status: 'pass',
      message: 'GTM data-layer triggers use canonical registry events.',
    });
  }
  return checks;
}

function auditGa4EventTags(
  tags: readonly GoogleTagManagerTag[] | undefined,
  canonicalEvents: Set<string>,
): MarketingTrackingAuditCheck[] {
  const checks: MarketingTrackingAuditCheck[] = (tags ?? [])
    .filter((tag) => tag.type === 'ga4_event')
    .flatMap((tag) => {
      const eventName = parameterValue(tag.parameters, 'eventName');
      if (!eventName || canonicalEvents.has(eventName)) return [];
      return [
        {
          id: `gtm.tags.${tag.slug}.ga4EventName`,
          status: 'error' as const,
          message: `GTM GA4 event tag ${tag.slug} uses non-canonical event ${eventName}.`,
        },
      ];
    });

  if (checks.length === 0) {
    checks.push({
      id: 'gtm.tags.ga4CanonicalEvents',
      status: 'pass',
      message: 'GTM GA4 event tags use canonical registry events.',
    });
  }
  return checks;
}

function auditConversionTags(
  manifest: GoogleTagManagerContainerManifest,
  canonicalConversions: Set<string>,
): MarketingTrackingAuditCheck[] {
  const triggers = triggerBySlug(manifest.triggers);
  const conversionTags = (manifest.tags ?? []).filter(
    (tag) => tag.type === 'google_ads_conversion' || tag.type === 'meta_pixel',
  );
  const checks: MarketingTrackingAuditCheck[] = conversionTags.flatMap((tag) =>
    tag.triggerSlugs.flatMap((triggerSlug) => {
      const trigger = triggers.get(triggerSlug);
      if (!trigger || trigger.type !== 'data_layer_event' || !trigger.eventName) return [];
      if (canonicalConversions.has(trigger.eventName)) return [];
      return [
        {
          id: `gtm.tags.${tag.slug}.trigger.${triggerSlug}`,
          status: 'error' as const,
          message: `GTM conversion tag ${tag.slug} is triggered by non-conversion event ${trigger.eventName}.`,
        },
      ];
    }),
  );

  if (checks.length === 0) {
    checks.push({
      id: 'gtm.tags.conversionTriggers',
      status: 'pass',
      message: 'GTM browser conversion tags trigger from canonical conversion source events.',
    });
  }
  return checks;
}

export async function auditGoogleTagManagerManifest(args: {
  config: MarketingExecutionContext;
  registries: LoadedMarketingRegistries;
  options?: MarketingGtmAuditOptions;
}): Promise<MarketingTrackingAuditCheck[]> {
  const cwd = path.resolve(args.options?.cwd ?? process.cwd());
  const missingStatus = args.options?.missingStatus ?? 'warn';

  try {
    const loaded = await loadGtmManifest(cwd, args.config.paths.gtmManifest);
    const manifest = loaded.manifest;
    const checks: MarketingTrackingAuditCheck[] = [
      {
        id: 'gtm.manifest',
        status: 'pass',
        message: 'GTM manifest loaded for marketing audit.',
        path: loaded.path,
      },
    ];

    if (manifest.appId !== args.config.appId) {
      checks.push({
        id: 'gtm.manifest.appId',
        status: 'error',
        message: `GTM manifest appId ${manifest.appId} does not match marketing appId ${args.config.appId}.`,
        path: loaded.path,
      });
    }

    checks.push(
      ...auditDataLayerTriggers(manifest.triggers, canonicalDataLayerEvents(args.registries)),
      ...auditGa4EventTags(manifest.tags, canonicalGa4Events(args.registries)),
      ...auditConversionTags(manifest, conversionSourceEventIds(args.registries)),
    );
    return checks;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown GTM manifest audit error';
    return [
      {
        id: 'gtm.manifest',
        status: missingStatus,
        message,
      },
    ];
  }
}
