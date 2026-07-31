import { existsSync } from 'node:fs';
import path from 'node:path';
import type {
  MarketingTrackingEmitter,
  MarketingTrackingEmitterId,
  MarketingTrackingFinding,
  SourceFile,
} from './audit-types.js';

const DETECTORS: Array<{
  id: MarketingTrackingEmitterId;
  label: string;
  channel: 'browser' | 'server';
  pattern: RegExp;
}> = [
  {
    id: 'web-runtime',
    label: 'Unisane Web Runtime',
    channel: 'browser',
    pattern: /@unisane\/web-runtime\/tracking/,
  },
  {
    id: 'gtm',
    label: 'Google Tag Manager',
    channel: 'browser',
    pattern: /@unisane\/web-runtime\/tracking\/next|googletagmanager\.com|\bdataLayer\b/,
  },
  { id: 'gtag', label: 'Direct gtag', channel: 'browser', pattern: /\b(?:window\.)?gtag\s*\(/ },
  { id: 'meta-pixel', label: 'Meta Pixel', channel: 'browser', pattern: /\b(?:window\.)?fbq\s*\(/ },
  {
    id: 'meta-capi',
    label: 'Meta Conversions API',
    channel: 'server',
    pattern: /@unisane\/web-runtime\/conversions\/meta/,
  },
  {
    id: 'google-ads',
    label: 'Google Ads conversions',
    channel: 'server',
    pattern: /@unisane\/web-runtime\/conversions\/google-ads/,
  },
];

const DIRECT_EMITTERS = new Set<MarketingTrackingEmitterId>(['gtag', 'meta-pixel']);

function upsertEmitter(
  map: Map<MarketingTrackingEmitterId, MarketingTrackingEmitter>,
  input: {
    id: MarketingTrackingEmitterId;
    label: string;
    channel: 'browser' | 'server';
    detectedBy: 'source' | 'manifest' | 'observation';
    path?: string;
    direct?: boolean;
  },
): void {
  const current = map.get(input.id) ?? {
    id: input.id,
    label: input.label,
    channels: [],
    detectedBy: [],
    paths: [],
    direct: input.direct ?? false,
  };
  current.channels = [...new Set([...current.channels, input.channel])];
  current.detectedBy = [...new Set([...current.detectedBy, input.detectedBy])];
  current.paths = input.path ? [...new Set([...current.paths, input.path])] : current.paths;
  current.direct ||= input.direct ?? false;
  map.set(input.id, current);
}

function emitterLabel(id: MarketingTrackingEmitterId): string {
  return DETECTORS.find((detector) => detector.id === id)?.label ?? 'Other event emitter';
}

function emitterChannel(id: MarketingTrackingEmitterId): 'browser' | 'server' {
  return DETECTORS.find((detector) => detector.id === id)?.channel ?? 'browser';
}

export function detectMarketingTrackingEmitters(input: {
  cwd: string;
  files: SourceFile[];
  gtmManifestPath: string;
  observedEmitterIds: MarketingTrackingEmitterId[];
}): { emitters: MarketingTrackingEmitter[]; findings: MarketingTrackingFinding[] } {
  const emitters = new Map<MarketingTrackingEmitterId, MarketingTrackingEmitter>();
  for (const file of input.files) {
    for (const detector of DETECTORS) {
      if (!detector.pattern.test(file.source)) continue;
      upsertEmitter(emitters, {
        id: detector.id,
        label: detector.label,
        channel: detector.channel,
        detectedBy: 'source',
        path: file.path,
        direct: DIRECT_EMITTERS.has(detector.id),
      });
    }
  }

  const manifestPath = path.resolve(input.cwd, input.gtmManifestPath);
  if (existsSync(manifestPath)) {
    upsertEmitter(emitters, {
      id: 'gtm',
      label: 'Google Tag Manager',
      channel: 'browser',
      detectedBy: 'manifest',
      path: manifestPath,
    });
  }
  for (const id of input.observedEmitterIds) {
    upsertEmitter(emitters, {
      id,
      label: emitterLabel(id),
      channel: emitterChannel(id),
      detectedBy: 'observation',
      direct: DIRECT_EMITTERS.has(id),
    });
  }

  const browserEmitters = [...emitters.values()].filter((emitter) =>
    emitter.channels.includes('browser'),
  );
  const directBrowserEmitters = browserEmitters.filter((emitter) => emitter.direct);
  const managedBrowserEmitterPresent = browserEmitters.some(
    (emitter) => emitter.id === 'web-runtime' || emitter.id === 'gtm',
  );
  const findings: MarketingTrackingFinding[] = [];
  if (
    directBrowserEmitters.length > 1 ||
    (directBrowserEmitters.length > 0 && managedBrowserEmitterPresent)
  ) {
    findings.push({
      id: 'emitters.browser.competing',
      category: 'competing-emitter',
      severity: 'error',
      title: 'Competing browser event emitters were detected',
      detail: `${browserEmitters.map((emitter) => emitter.label).join(', ')} can emit overlapping browser events. Reconcile ownership before adding or changing scripts.`,
      path: directBrowserEmitters[0]?.paths[0],
    });
  }

  return { emitters: [...emitters.values()], findings };
}
