import { log } from '@unisane/cli-core';
import { writeAwsJsonArtifact } from './artifacts.js';
import {
  collectAwsCloudFrontInventory,
  SdkAwsCloudFrontInventoryReader,
} from './cloudfront-inventory.js';
import { resolveAwsCommandContext } from './context.js';
import type {
  AwsCloudFrontInventoryReader,
  AwsCommandContext,
  AwsEnvOutputOptions,
  AwsEnvOutputReport,
  AwsEnvVariable,
  AwsIdentityReader,
  AwsOpsAppConfig,
  AwsOpsCdnConfig,
  AwsOpsMailIdentityConfig,
} from './types.js';

function configuredApp(context: AwsCommandContext, appKey: string): AwsOpsAppConfig {
  const appEntry = context.config.apps?.[appKey];
  if (!appEntry) {
    throw new Error(
      `[AWS_ENV_UNKNOWN_APP] Unknown app '${appKey}' for environment '${context.environment}'.`,
    );
  }
  if ('environments' in appEntry) {
    const app = appEntry.environments[context.environment];
    if (!app) {
      throw new Error(
        `[AWS_ENV_UNKNOWN_APP] Unknown app '${appKey}' for environment '${context.environment}'.`,
      );
    }
    return { ...app, environment: context.environment };
  }
  if (appEntry.environment !== context.environment) {
    throw new Error(
      `[AWS_ENV_UNKNOWN_APP] Unknown app '${appKey}' for environment '${context.environment}'.`,
    );
  }
  return appEntry;
}

function bucketName(context: AwsCommandContext, bucketKey: string): string {
  const bucket = context.config.buckets?.[bucketKey];
  if (!bucket || bucket.environment !== context.environment) {
    throw new Error(
      `[AWS_ENV_UNKNOWN_BUCKET] Unknown bucket '${bucketKey}' for environment '${context.environment}'.`,
    );
  }
  return bucket.name;
}

function configuredCdn(context: AwsCommandContext, cdnKey: string): AwsOpsCdnConfig {
  const cdn = context.config.cdn?.[cdnKey];
  if (!cdn || cdn.environment !== context.environment) {
    throw new Error(
      `[AWS_ENV_UNKNOWN_CDN] Unknown CDN '${cdnKey}' for environment '${context.environment}'.`,
    );
  }
  return cdn;
}

function configuredMailIdentity(
  context: AwsCommandContext,
  identityKey: string,
): AwsOpsMailIdentityConfig {
  const identity = context.config.mailIdentities?.[identityKey];
  if (!identity || identity.environment !== context.environment) {
    throw new Error(
      `[AWS_ENV_UNKNOWN_MAIL_IDENTITY] Unknown mail identity '${identityKey}' for environment '${context.environment}'.`,
    );
  }
  return identity;
}

async function objectDeliveryPublicBaseUrl(args: {
  context: AwsCommandContext;
  cdnKey: string;
  cdn: AwsOpsCdnConfig;
  inventoryReader: AwsCloudFrontInventoryReader;
}): Promise<string> {
  const inventory = await collectAwsCloudFrontInventory({
    context: args.context,
    reader: args.inventoryReader,
  });
  const distribution = inventory.distributions.find((entry) => entry.key === args.cdnKey);
  if (!inventory.ok || distribution?.errors.length) {
    throw new Error(
      `[AWS_ENV_CLOUDFRONT_INVENTORY_FAILED] Could not read CloudFront inventory for '${args.cdnKey}'.`,
    );
  }
  const host = args.cdn.aliases?.[0] ?? distribution?.domainName;
  if (!host) {
    throw new Error(
      `[AWS_ENV_CLOUDFRONT_DOMAIN_MISSING] No CloudFront domain or alias found for '${args.cdnKey}'.`,
    );
  }
  return `https://${host}`;
}

function addVariable(
  variables: AwsEnvVariable[],
  name: string,
  value: string,
  source: string,
): void {
  variables.push({ name, value, source, sensitive: false });
}

export async function createAwsEnvOutput(args: {
  context: AwsCommandContext;
  appKey: string;
  inventoryReader: AwsCloudFrontInventoryReader;
  generatedAt?: string;
}): Promise<AwsEnvOutputReport> {
  const app = configuredApp(args.context, args.appKey);
  const variables: AwsEnvVariable[] = [];

  addVariable(variables, 'AWS_REGION', args.context.account.region, 'environment.region');

  if (app.storageBucket) {
    addVariable(
      variables,
      'STORAGE_BUCKET',
      bucketName(args.context, app.storageBucket),
      'app.storageBucket',
    );
  }

  if (app.objectDeliveryPublicBaseUrlFromCdn) {
    const cdn = configuredCdn(args.context, app.objectDeliveryPublicBaseUrlFromCdn);
    const baseUrl = await objectDeliveryPublicBaseUrl({
      context: args.context,
      cdnKey: app.objectDeliveryPublicBaseUrlFromCdn,
      cdn,
      inventoryReader: args.inventoryReader,
    });
    addVariable(
      variables,
      'OBJECT_DELIVERY_PROVIDER',
      'public-base-url',
      'app.objectDeliveryPublicBaseUrlFromCdn',
    );
    addVariable(
      variables,
      'OBJECT_DELIVERY_PUBLIC_BASE_URL',
      baseUrl,
      'app.objectDeliveryPublicBaseUrlFromCdn',
    );
  }

  if (app.mailIdentity) {
    const identity = configuredMailIdentity(args.context, app.mailIdentity);
    addVariable(variables, 'SES_REGION', args.context.account.region, 'environment.region');
    addVariable(variables, 'SES_IDENTITY_DOMAIN', identity.domain, 'app.mailIdentity.domain');
    if (identity.mailFromDomain) {
      addVariable(
        variables,
        'SES_MAIL_FROM_DOMAIN',
        identity.mailFromDomain,
        'app.mailIdentity.mailFromDomain',
      );
    }
    if (identity.configurationSet) {
      addVariable(
        variables,
        'SES_CONFIGURATION_SET',
        identity.configurationSet,
        'app.mailIdentity.configurationSet',
      );
    }
    const snsEventDestination = identity.eventDestinations?.find(
      (destination) =>
        destination.type === 'sns' &&
        Boolean(destination.topicArn) &&
        destination.matchingEventTypes.some((eventType) => eventType.toUpperCase() === 'BOUNCE') &&
        destination.matchingEventTypes.some((eventType) => eventType.toUpperCase() === 'COMPLAINT'),
    );
    if (snsEventDestination?.topicArn) {
      addVariable(
        variables,
        'SES_SNS_TOPIC_ARN',
        snsEventDestination.topicArn,
        'app.mailIdentity.eventDestinations.sns.topicArn',
      );
    }
  }

  return {
    ok: true,
    environment: args.context.environment,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    configPath: args.context.configPath,
    account: args.context.account,
    appKey: args.appKey,
    variables,
  };
}

export async function runAwsEnvOutput(
  options: AwsEnvOutputOptions,
  deps?: { identityReader?: AwsIdentityReader; inventoryReader?: AwsCloudFrontInventoryReader },
): Promise<AwsEnvOutputReport> {
  const context = await resolveAwsCommandContext(options, { identityReader: deps?.identityReader });
  const reportWithoutArtifact = await createAwsEnvOutput({
    context,
    appKey: options.appKey,
    inventoryReader: deps?.inventoryReader ?? new SdkAwsCloudFrontInventoryReader(),
  });
  if (!options.output) return reportWithoutArtifact;
  const artifact = writeAwsJsonArtifact({
    cwd: context.cwd,
    outputPath: options.output,
    defaultRelativePath: `.unisane/aws/${context.environment}/env/${options.appKey}.json`,
    value: reportWithoutArtifact,
  });
  return { ...reportWithoutArtifact, artifact };
}

function printDotEnv(report: AwsEnvOutputReport): void {
  for (const variable of report.variables) {
    console.log(`${variable.name}=${variable.value}`);
  }
}

export async function awsEnvOutput(options: AwsEnvOutputOptions): Promise<number> {
  try {
    const report = await runAwsEnvOutput(options);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printDotEnv(report);
      if (report.artifact) log.info(`Artifact: ${report.artifact.relativePath}`);
    }
    return report.ok ? 0 : 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AWS env output error.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 2;
  }
}
