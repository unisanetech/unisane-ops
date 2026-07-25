import type { GoogleTagManagerCliOptions, LoadedCommandContext } from './shared.js';

export function assertPublishAllowed(args: {
  context: LoadedCommandContext;
  options: GoogleTagManagerCliOptions;
  versionId: string;
  action: 'publish' | 'rollback';
}): void {
  const environment = args.context.manifest.environments[args.context.environment];
  if (!environment) {
    throw new Error(
      `[GTM_ENVIRONMENT_UNKNOWN] Environment '${args.context.environment}' is not declared in the GTM manifest.`,
    );
  }
  if (environment.publishPolicy === 'never') {
    throw new Error(
      `[GTM_PUBLISH_POLICY_BLOCKED] Environment '${args.context.environment}' has publishPolicy=never.`,
    );
  }
  if (!args.options.yes) {
    throw new Error(
      `[GTM_${args.action.toUpperCase()}_CONFIRMATION_REQUIRED] Re-run with --yes to ${args.action} GTM.`,
    );
  }
  if (args.context.environment === 'production') {
    const expected = `${args.context.manifest.appId}:${args.context.environment}:${args.versionId}`;
    if (args.options.productionConfirm !== expected) {
      throw new Error(
        `[GTM_PRODUCTION_CONFIRMATION_REQUIRED] Pass --production-confirm ${expected} for production ${args.action}.`,
      );
    }
  }
}

export function requiredVersion(options: GoogleTagManagerCliOptions): string {
  const versionId = options.version?.trim();
  if (!versionId) {
    throw new Error('[GTM_VERSION_REQUIRED] Pass --version <container-version-id>.');
  }
  return versionId;
}
