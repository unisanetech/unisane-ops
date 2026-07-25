import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createAwsAuditReport,
  createAwsDomainsPlan,
  runAwsDomainsApply,
  runAwsDomainsCertificateDelete,
  runAwsDomainsInventory,
  runAwsDomainsPlan,
  SdkAwsDomainsApplyExecutor,
} from '../index.js';
import type {
  AwsCommandContext,
  AwsDomainCertificateInventory,
  AwsDomainCloudFrontAliasInventory,
  AwsDomainDnsZoneInventory,
  AwsDomainMailIdentityInventory,
  AwsDomainSesAccountInventory,
  AwsDomainsApplyExecutor,
  AwsDomainsCertificateDeleteExecutor,
  AwsDomainsInventoryReader,
  AwsDomainsInventoryReport,
  AwsDomainsPlanReport,
  AwsIdentityReader,
} from '../types.js';

function createTempProject(configSource: string): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-aws-domains-'));
  mkdirSync(path.join(cwd, 'config'), { recursive: true });
  writeFileSync(path.join(cwd, 'config/aws.ops.mjs'), configSource, 'utf8');
  return cwd;
}

function configSource(): string {
  return `export default {
  defaults: {
    tags: {
      Project: 'Unisane',
      ManagedBy: 'unisane-devtools',
      Owner: 'architecture-program'
    }
  },
  accounts: {
    dev: {
      accountId: '123456789012',
      profile: 'unisane-dev',
      defaultRegion: 'us-east-1'
    }
  },
  environments: {
    dev: {
      account: 'dev',
      region: 'us-east-1',
      production: false
    }
  },
  mailIdentities: {
    trueResumeMail: {
      environment: 'dev',
      domain: 'mail.dev.true-resume.test',
      mailFromDomain: 'bounce.dev.true-resume.test',
      configurationSet: 'unisane-dev-true-resume-mail'
    }
  },
  dnsZones: {
    trueResumeDev: {
      environment: 'dev',
      name: 'dev.true-resume.test',
      provider: 'route53',
      privateZone: false
    }
  },
  certificates: {
    trueResumeAssets: {
      environment: 'dev',
      domainName: 'assets.dev.true-resume.test',
      subjectAlternativeNames: ['cdn.dev.true-resume.test'],
      usage: 'cloudfront',
      hostedZone: 'trueResumeDev'
    }
  }
};`;
}

function identityReader(): AwsIdentityReader {
  return {
    read: async () => ({
      accountId: '123456789012',
      arn: 'arn:aws:iam::123456789012:user/dev',
      userId: 'user-id',
    }),
  };
}

function context(overrides?: Partial<AwsCommandContext>): AwsCommandContext {
  return {
    cwd: '/tmp/unisane-aws-domains-test',
    configPath: '/tmp/unisane-aws-domains-test/config/aws.ops.mjs',
    environment: 'dev',
    config: {
      defaults: {
        tags: {
          Project: 'Unisane',
          ManagedBy: 'unisane-devtools',
          Owner: 'architecture-program',
        },
      },
      accounts: {
        dev: {
          accountId: '123456789012',
          profile: 'unisane-dev',
          defaultRegion: 'us-east-1',
        },
      },
      environments: {
        dev: {
          account: 'dev',
          region: 'us-east-1',
          production: false,
        },
      },
      mailIdentities: {
        trueResumeMail: {
          environment: 'dev',
          domain: 'mail.dev.true-resume.test',
          mailFromDomain: 'bounce.dev.true-resume.test',
          configurationSet: 'unisane-dev-true-resume-mail',
        },
      },
      dnsZones: {
        trueResumeDev: {
          environment: 'dev',
          name: 'dev.true-resume.test',
          provider: 'route53',
          privateZone: false,
        },
      },
      certificates: {
        trueResumeAssets: {
          environment: 'dev',
          domainName: 'assets.dev.true-resume.test',
          subjectAlternativeNames: ['cdn.dev.true-resume.test'],
          usage: 'cloudfront',
          hostedZone: 'trueResumeDev',
        },
      },
    },
    account: {
      key: 'dev',
      expectedAccountId: '123456789012',
      actualAccountId: '123456789012',
      profile: 'unisane-dev',
      region: 'us-east-1',
      production: false,
    },
    ...overrides,
  };
}

function mailInventory(
  overrides?: Partial<AwsDomainMailIdentityInventory>,
): AwsDomainMailIdentityInventory {
  return {
    key: 'trueResumeMail',
    environment: 'dev',
    domain: 'mail.dev.true-resume.test',
    exists: true,
    identityType: 'DOMAIN',
    verifiedForSending: true,
    verificationStatus: 'SUCCESS',
    dkimStatus: 'SUCCESS',
    dkimTokens: [],
    dkimSigningHostedZone: null,
    mailFromDomain: 'bounce.dev.true-resume.test',
    mailFromStatus: 'SUCCESS',
    configurationSetName: 'unisane-dev-true-resume-mail',
    desiredMailFromDomain: 'bounce.dev.true-resume.test',
    desiredConfigurationSetName: 'unisane-dev-true-resume-mail',
    configurationSetExists: true,
    configurationSetEventDestinations: [
      {
        name: 'events',
        enabled: true,
        matchingEventTypes: ['BOUNCE', 'COMPLAINT'],
        destinationTypes: ['sns'],
        snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:ses-events',
        snsSubscriptions: [
          {
            protocol: 'https',
            endpoint: 'https://dev.true-resume.test/api/rest/v1/webhooks/in/ses',
            subscriptionArn: 'arn:aws:sns:us-east-1:123456789012:ses-events:subscription-id',
            pendingConfirmation: false,
          },
        ],
      },
    ],
    errors: [],
    ...overrides,
  };
}

function sesAccountInventory(
  overrides?: Partial<AwsDomainSesAccountInventory>,
): AwsDomainSesAccountInventory {
  return {
    productionAccessEnabled: true,
    sendingEnabled: true,
    enforcementStatus: 'HEALTHY',
    suppressedReasons: ['BOUNCE', 'COMPLAINT'],
    errors: [],
    ...overrides,
  };
}

function certificateInventory(
  overrides?: Partial<AwsDomainCertificateInventory>,
): AwsDomainCertificateInventory {
  return {
    key: 'trueResumeAssets',
    environment: 'dev',
    domainName: 'assets.dev.true-resume.test',
    certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/cert-id',
    region: 'us-east-1',
    status: 'ISSUED',
    subjectAlternativeNames: ['cdn.dev.true-resume.test'],
    validationMethod: 'DNS',
    renewalEligibility: 'ELIGIBLE',
    inUseBy: [],
    desiredSubjectAlternativeNames: ['cdn.dev.true-resume.test'],
    desiredHostedZone: 'trueResumeDev',
    validationRecords: [],
    errors: [],
    ...overrides,
  };
}

function dnsZoneInventory(
  overrides?: Partial<AwsDomainDnsZoneInventory>,
): AwsDomainDnsZoneInventory {
  return {
    key: 'trueResumeDev',
    environment: 'dev',
    name: 'dev.true-resume.test',
    hostedZoneId: 'Z1234567890',
    exists: true,
    provider: 'route53',
    privateZone: false,
    nameServers: ['ns-1.awsdns.test'],
    records: [
      {
        name: 'bounce.dev.true-resume.test.',
        type: 'MX',
        values: ['10 feedback-smtp.us-east-1.amazonses.com'],
        ttl: 300,
      },
      {
        name: 'bounce.dev.true-resume.test.',
        type: 'TXT',
        values: ['"v=spf1 include:amazonses.com ~all"'],
        ttl: 300,
      },
      {
        name: '_dmarc.mail.dev.true-resume.test.',
        type: 'TXT',
        values: ['"v=DMARC1; p=none"'],
        ttl: 300,
      },
    ],
    errors: [],
    ...overrides,
  };
}

function cloudFrontAliasInventory(
  overrides?: Partial<AwsDomainCloudFrontAliasInventory>,
): AwsDomainCloudFrontAliasInventory {
  return {
    cdnKey: 'trueResumeAssets',
    environment: 'dev',
    distributionId: 'E1234567890',
    domainName: 'd111111abcdef8.cloudfront.net',
    status: 'Deployed',
    enabled: true,
    aliases: ['assets.dev.true-resume.test'],
    desiredAliases: ['assets.dev.true-resume.test'],
    route53HostedZoneId: 'Z2FDTNDATAQYW2',
    errors: [],
    ...overrides,
  };
}

function inventoryReport(args?: {
  sesAccount?: AwsDomainSesAccountInventory;
  mail?: AwsDomainMailIdentityInventory;
  certificate?: AwsDomainCertificateInventory;
  dnsZone?: AwsDomainDnsZoneInventory;
  cloudFrontAliases?: AwsDomainCloudFrontAliasInventory[];
}): AwsDomainsInventoryReport {
  const ctx = context();
  const mail = args?.mail ?? mailInventory();
  const certificate = args?.certificate ?? certificateInventory();
  const dnsZone = args?.dnsZone ?? dnsZoneInventory();
  return {
    ok: [...mail.errors, ...certificate.errors, ...dnsZone.errors].length === 0,
    environment: 'dev',
    generatedAt: '2026-05-14T00:00:00.000Z',
    configPath: ctx.configPath,
    account: ctx.account,
    sesAccount: args?.sesAccount ?? sesAccountInventory(),
    mailIdentities: [mail],
    certificates: [certificate],
    dnsZones: [dnsZone],
    cloudFrontAliases: args?.cloudFrontAliases ?? [],
  };
}

function writeDomainsPlan(cwd: string, plan: AwsDomainsPlanReport): string {
  const relativePath = '.unisane/aws/dev/plans/test-domains-apply-plan.json';
  const resolved = path.join(cwd, relativePath);
  mkdirSync(path.dirname(resolved), { recursive: true });
  writeFileSync(resolved, JSON.stringify(plan, null, 2), 'utf8');
  return relativePath;
}

describe('aws domains inventory and plan', () => {
  const tempProjects: string[] = [];

  afterEach(() => {
    for (const project of tempProjects.splice(0)) {
      rmSync(project, { recursive: true, force: true });
    }
  });

  it('writes a read-only domains inventory artifact with an injected reader', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const inventoryReader: AwsDomainsInventoryReader = {
      read: async () => ({
        sesAccount: sesAccountInventory(),
        mailIdentities: [mailInventory()],
        certificates: [certificateInventory()],
        dnsZones: [dnsZoneInventory()],
      }),
    };

    const report = await runAwsDomainsInventory(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        output: '.unisane/aws/dev/inventory/test-domains.json',
      },
      { identityReader: identityReader(), inventoryReader },
    );

    expect(report.ok).toBe(true);
    expect(report.artifact?.relativePath).toBe('.unisane/aws/dev/inventory/test-domains.json');
    expect(existsSync(path.join(cwd, '.unisane/aws/dev/inventory/test-domains.json'))).toBe(true);
    const persisted = JSON.parse(
      readFileSync(path.join(cwd, '.unisane/aws/dev/inventory/test-domains.json'), 'utf8'),
    ) as AwsDomainsInventoryReport;
    expect(persisted.mailIdentities[0]?.domain).toBe('mail.dev.true-resume.test');
  });

  it('plans creation when mail identity, certificate, and hosted zone are missing', () => {
    const plan = createAwsDomainsPlan({
      context: context(),
      inventory: inventoryReport({
        mail: mailInventory({ exists: false }),
        certificate: certificateInventory({ certificateArn: null, status: null }),
        dnsZone: dnsZoneInventory({ exists: false, hostedZoneId: null }),
      }),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.summary.create).toBe(3);
    expect(plan.operations.map((operation) => operation.check)).toEqual(
      expect.arrayContaining(['mail.identity.exists', 'certificate.exists', 'dns.zone.exists']),
    );
  });

  it('plans updates for SES verification, DKIM, MAIL FROM, and configuration set drift', () => {
    const plan = createAwsDomainsPlan({
      context: context(),
      inventory: inventoryReport({
        mail: mailInventory({
          verifiedForSending: false,
          verificationStatus: 'PENDING',
          dkimStatus: 'PENDING',
          mailFromDomain: null,
          mailFromStatus: null,
          configurationSetName: null,
          configurationSetExists: false,
        }),
      }),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.summary.update).toBe(4);
    expect(plan.summary.create).toBe(1);
    expect(plan.operations.map((operation) => operation.check)).toEqual(
      expect.arrayContaining([
        'mail.identity.verified',
        'mail.identity.dkim',
        'mail.identity.mail-from-domain',
        'mail.configuration-set.exists',
        'mail.identity.configuration-set',
      ]),
    );
  });

  it('plans SES configuration set SNS event destination drift from desired state', () => {
    const baseContext = context();
    const plan = createAwsDomainsPlan({
      context: context({
        config: {
          ...baseContext.config,
          mailIdentities: {
            trueResumeMail: {
              environment: 'dev',
              domain: 'mail.dev.true-resume.test',
              mailFromDomain: 'bounce.dev.true-resume.test',
              configurationSet: 'unisane-dev-true-resume-mail',
              eventDestinations: [
                {
                  name: 'feedback',
                  type: 'sns',
                  topicArn: 'arn:aws:sns:us-east-1:123456789012:ses-events',
                  matchingEventTypes: ['BOUNCE', 'COMPLAINT'],
                  enabled: true,
                },
              ],
            },
          },
        },
      }),
      inventory: inventoryReport({
        mail: mailInventory({
          configurationSetEventDestinations: [],
        }),
      }),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.operations).toContainEqual(
      expect.objectContaining({
        action: 'create',
        resourceType: 'mail-identity',
        resourceKey: 'trueResumeMail:feedback',
        check: 'mail.configuration-set.event-destination.exists',
        desired: expect.objectContaining({
          configurationSet: 'unisane-dev-true-resume-mail',
          name: 'feedback',
          type: 'sns',
          topicArn: 'arn:aws:sns:us-east-1:123456789012:ses-events',
          matchingEventTypes: ['BOUNCE', 'COMPLAINT'],
        }),
      }),
    );
  });

  it('plans SES SNS subscription drift from desired state', () => {
    const baseContext = context();
    const plan = createAwsDomainsPlan({
      context: context({
        config: {
          ...baseContext.config,
          mailIdentities: {
            trueResumeMail: {
              environment: 'dev',
              domain: 'mail.dev.true-resume.test',
              mailFromDomain: 'bounce.dev.true-resume.test',
              configurationSet: 'unisane-dev-true-resume-mail',
              eventDestinations: [
                {
                  name: 'events',
                  type: 'sns',
                  topicArn: 'arn:aws:sns:us-east-1:123456789012:ses-events',
                  matchingEventTypes: ['BOUNCE', 'COMPLAINT'],
                  enabled: true,
                  subscriptions: [
                    {
                      protocol: 'https',
                      endpoint: 'https://dev.true-resume.test/api/rest/v1/webhooks/in/ses',
                    },
                  ],
                },
              ],
            },
          },
        },
      }),
      inventory: inventoryReport({
        mail: mailInventory({
          configurationSetEventDestinations: [
            {
              name: 'events',
              enabled: true,
              matchingEventTypes: ['BOUNCE', 'COMPLAINT'],
              destinationTypes: ['sns'],
              snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:ses-events',
              snsSubscriptions: [],
            },
          ],
        }),
      }),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.operations).toContainEqual(
      expect.objectContaining({
        action: 'create',
        resourceType: 'mail-identity',
        resourceKey:
          'trueResumeMail:events:https:https://dev.true-resume.test/api/rest/v1/webhooks/in/ses',
        check: 'mail.configuration-set.event-destination.subscription.exists',
        desired: expect.objectContaining({
          configurationSet: 'unisane-dev-true-resume-mail',
          eventDestinationName: 'events',
          protocol: 'https',
          endpoint: 'https://dev.true-resume.test/api/rest/v1/webhooks/in/ses',
          topicArn: 'arn:aws:sns:us-east-1:123456789012:ses-events',
        }),
      }),
    );
  });

  it('plans pending SES SNS subscription confirmation as staged status', () => {
    const baseContext = context();
    const plan = createAwsDomainsPlan({
      context: context({
        config: {
          ...baseContext.config,
          mailIdentities: {
            trueResumeMail: {
              environment: 'dev',
              domain: 'mail.dev.true-resume.test',
              mailFromDomain: 'bounce.dev.true-resume.test',
              configurationSet: 'unisane-dev-true-resume-mail',
              eventDestinations: [
                {
                  name: 'events',
                  type: 'sns',
                  topicArn: 'arn:aws:sns:us-east-1:123456789012:ses-events',
                  matchingEventTypes: ['BOUNCE', 'COMPLAINT'],
                  subscriptions: [
                    {
                      protocol: 'https',
                      endpoint: 'https://dev.true-resume.test/api/rest/v1/webhooks/in/ses',
                    },
                  ],
                },
              ],
            },
          },
        },
      }),
      inventory: inventoryReport({
        mail: mailInventory({
          configurationSetEventDestinations: [
            {
              name: 'events',
              enabled: true,
              matchingEventTypes: ['BOUNCE', 'COMPLAINT'],
              destinationTypes: ['sns'],
              snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:ses-events',
              snsSubscriptions: [
                {
                  protocol: 'https',
                  endpoint: 'https://dev.true-resume.test/api/rest/v1/webhooks/in/ses',
                  subscriptionArn: 'PendingConfirmation',
                  pendingConfirmation: true,
                },
              ],
            },
          ],
        }),
      }),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.operations).toContainEqual(
      expect.objectContaining({
        action: 'update',
        check: 'mail.configuration-set.event-destination.subscription.confirmed',
      }),
    );
  });

  it('plans certificate validation and SAN drift', () => {
    const plan = createAwsDomainsPlan({
      context: context(),
      inventory: inventoryReport({
        certificate: certificateInventory({
          status: 'PENDING_VALIDATION',
          subjectAlternativeNames: [],
          validationRecords: [
            {
              name: '_token.assets.dev.true-resume.test.',
              type: 'CNAME',
              value: '_value.acm-validations.aws.',
              status: 'PENDING_VALIDATION',
            },
          ],
        }),
      }),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.summary.update).toBe(3);
    expect(plan.operations.map((operation) => operation.check)).toEqual(
      expect.arrayContaining([
        'certificate.validation',
        'certificate.subject-alternative-names',
        'dns.record.acm-validation.upsert',
      ]),
    );
  });

  it('plans Route 53 records for SES DKIM and MAIL FROM drift', () => {
    const plan = createAwsDomainsPlan({
      context: context(),
      inventory: inventoryReport({
        mail: mailInventory({
          dkimStatus: 'PENDING',
          dkimTokens: ['token1', 'token2'],
          dkimSigningHostedZone: 'dkim.amazonses.com',
          mailFromStatus: 'PENDING',
        }),
        dnsZone: dnsZoneInventory({ records: [] }),
      }),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.summary.update).toBe(5);
    expect(plan.operations.map((operation) => operation.check)).toEqual(
      expect.arrayContaining([
        'mail.identity.dkim',
        'dns.record.ses-dkim.upsert',
        'dns.record.ses-mail-from-mx.upsert',
        'dns.record.ses-mail-from-spf.upsert',
      ]),
    );
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resourceType: 'dns-record',
          desired: expect.objectContaining({
            name: 'token1._domainkey.mail.dev.true-resume.test',
            type: 'CNAME',
            values: ['token1.dkim.amazonses.com'],
          }),
        }),
      ]),
    );
  });

  it('plans BIMI TXT records when sender-brand desired state is configured', () => {
    const baseContext = context();
    const plan = createAwsDomainsPlan({
      context: context({
        config: {
          ...baseContext.config,
          mailIdentities: {
            trueResumeMail: {
              environment: 'dev',
              domain: 'mail.dev.true-resume.test',
              mailFromDomain: 'bounce.dev.true-resume.test',
              configurationSet: 'unisane-dev-true-resume-mail',
              bimi: {
                selector: 'default',
                logoUrl: 'https://assets.dev.true-resume.test/bimi/logo.svg',
                certificateUrl: 'https://assets.dev.true-resume.test/bimi/cert.pem',
                hostedZone: 'trueResumeDev',
              },
            },
          },
        },
      }),
      inventory: inventoryReport({
        dnsZone: dnsZoneInventory({
          records: [
            {
              name: '_dmarc.mail.dev.true-resume.test.',
              type: 'TXT',
              values: ['"v=DMARC1; p=reject; pct=100"'],
              ttl: 300,
            },
          ],
        }),
      }),
      generatedAt: '2026-05-28T00:00:00.000Z',
    });

    expect(plan.ok).toBe(true);
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'update',
          resourceType: 'dns-record',
          check: 'dns.record.bimi.upsert',
          desired: expect.objectContaining({
            hostedZoneKey: 'trueResumeDev',
            purpose: 'bimi',
            name: 'default._bimi.mail.dev.true-resume.test',
            type: 'TXT',
            values: [
              '"v=BIMI1; l=https://assets.dev.true-resume.test/bimi/logo.svg; a=https://assets.dev.true-resume.test/bimi/cert.pem"',
            ],
          }),
        }),
      ]),
    );
  });

  it('blocks BIMI readiness when DMARC is not enforced', () => {
    const baseContext = context();
    const plan = createAwsDomainsPlan({
      context: context({
        config: {
          ...baseContext.config,
          mailIdentities: {
            trueResumeMail: {
              environment: 'dev',
              domain: 'mail.dev.true-resume.test',
              mailFromDomain: 'bounce.dev.true-resume.test',
              configurationSet: 'unisane-dev-true-resume-mail',
              bimi: {
                logoUrl: 'https://assets.dev.true-resume.test/bimi/logo.svg',
                hostedZone: 'trueResumeDev',
              },
            },
          },
        },
      }),
      inventory: inventoryReport(),
      generatedAt: '2026-05-28T00:00:00.000Z',
    });

    expect(plan.ok).toBe(false);
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'blocked',
          resourceType: 'dns-record',
          check: 'dns.record.dmarc-enforcement.required',
        }),
        expect.objectContaining({
          action: 'update',
          resourceType: 'dns-record',
          check: 'dns.record.bimi.upsert',
        }),
      ]),
    );
  });

  it('blocks production SES readiness when account, DMARC, or event capture is incomplete', () => {
    const plan = createAwsDomainsPlan({
      context: context({
        account: {
          ...context().account,
          production: true,
        },
      }),
      inventory: inventoryReport({
        sesAccount: sesAccountInventory({
          productionAccessEnabled: false,
          sendingEnabled: false,
          enforcementStatus: 'PROBATION',
        }),
        mail: mailInventory({
          configurationSetEventDestinations: [
            {
              name: 'delivery-only',
              enabled: true,
              matchingEventTypes: ['DELIVERY'],
              destinationTypes: ['sns'],
              snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:ses-events',
              snsSubscriptions: [],
            },
          ],
        }),
        dnsZone: dnsZoneInventory({
          records: [
            {
              name: 'bounce.dev.true-resume.test.',
              type: 'MX',
              values: ['10 feedback-smtp.us-east-1.amazonses.com'],
              ttl: 300,
            },
            {
              name: 'bounce.dev.true-resume.test.',
              type: 'TXT',
              values: ['"v=spf1 include:amazonses.com ~all"'],
              ttl: 300,
            },
          ],
        }),
      }),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.ok).toBe(false);
    expect(plan.operations.map((operation) => operation.check)).toEqual(
      expect.arrayContaining([
        'mail.account.production-access',
        'mail.account.sending-enabled',
        'mail.account.reputation',
        'dns.record.dmarc.required',
        'mail.configuration-set.event-destinations',
      ]),
    );
  });

  it('plans Route 53 A and AAAA alias records for CloudFront aliases', () => {
    const plan = createAwsDomainsPlan({
      context: context(),
      inventory: inventoryReport({
        dnsZone: dnsZoneInventory({ records: [] }),
        cloudFrontAliases: [cloudFrontAliasInventory()],
      }),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(
      plan.operations.filter(
        (operation) => operation.check === 'dns.record.cloudfront-alias.upsert',
      ),
    ).toHaveLength(2);
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resourceType: 'dns-record',
          check: 'dns.record.cloudfront-alias.upsert',
          desired: expect.objectContaining({
            name: 'assets.dev.true-resume.test',
            type: 'A',
            aliasTarget: {
              dnsName: 'd111111abcdef8.cloudfront.net',
              hostedZoneId: 'Z2FDTNDATAQYW2',
              evaluateTargetHealth: false,
            },
          }),
        }),
        expect.objectContaining({
          resourceType: 'dns-record',
          check: 'dns.record.cloudfront-alias.upsert',
          desired: expect.objectContaining({
            name: 'assets.dev.true-resume.test',
            type: 'AAAA',
          }),
        }),
      ]),
    );
  });

  it('does not plan CloudFront alias records when Route 53 aliases already match', () => {
    const plan = createAwsDomainsPlan({
      context: context(),
      inventory: inventoryReport({
        dnsZone: dnsZoneInventory({
          records: [
            {
              name: 'assets.dev.true-resume.test.',
              type: 'A',
              values: [],
              ttl: null,
              aliasTarget: {
                dnsName: 'd111111abcdef8.cloudfront.net.',
                hostedZoneId: 'Z2FDTNDATAQYW2',
                evaluateTargetHealth: false,
              },
            },
            {
              name: 'assets.dev.true-resume.test.',
              type: 'AAAA',
              values: [],
              ttl: null,
              aliasTarget: {
                dnsName: 'd111111abcdef8.cloudfront.net.',
                hostedZoneId: 'Z2FDTNDATAQYW2',
                evaluateTargetHealth: false,
              },
            },
          ],
        }),
        cloudFrontAliases: [cloudFrontAliasInventory()],
      }),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(
      plan.operations.some((operation) => operation.check === 'dns.record.cloudfront-alias.upsert'),
    ).toBe(false);
  });

  it('blocks CloudFront alias records until the distribution domain exists', () => {
    const plan = createAwsDomainsPlan({
      context: context(),
      inventory: inventoryReport({
        cloudFrontAliases: [cloudFrontAliasInventory({ distributionId: null, domainName: null })],
      }),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.ok).toBe(false);
    expect(plan.summary.blocked).toBe(1);
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'blocked',
          check: 'dns.record.cloudfront-alias.distribution-unavailable',
        }),
      ]),
    );
  });

  it('emits manual DNS records for external DNS zones', () => {
    const ctx = context({
      config: {
        ...context().config,
        dnsZones: {
          trueResumeDev: {
            environment: 'dev',
            name: 'dev.true-resume.test',
            provider: 'external',
            privateZone: false,
          },
        },
      },
    });
    const plan = createAwsDomainsPlan({
      context: ctx,
      inventory: inventoryReport({
        mail: mailInventory({
          dkimStatus: 'PENDING',
          dkimTokens: ['token1'],
          dkimSigningHostedZone: 'dkim.amazonses.com',
        }),
        dnsZone: dnsZoneInventory({
          exists: false,
          hostedZoneId: null,
          provider: 'external',
          records: [],
        }),
        cloudFrontAliases: [cloudFrontAliasInventory()],
      }),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.ok).toBe(true);
    expect(plan.summary.manual).toBeGreaterThanOrEqual(3);
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'no-op',
          check: 'dns.zone.external-provider',
        }),
        expect.objectContaining({
          action: 'manual',
          check: 'dns.record.ses-dkim.manual',
          desired: expect.objectContaining({
            provider: 'external',
            name: 'token1._domainkey.mail.dev.true-resume.test',
            type: 'CNAME',
            values: ['token1.dkim.amazonses.com'],
          }),
        }),
        expect.objectContaining({
          action: 'manual',
          check: 'dns.record.cloudfront-alias.manual',
          desired: expect.objectContaining({
            provider: 'external',
            name: 'assets.dev.true-resume.test',
            type: 'A',
            aliasTarget: {
              dnsName: 'd111111abcdef8.cloudfront.net',
              hostedZoneId: 'Z2FDTNDATAQYW2',
              evaluateTargetHealth: false,
            },
          }),
        }),
      ]),
    );
  });

  it('emits manual BIMI DNS records for external DNS zones', () => {
    const baseContext = context();
    const ctx = context({
      config: {
        ...baseContext.config,
        mailIdentities: {
          trueResumeMail: {
            environment: 'dev',
            domain: 'mail.dev.true-resume.test',
            mailFromDomain: 'bounce.dev.true-resume.test',
            configurationSet: 'unisane-dev-true-resume-mail',
            bimi: {
              logoUrl: 'https://assets.dev.true-resume.test/bimi/logo.svg',
              certificateUrl: 'https://assets.dev.true-resume.test/bimi/cert.pem',
              hostedZone: 'trueResumeDev',
            },
          },
        },
        dnsZones: {
          trueResumeDev: {
            environment: 'dev',
            name: 'dev.true-resume.test',
            provider: 'external',
            privateZone: false,
          },
        },
      },
    });
    const plan = createAwsDomainsPlan({
      context: ctx,
      inventory: inventoryReport({
        dnsZone: dnsZoneInventory({
          exists: false,
          hostedZoneId: null,
          provider: 'external',
          records: [],
        }),
      }),
      generatedAt: '2026-05-28T00:00:00.000Z',
    });

    expect(plan.ok).toBe(true);
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'manual',
          check: 'dns.record.dmarc-enforcement.manual',
        }),
        expect.objectContaining({
          action: 'manual',
          check: 'dns.record.bimi.manual',
          desired: expect.objectContaining({
            provider: 'external',
            name: 'default._bimi.mail.dev.true-resume.test',
            type: 'TXT',
            values: [
              '"v=BIMI1; l=https://assets.dev.true-resume.test/bimi/logo.svg; a=https://assets.dev.true-resume.test/bimi/cert.pem"',
            ],
          }),
        }),
      ]),
    );
  });

  it('audits BIMI sender-brand desired state for production mail identities', () => {
    const report = createAwsAuditReport({
      context: context({
        account: {
          ...context().account,
          production: true,
        },
      }),
      generatedAt: '2026-05-28T00:00:00.000Z',
    });

    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'ses.bimi',
        status: 'warn',
        scope: 'mailIdentity:trueResumeMail',
      }),
    );
  });

  it('plans no-op when domain and mail state matches desired checks', () => {
    const plan = createAwsDomainsPlan({
      context: context(),
      inventory: inventoryReport(),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(plan.ok).toBe(true);
    expect(plan.summary['no-op']).toBe(3);
  });

  it('writes a domains plan artifact with an injected inventory reader', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const inventoryReader: AwsDomainsInventoryReader = {
      read: async () => ({
        sesAccount: sesAccountInventory(),
        mailIdentities: [mailInventory()],
        certificates: [certificateInventory()],
        dnsZones: [dnsZoneInventory()],
      }),
    };

    const report = await runAwsDomainsPlan(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        output: '.unisane/aws/dev/plans/test-domains-plan.json',
      },
      { identityReader: identityReader(), inventoryReader },
    );

    expect(report.ok).toBe(true);
    expect(report.artifact?.relativePath).toBe('.unisane/aws/dev/plans/test-domains-plan.json');
    expect(existsSync(path.join(cwd, '.unisane/aws/dev/plans/test-domains-plan.json'))).toBe(true);
  });

  it('refuses domains apply without explicit yes', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const plan = createAwsDomainsPlan({
      context: context(),
      inventory: inventoryReport(),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });
    const planPath = writeDomainsPlan(cwd, plan);

    await expect(
      runAwsDomainsApply(
        {
          cwd,
          configPath: 'config/aws.ops.mjs',
          env: 'dev',
          planPath,
          accountConfirm: '123456789012',
        },
        { identityReader: identityReader() },
      ),
    ).rejects.toThrow('AWS_DOMAINS_APPLY_REQUIRES_YES');
  });

  it('refuses unsupported domains apply operations before executor mutation', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const plan: AwsDomainsPlanReport = {
      ok: true,
      environment: 'dev',
      generatedAt: '2026-05-14T00:00:00.000Z',
      configPath: path.join(cwd, 'config/aws.ops.mjs'),
      account: context().account,
      summary: { create: 0, update: 1, manual: 0, blocked: 0, 'no-op': 0 },
      operations: [
        {
          action: 'update',
          resourceType: 'mail-identity',
          resourceKey: 'trueResumeMail',
          check: 'mail.identity.unsupported-posture',
          message: 'Unsupported mail identity posture update.',
          current: 'PENDING',
          desired: 'SUCCESS',
        },
      ],
    };
    const planPath = writeDomainsPlan(cwd, plan);
    const executor: AwsDomainsApplyExecutor = {
      applyOperation: async () => {
        throw new Error('executor should not run');
      },
    };

    await expect(
      runAwsDomainsApply(
        {
          cwd,
          configPath: 'config/aws.ops.mjs',
          env: 'dev',
          planPath,
          accountConfirm: '123456789012',
          yes: true,
        },
        { identityReader: identityReader(), executor },
      ),
    ).rejects.toThrow('AWS_DOMAINS_APPLY_UNSUPPORTED_OPERATION');
  });

  it('allows staged apply when only downstream CloudFront alias DNS is blocked', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const plan: AwsDomainsPlanReport = {
      ok: false,
      environment: 'dev',
      generatedAt: '2026-05-14T00:00:00.000Z',
      configPath: path.join(cwd, 'config/aws.ops.mjs'),
      account: context().account,
      summary: { create: 2, update: 1, manual: 0, blocked: 1, 'no-op': 0 },
      operations: [
        {
          action: 'create',
          resourceType: 'mail-identity',
          resourceKey: 'trueResumeMail',
          check: 'mail.identity.exists',
          message: 'Create SES identity.',
          current: false,
          desired: {
            domain: 'mail.dev.true-resume.test',
          },
        },
        {
          action: 'create',
          resourceType: 'certificate',
          resourceKey: 'trueResumeAssets',
          check: 'certificate.exists',
          message: 'Request certificate.',
          current: false,
          desired: {
            domainName: 'assets.dev.true-resume.test',
          },
        },
        {
          action: 'update',
          resourceType: 'certificate',
          resourceKey: 'trueResumeAssets',
          check: 'certificate.validation',
          message: 'Complete ACM DNS validation.',
          current: 'PENDING_VALIDATION',
          desired: 'ISSUED',
        },
        {
          action: 'blocked',
          resourceType: 'dns-record',
          resourceKey: 'trueResumeAssets:assets.dev.true-resume.test',
          check: 'dns.record.cloudfront-alias.distribution-unavailable',
          message: 'CloudFront distribution is not available yet.',
          current: null,
          desired: {
            cdnKey: 'trueResumeAssets',
            alias: 'assets.dev.true-resume.test',
          },
        },
      ],
    };
    const planPath = writeDomainsPlan(cwd, plan);
    const executed: string[] = [];
    const executor: AwsDomainsApplyExecutor = {
      applyOperation: async ({ operation }) => {
        executed.push(operation.check);
        return {
          operation,
          status: operation.action === 'blocked' ? 'skipped' : 'succeeded',
          message: 'mock applied',
        };
      },
    };

    const report = await runAwsDomainsApply(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        planPath,
        accountConfirm: '123456789012',
        yes: true,
      },
      { identityReader: identityReader(), executor },
    );

    expect(report.ok).toBe(true);
    expect(executed).toEqual([
      'mail.identity.exists',
      'certificate.exists',
      'certificate.validation',
      'dns.record.cloudfront-alias.distribution-unavailable',
    ]);
    expect(report.receipt.results.at(-1)).toEqual(
      expect.objectContaining({
        status: 'skipped',
      }),
    );
  });

  it('still refuses blocked domains apply operations that are not staged CloudFront aliases', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const plan: AwsDomainsPlanReport = {
      ok: false,
      environment: 'dev',
      generatedAt: '2026-05-14T00:00:00.000Z',
      configPath: path.join(cwd, 'config/aws.ops.mjs'),
      account: context().account,
      summary: { create: 0, update: 0, manual: 0, blocked: 1, 'no-op': 0 },
      operations: [
        {
          action: 'blocked',
          resourceType: 'dns-record',
          resourceKey: 'mail.dev.true-resume.test',
          check: 'dns.record.ses-dkim.zone-unavailable',
          message: 'Hosted zone is unavailable.',
          current: null,
          desired: null,
        },
      ],
    };
    const planPath = writeDomainsPlan(cwd, plan);

    await expect(
      runAwsDomainsApply(
        {
          cwd,
          configPath: 'config/aws.ops.mjs',
          env: 'dev',
          planPath,
          accountConfirm: '123456789012',
          yes: true,
        },
        { identityReader: identityReader() },
      ),
    ).rejects.toThrow('AWS_DOMAINS_APPLY_BLOCKED_PLAN');
  });

  it('skips manual external DNS operations without AWS mutation', async () => {
    const operation = {
      action: 'manual' as const,
      resourceType: 'dns-record' as const,
      resourceKey: 'trueResumeDev:manual.dev.true-resume.test:CNAME',
      check: 'dns.record.acm-validation.manual',
      message: 'Create manual ACM validation record.',
      current: null,
      desired: {
        hostedZoneKey: 'trueResumeDev',
        provider: 'external',
        zoneName: 'dev.true-resume.test',
        purpose: 'acm-validation',
        name: 'manual.dev.true-resume.test',
        type: 'CNAME',
        values: ['manual.acm-validations.aws'],
        ttl: 300,
      },
    };

    const result = await new SdkAwsDomainsApplyExecutor().applyOperation({
      context: context(),
      operation,
    });

    expect(result).toEqual({
      operation,
      status: 'skipped',
      message: 'Manual external DNS action; no AWS mutation executed.',
    });
  });

  it('writes a domains apply receipt for reviewed safe operations', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const plan: AwsDomainsPlanReport = {
      ok: true,
      environment: 'dev',
      generatedAt: '2026-05-14T00:00:00.000Z',
      configPath: path.join(cwd, 'config/aws.ops.mjs'),
      account: context().account,
      summary: { create: 3, update: 4, manual: 1, blocked: 0, 'no-op': 0 },
      operations: [
        {
          action: 'create',
          resourceType: 'mail-identity',
          resourceKey: 'trueResumeMail',
          check: 'mail.configuration-set.exists',
          message: 'Create configuration set.',
          current: false,
          desired: 'unisane-dev-true-resume-mail',
        },
        {
          action: 'create',
          resourceType: 'mail-identity',
          resourceKey: 'trueResumeMail:feedback',
          check: 'mail.configuration-set.event-destination.exists',
          message: 'Create SES event destination.',
          current: null,
          desired: {
            configurationSet: 'unisane-dev-true-resume-mail',
            name: 'feedback',
            type: 'sns',
            enabled: true,
            matchingEventTypes: ['BOUNCE', 'COMPLAINT'],
            topicArn: 'arn:aws:sns:us-east-1:123456789012:ses-events',
          },
        },
        {
          action: 'update',
          resourceType: 'mail-identity',
          resourceKey: 'trueResumeMail',
          check: 'mail.identity.mail-from-domain',
          message: 'Configure MAIL FROM.',
          current: null,
          desired: {
            domain: 'bounce.dev.true-resume.test',
            status: 'SUCCESS',
          },
        },
        {
          action: 'update',
          resourceType: 'dns-record',
          resourceKey: 'trueResumeDev:token._domainkey.mail.dev.true-resume.test:CNAME',
          check: 'dns.record.ses-dkim.upsert',
          message: 'Upsert DKIM record.',
          current: null,
          desired: {
            hostedZoneKey: 'trueResumeDev',
            hostedZoneId: 'Z1234567890',
            purpose: 'ses-dkim',
            name: 'token._domainkey.mail.dev.true-resume.test',
            type: 'CNAME',
            values: ['token.dkim.amazonses.com'],
            ttl: 300,
          },
        },
        {
          action: 'update',
          resourceType: 'dns-record',
          resourceKey: 'trueResumeDev:default._bimi.mail.dev.true-resume.test:TXT',
          check: 'dns.record.bimi.upsert',
          message: 'Upsert BIMI record.',
          current: null,
          desired: {
            hostedZoneKey: 'trueResumeDev',
            hostedZoneId: 'Z1234567890',
            purpose: 'bimi',
            name: 'default._bimi.mail.dev.true-resume.test',
            type: 'TXT',
            values: ['"v=BIMI1; l=https://assets.dev.true-resume.test/bimi/logo.svg"'],
            ttl: 300,
          },
        },
        {
          action: 'create',
          resourceType: 'certificate',
          resourceKey: 'trueResumeAssets',
          check: 'certificate.exists',
          message: 'Request certificate.',
          current: false,
          desired: {
            domainName: 'assets.dev.true-resume.test',
            subjectAlternativeNames: ['cdn.dev.true-resume.test'],
            validationMethod: 'DNS',
            hostedZone: 'trueResumeDev',
            usage: 'cloudfront',
            region: null,
          },
        },
        {
          action: 'update',
          resourceType: 'dns-record',
          resourceKey: 'trueResumeDev:assets.dev.true-resume.test:A',
          check: 'dns.record.cloudfront-alias.upsert',
          message: 'Upsert CloudFront alias record.',
          current: null,
          desired: {
            hostedZoneKey: 'trueResumeDev',
            hostedZoneId: 'Z1234567890',
            purpose: 'cloudfront-alias',
            name: 'assets.dev.true-resume.test',
            type: 'A',
            ttl: null,
            aliasTarget: {
              dnsName: 'd111111abcdef8.cloudfront.net',
              hostedZoneId: 'Z2FDTNDATAQYW2',
              evaluateTargetHealth: false,
            },
          },
        },
        {
          action: 'manual',
          resourceType: 'dns-record',
          resourceKey: 'trueResumeDev:manual.dev.true-resume.test:CNAME',
          check: 'dns.record.acm-validation.manual',
          message: 'Create manual ACM validation record.',
          current: null,
          desired: {
            hostedZoneKey: 'trueResumeDev',
            provider: 'external',
            zoneName: 'dev.true-resume.test',
            purpose: 'acm-validation',
            name: 'manual.dev.true-resume.test',
            type: 'CNAME',
            values: ['manual.acm-validations.aws'],
            ttl: 300,
          },
        },
      ],
    };
    const planPath = writeDomainsPlan(cwd, plan);
    const executed: string[] = [];
    const executor: AwsDomainsApplyExecutor = {
      applyOperation: async ({ operation }) => {
        executed.push(operation.check);
        return { operation, status: 'succeeded', message: 'mock applied' };
      },
    };

    const report = await runAwsDomainsApply(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        planPath,
        accountConfirm: '123456789012',
        receiptOutput: '.unisane/aws/dev/receipts/test-domains-apply-receipt.json',
        yes: true,
      },
      {
        identityReader: identityReader(),
        executor,
        now: () => new Date('2026-05-14T02:00:00.000Z'),
      },
    );

    expect(report.ok).toBe(true);
    expect(executed).toEqual([
      'mail.configuration-set.exists',
      'mail.configuration-set.event-destination.exists',
      'mail.identity.mail-from-domain',
      'dns.record.ses-dkim.upsert',
      'dns.record.bimi.upsert',
      'certificate.exists',
      'dns.record.cloudfront-alias.upsert',
      'dns.record.acm-validation.manual',
    ]);
    expect(report.receipt.results.at(-1)).toEqual(
      expect.objectContaining({
        status: 'succeeded',
        message: 'mock applied',
      }),
    );
    expect(report.receipt.kind).toBe('unisane.aws.domains-apply-receipt');
    expect(report.artifact.relativePath).toBe(
      '.unisane/aws/dev/receipts/test-domains-apply-receipt.json',
    );
    expect(existsSync(path.join(cwd, report.artifact.relativePath))).toBe(true);
    expect(existsSync(path.join(cwd, '.unisane/aws/dev/locks/domains-apply.lock.json'))).toBe(
      false,
    );
  });

  it('refuses domains apply while the environment lock exists', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const lockPath = path.join(cwd, '.unisane/aws/dev/locks/domains-apply.lock.json');
    mkdirSync(path.dirname(lockPath), { recursive: true });
    writeFileSync(lockPath, '{}\n', 'utf8');
    const plan = createAwsDomainsPlan({
      context: context(),
      inventory: inventoryReport(),
      generatedAt: '2026-05-14T00:00:00.000Z',
    });
    const planPath = writeDomainsPlan(cwd, plan);

    await expect(
      runAwsDomainsApply(
        {
          cwd,
          configPath: 'config/aws.ops.mjs',
          env: 'dev',
          planPath,
          accountConfirm: '123456789012',
          yes: true,
        },
        { identityReader: identityReader() },
      ),
    ).rejects.toThrow('AWS_APPLY_LOCKED');
  });

  it('deletes an unused certificate only after explicit non-production confirmation', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const certificateArn = 'arn:aws:acm:us-east-1:123456789012:certificate/cert-id';
    const deleted: string[] = [];
    const executor: AwsDomainsCertificateDeleteExecutor = {
      describeCertificate: async () => ({
        certificateArn,
        domainName: 'assets.dev.true-resume.test',
        status: 'PENDING_VALIDATION',
        inUseBy: [],
        region: 'us-east-1',
      }),
      deleteCertificate: async ({ certificateArn: arn }) => {
        deleted.push(arn);
      },
    };

    const report = await runAwsDomainsCertificateDelete(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        certificateArn,
        accountConfirm: '123456789012',
        domainName: 'assets.dev.true-resume.test',
        receiptOutput: '.unisane/aws/dev/receipts/test-certificate-delete-receipt.json',
        yes: true,
      },
      {
        identityReader: identityReader(),
        executor,
        now: () => new Date('2026-05-14T03:00:00.000Z'),
      },
    );

    expect(report.ok).toBe(true);
    expect(deleted).toEqual([certificateArn]);
    expect(report.receipt.kind).toBe('unisane.aws.domains-certificate-delete-receipt');
    expect(report.receipt.domainName).toBe('assets.dev.true-resume.test');
    expect(report.artifact.relativePath).toBe(
      '.unisane/aws/dev/receipts/test-certificate-delete-receipt.json',
    );
    expect(existsSync(path.join(cwd, report.artifact.relativePath))).toBe(true);
  });

  it('refuses certificate deletion for production environments', async () => {
    const cwd = createTempProject(configSource().replace('production: false', 'production: true'));
    tempProjects.push(cwd);

    await expect(
      runAwsDomainsCertificateDelete(
        {
          cwd,
          configPath: 'config/aws.ops.mjs',
          env: 'dev',
          certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/cert-id',
          accountConfirm: '123456789012',
          yes: true,
        },
        { identityReader: identityReader() },
      ),
    ).rejects.toThrow('AWS_DOMAINS_CERTIFICATE_DELETE_PRODUCTION_FORBIDDEN');
  });

  it('does not delete certificates that are still attached', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const certificateArn = 'arn:aws:acm:us-east-1:123456789012:certificate/cert-id';
    const executor: AwsDomainsCertificateDeleteExecutor = {
      describeCertificate: async () => ({
        certificateArn,
        domainName: 'assets.dev.true-resume.test',
        status: 'ISSUED',
        inUseBy: ['arn:aws:cloudfront::123456789012:distribution/E1234567890'],
        region: 'us-east-1',
      }),
      deleteCertificate: async () => {
        throw new Error('executor should not delete an attached certificate');
      },
    };

    const report = await runAwsDomainsCertificateDelete(
      {
        cwd,
        configPath: 'config/aws.ops.mjs',
        env: 'dev',
        certificateArn,
        accountConfirm: '123456789012',
        yes: true,
      },
      { identityReader: identityReader(), executor },
    );

    expect(report.ok).toBe(false);
    expect(report.receipt.message).toContain('AWS_DOMAINS_CERTIFICATE_DELETE_IN_USE');
  });
});
