import { log } from '../../log.js';
import {
  isControlPlaneSecretName,
  publicControlPlaneEnvEntry,
  type ControlPlaneEnvEntry,
  type ControlPlaneEnvReport,
} from '@unisane/ops-engine';
import { runSeoDoctor } from '@unisane/growth/seo';
import type { SeoDoctorCliOptions } from './options.js';

type SeoDoctorWithControlPlane = Awaited<ReturnType<typeof runSeoDoctor>> & {
  controlPlane: {
    envReport: ControlPlaneEnvReport;
  };
};

function classifySeoEnvKind(name: string): ControlPlaneEnvEntry['kind'] {
  if (/(ACCESS_TOKEN|REFRESH_TOKEN|CLIENT_SECRET)$/i.test(name)) return 'fallback-debug';
  if (/CLIENT_ID$/i.test(name)) return 'bootstrap-local-secret';
  return 'provider-resource-ref';
}

function buildSeoControlPlaneReport(args: {
  result: Awaited<ReturnType<typeof runSeoDoctor>>;
  env: Record<string, string | undefined>;
}): SeoDoctorWithControlPlane {
  const seen = new Set<string>();
  const entries = args.result.providers.flatMap((provider) =>
    provider.requiredEnv.flatMap((name) => {
      if (seen.has(name)) return [];
      seen.add(name);
      return [
        publicControlPlaneEnvEntry({
          name,
          kind: classifySeoEnvKind(name),
          required: provider.enabled,
          secret: isControlPlaneSecretName(name),
          value: args.env[name],
          description: `${provider.id} setup value used by the SEO research lane.`,
          example: isControlPlaneSecretName(name) ? '<SECRET>' : `<${name.toLowerCase()}>`,
        }),
      ];
    }),
  );
  return {
    ...args.result,
    controlPlane: {
      envReport: {
        schemaVersion: 1,
        kind: 'control-plane.env-report',
        provider: 'seo',
        appId: args.result.platformId,
        environment: 'default',
        generatedAt: new Date().toISOString(),
        entries,
      },
    },
  };
}

export async function seoDoctor(options: SeoDoctorCliOptions): Promise<number> {
  try {
    const maxArtifactAgeHours =
      options.maxArtifactAgeHours === undefined ? undefined : Number(options.maxArtifactAgeHours);
    if (
      maxArtifactAgeHours !== undefined &&
      (!Number.isFinite(maxArtifactAgeHours) || maxArtifactAgeHours < 0)
    ) {
      throw new Error('--max-artifact-age-hours must be a non-negative number.');
    }

    const env = process.env;
    const result = await runSeoDoctor({
      cwd: options.cwd,
      platformId: options.platform,
      maxArtifactAgeHours,
      env,
    });
    const output = buildSeoControlPlaneReport({ result, env });
    if (options.json) {
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
      return output.ok ? 0 : 1;
    }

    log.success(output.ok ? 'SEO doctor passed' : 'SEO doctor completed with action required');
    log.kv('Platform', output.platformId);
    log.kv('Config', `${output.configPath} (${output.configSource})`);
    log.kv('SEO pattern pack', output.patternPack);
    log.kv('Keyword pattern pack', output.keywordPatternPack);
    log.info('Providers');
    for (const provider of output.providers) {
      const status = provider.enabled
        ? provider.missingEnv.length === 0
          ? 'enabled/configured'
          : `enabled/missing ${provider.missingEnv.join(', ')}`
        : 'disabled';
      log.kv(`  ${provider.id}`, status);
    }
    log.kv('Env guidance', `${output.controlPlane.envReport.entries.length} secret-free entries`);
    log.info('Artifacts');
    for (const artifact of output.artifacts) {
      const suffix = [
        artifact.path,
        artifact.ageHours === undefined ? undefined : `${artifact.ageHours}h old`,
        artifact.count === undefined ? undefined : `${artifact.count} records`,
      ]
        .filter(Boolean)
        .join(' | ');
      log.kv(`  ${artifact.kind}`, suffix ? `${artifact.status} | ${suffix}` : artifact.status);
    }
    log.kv('Next step', output.nextStep);
    return output.ok ? 0 : 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown SEO doctor error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
