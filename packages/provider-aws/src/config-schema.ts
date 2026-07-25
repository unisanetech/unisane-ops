import { z } from 'zod';
import type { AwsOpsConfig } from './types.js';

const nonEmptyString = z.string().trim().min(1);

const accountSchema = z.object({
  accountId: nonEmptyString,
  profile: z.string().trim().min(1).optional(),
  defaultRegion: z.string().trim().min(1).optional(),
});

const environmentSchema = z.object({
  account: nonEmptyString,
  region: z.string().trim().min(1).optional(),
  production: z.boolean().optional(),
});

const bucketPrefixSchema = z.object({
  path: nonEmptyString,
  dataClass: nonEmptyString,
});

const bucketCorsSchema = z.object({
  allowedOrigins: z.array(nonEmptyString).min(1),
  allowedMethods: z.array(nonEmptyString).optional(),
  allowedHeaders: z.array(nonEmptyString).optional(),
  exposeHeaders: z.array(nonEmptyString).optional(),
  maxAgeSeconds: z.number().int().positive().optional(),
});

const bucketSchema = z.object({
  environment: nonEmptyString,
  name: nonEmptyString,
  adoptExisting: z.boolean().optional(),
  blockPublicAccess: z.boolean().optional(),
  objectOwnership: z.string().trim().min(1).optional(),
  encryption: z
    .object({
      type: nonEmptyString,
    })
    .optional(),
  prefixes: z.array(bucketPrefixSchema).optional(),
  cors: bucketCorsSchema.optional(),
});

const cdnAccessLogsSchema = z.object({
  bucket: nonEmptyString,
  prefix: z.string().optional(),
  includeCookies: z.boolean().optional(),
});

const cdnSchema = z.object({
  environment: nonEmptyString,
  originBucket: nonEmptyString,
  access: nonEmptyString,
  certificate: z.string().trim().min(1).optional(),
  aliases: z.array(z.string()).optional(),
  publicPrefixes: z.array(z.string()).optional(),
  accessLogs: cdnAccessLogsSchema.optional(),
});

const appSchema = z.object({
  environment: nonEmptyString,
  storageBucket: z.string().trim().min(1).optional(),
  objectDeliveryPublicBaseUrlFromCdn: z.string().trim().min(1).optional(),
  mailIdentity: z.string().trim().min(1).optional(),
});

const appEnvironmentSchema = appSchema.omit({ environment: true });

const appEntrySchema = z.union([
  appSchema,
  z.object({
    environments: z.record(appEnvironmentSchema),
  }),
]);

const snsSubscriptionSchema = z
  .object({
    protocol: nonEmptyString,
    endpoint: nonEmptyString,
  })
  .superRefine((subscription, ctx) => {
    if (subscription.protocol === 'https' && !subscription.endpoint.startsWith('https://')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endpoint'],
        message: 'HTTPS SNS subscriptions must use an https:// endpoint.',
      });
    }
  });

const mailEventDestinationSchema = z
  .object({
    name: nonEmptyString,
    type: nonEmptyString,
    matchingEventTypes: z.array(nonEmptyString).min(1),
    enabled: z.boolean().optional(),
    topicArn: z.string().trim().min(1).optional(),
    subscriptions: z.array(snsSubscriptionSchema).optional(),
  })
  .superRefine((destination, ctx) => {
    if (destination.type === 'sns' && !destination.topicArn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['topicArn'],
        message: `SNS mail event destination '${destination.name}' must declare topicArn.`,
      });
    }
    if (destination.subscriptions?.length && destination.type !== 'sns') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subscriptions'],
        message: `Mail event destination '${destination.name}' can only declare subscriptions for SNS destinations.`,
      });
    }
  });

const mailIdentitySchema = z.object({
  environment: nonEmptyString,
  domain: nonEmptyString,
  mailFromDomain: z.string().trim().min(1).optional(),
  configurationSet: z.string().trim().min(1).optional(),
  eventDestinations: z.array(mailEventDestinationSchema).optional(),
  bimi: z
    .object({
      selector: z
        .string()
        .trim()
        .regex(/^[a-z0-9][a-z0-9-]*$/i, 'BIMI selector must be a DNS label.')
        .optional(),
      logoUrl: z.string().trim().url().startsWith('https://'),
      certificateUrl: z.string().trim().url().startsWith('https://').optional(),
      hostedZone: z.string().trim().min(1).optional(),
    })
    .optional(),
});

const certificateSchema = z.object({
  environment: nonEmptyString,
  domainName: nonEmptyString,
  subjectAlternativeNames: z.array(z.string().trim().min(1)).optional(),
  usage: z.string().trim().min(1).optional(),
  region: z.string().trim().min(1).optional(),
  hostedZone: z.string().trim().min(1).optional(),
});

const dnsZoneSchema = z.object({
  environment: nonEmptyString,
  name: nonEmptyString,
  hostedZoneId: z.string().trim().min(1).optional(),
  provider: z.string().trim().min(1).optional(),
  privateZone: z.boolean().optional(),
});

const awsOpsConfigSchema = z
  .object({
    defaults: z
      .object({
        tags: z.record(z.string()).optional(),
        publicAssetCache: z
          .object({
            strategy: z.string().optional(),
            defaultMaxAgeSeconds: z.number().int().positive().optional(),
          })
          .optional(),
        locking: z
          .object({
            provider: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
    accounts: z.record(accountSchema),
    environments: z.record(environmentSchema),
    buckets: z.record(bucketSchema).optional(),
    cdn: z.record(cdnSchema).optional(),
    apps: z.record(appEntrySchema).optional(),
    mailIdentities: z.record(mailIdentitySchema).optional(),
    certificates: z.record(certificateSchema).optional(),
    dnsZones: z.record(dnsZoneSchema).optional(),
  })
  .superRefine((config, ctx) => {
    for (const [environmentKey, environment] of Object.entries(config.environments)) {
      if (!config.accounts[environment.account]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['environments', environmentKey, 'account'],
          message: `Environment '${environmentKey}' references unknown account '${environment.account}'.`,
        });
      }
    }

    for (const [bucketKey, bucket] of Object.entries(config.buckets ?? {})) {
      if (!config.environments[bucket.environment]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['buckets', bucketKey, 'environment'],
          message: `Bucket '${bucketKey}' references unknown environment '${bucket.environment}'.`,
        });
      }
    }

    for (const [cdnKey, cdn] of Object.entries(config.cdn ?? {})) {
      if (!config.environments[cdn.environment]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cdn', cdnKey, 'environment'],
          message: `CDN '${cdnKey}' references unknown environment '${cdn.environment}'.`,
        });
      }
      if (config.buckets && !config.buckets[cdn.originBucket]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cdn', cdnKey, 'originBucket'],
          message: `CDN '${cdnKey}' references unknown bucket '${cdn.originBucket}'.`,
        });
      }
      if (cdn.accessLogs && config.buckets && !config.buckets[cdn.accessLogs.bucket]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cdn', cdnKey, 'accessLogs', 'bucket'],
          message: `CDN '${cdnKey}' references unknown access log bucket '${cdn.accessLogs.bucket}'.`,
        });
      }
      const accessLogBucket = cdn.accessLogs ? config.buckets?.[cdn.accessLogs.bucket] : undefined;
      if (cdn.accessLogs && accessLogBucket && accessLogBucket.environment !== cdn.environment) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cdn', cdnKey, 'accessLogs', 'bucket'],
          message: `CDN '${cdnKey}' access log bucket '${cdn.accessLogs.bucket}' belongs to a different environment.`,
        });
      }
      if (cdn.accessLogs && accessLogBucket?.objectOwnership !== 'bucket-owner-preferred') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cdn', cdnKey, 'accessLogs', 'bucket'],
          message: `CDN '${cdnKey}' access log bucket '${cdn.accessLogs.bucket}' must set objectOwnership to 'bucket-owner-preferred' for CloudFront standard S3 logs.`,
        });
      }
      if (cdn.certificate && config.certificates && !config.certificates[cdn.certificate]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cdn', cdnKey, 'certificate'],
          message: `CDN '${cdnKey}' references unknown certificate '${cdn.certificate}'.`,
        });
      }
      const cdnCertificate = cdn.certificate ? config.certificates?.[cdn.certificate] : undefined;
      if (cdn.certificate && cdnCertificate && cdnCertificate.environment !== cdn.environment) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cdn', cdnKey, 'certificate'],
          message: `CDN '${cdnKey}' certificate '${cdn.certificate}' belongs to a different environment.`,
        });
      }
    }

    for (const [appKey, appEntry] of Object.entries(config.apps ?? {})) {
      const appEnvironments: Array<[string, z.infer<typeof appSchema>]> =
        'environments' in appEntry
          ? Object.entries(appEntry.environments).map(([environment, app]) => [
              environment,
              { ...app, environment },
            ])
          : [[appEntry.environment, appEntry]];

      for (const [appEnvironmentKey, app] of appEnvironments) {
        const appPath = ['apps', appKey, 'environments', appEnvironmentKey];
        if (!config.environments[app.environment]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: appPath,
            message: `App '${appKey}' references unknown environment '${app.environment}'.`,
          });
        }
        if (app.storageBucket && config.buckets && !config.buckets[app.storageBucket]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...appPath, 'storageBucket'],
            message: `App '${appKey}' references unknown bucket '${app.storageBucket}'.`,
          });
        }
        const appStorageBucket = app.storageBucket
          ? config.buckets?.[app.storageBucket]
          : undefined;
        if (
          app.storageBucket &&
          appStorageBucket &&
          appStorageBucket.environment !== app.environment
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...appPath, 'storageBucket'],
            message: `App '${appKey}' storage bucket '${app.storageBucket}' belongs to a different environment.`,
          });
        }
        if (
          app.objectDeliveryPublicBaseUrlFromCdn &&
          config.cdn &&
          !config.cdn[app.objectDeliveryPublicBaseUrlFromCdn]
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...appPath, 'objectDeliveryPublicBaseUrlFromCdn'],
            message: `App '${appKey}' references unknown CDN '${app.objectDeliveryPublicBaseUrlFromCdn}'.`,
          });
        }
        const appCdn = app.objectDeliveryPublicBaseUrlFromCdn
          ? config.cdn?.[app.objectDeliveryPublicBaseUrlFromCdn]
          : undefined;
        if (
          app.objectDeliveryPublicBaseUrlFromCdn &&
          appCdn &&
          appCdn.environment !== app.environment
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...appPath, 'objectDeliveryPublicBaseUrlFromCdn'],
            message: `App '${appKey}' CDN '${app.objectDeliveryPublicBaseUrlFromCdn}' belongs to a different environment.`,
          });
        }
        if (app.mailIdentity && config.mailIdentities && !config.mailIdentities[app.mailIdentity]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...appPath, 'mailIdentity'],
            message: `App '${appKey}' references unknown mail identity '${app.mailIdentity}'.`,
          });
        }
        const appMailIdentity = app.mailIdentity
          ? config.mailIdentities?.[app.mailIdentity]
          : undefined;
        if (
          app.mailIdentity &&
          appMailIdentity &&
          appMailIdentity.environment !== app.environment
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...appPath, 'mailIdentity'],
            message: `App '${appKey}' mail identity '${app.mailIdentity}' belongs to a different environment.`,
          });
        }
      }
    }

    for (const [identityKey, identity] of Object.entries(config.mailIdentities ?? {})) {
      if (!config.environments[identity.environment]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['mailIdentities', identityKey, 'environment'],
          message: `Mail identity '${identityKey}' references unknown environment '${identity.environment}'.`,
        });
      }
      if (identity.eventDestinations?.length && !identity.configurationSet) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['mailIdentities', identityKey, 'eventDestinations'],
          message: `Mail identity '${identityKey}' declares event destinations but no configurationSet.`,
        });
      }
      const destinationNames = new Set<string>();
      for (const [index, destination] of (identity.eventDestinations ?? []).entries()) {
        if (destinationNames.has(destination.name)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['mailIdentities', identityKey, 'eventDestinations', index, 'name'],
            message: `Mail identity '${identityKey}' has duplicate event destination '${destination.name}'.`,
          });
        }
        destinationNames.add(destination.name);
        const subscriptionKeys = new Set<string>();
        for (const [subscriptionIndex, subscription] of (
          destination.subscriptions ?? []
        ).entries()) {
          const subscriptionKey = `${subscription.protocol}:${subscription.endpoint}`;
          if (subscriptionKeys.has(subscriptionKey)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [
                'mailIdentities',
                identityKey,
                'eventDestinations',
                index,
                'subscriptions',
                subscriptionIndex,
              ],
              message: `Mail event destination '${destination.name}' has duplicate SNS subscription '${subscriptionKey}'.`,
            });
          }
          subscriptionKeys.add(subscriptionKey);
        }
      }
    }

    for (const [zoneKey, zone] of Object.entries(config.dnsZones ?? {})) {
      if (!config.environments[zone.environment]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dnsZones', zoneKey, 'environment'],
          message: `DNS zone '${zoneKey}' references unknown environment '${zone.environment}'.`,
        });
      }
    }

    for (const [certificateKey, certificate] of Object.entries(config.certificates ?? {})) {
      if (!config.environments[certificate.environment]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['certificates', certificateKey, 'environment'],
          message: `Certificate '${certificateKey}' references unknown environment '${certificate.environment}'.`,
        });
      }
      if (certificate.hostedZone && config.dnsZones && !config.dnsZones[certificate.hostedZone]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['certificates', certificateKey, 'hostedZone'],
          message: `Certificate '${certificateKey}' references unknown DNS zone '${certificate.hostedZone}'.`,
        });
      }
    }
  });

export function validateAwsOpsConfig(value: unknown): AwsOpsConfig {
  return awsOpsConfigSchema.parse(value);
}

export function defineAwsOpsConfig(config: AwsOpsConfig): AwsOpsConfig {
  return config;
}
