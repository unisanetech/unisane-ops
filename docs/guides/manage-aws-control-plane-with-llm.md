---
id: 'DOC-d09a105ba31a'
owner: 'unisane'
scope: workspace
role: guide
lifecycle: durable
authority: supporting
provenance: accepted
view: current
---

# Manage AWS Control Plane With LLM

Use this guide when changing or operating Unisane-managed AWS resources through
`@unisane/provider-aws`. The canonical command surface is
`unisane provider aws ...`.

## Changelog

- `2026-07-27`: Removed the unreleased Devtools AWS facade and root alias;
  `unisane provider aws ...` is now the only command route.
- `2026-07-25`: P116-W10 moved all proven AWS behavior, AWS SDK dependencies, and
  provider tests to `@unisane/provider-aws` and published shared types at
  `@unisane/cloud/aws-contracts`.
- `2026-07-24`: Added extraction authority: documented `unisane provider aws` remains the implemented workflow while target AWS ownership moves to Unisane Ops.
- `2026-05-28`: Added SES BIMI sender-brand desired-state guidance, publishable brand asset generation, and clarified that BIMI requires enforced DMARC plus DNS/asset proof outside runtime mail delivery.
- `2026-05-23`: Added the reusable new-platform production setup sequence so future platform launches do not rediscover AWS ordering.
- `2026-05-23`: Added SES configuration-set SNS event destination and subscription desired-state guidance for bounce/complaint capture.
- `2026-05-23`: Clarified staged domains apply behavior for SES/ACM resources that need external DNS validation before final readiness.
- `2026-05-23`: Added environment-scoped app env output guidance and True Resume production asset/mail desired-state guidance.
- `2026-05-23`: Added the non-production-only ACM certificate delete lane for local development cleanup.
- `2026-05-14`: Added CloudFront access-log production guidance after the devtools lane gained desired-state inventory, plan, and guarded apply support for distribution logging.
- `2026-05-14`: Added the AWS control-plane operating workflow after the devtools lane gained audit, IAM policy output, S3/CloudFront/domain planning, guarded apply, receipts, and app env output.

## Command Authority

`unisane provider aws ...` resolves the sealed `@unisane/provider-aws` pack. Devtools
does not own or register AWS config, credentials, inventory, planning, apply, audit,
reports, SDK code, or command composition.

## Rule

AWS resources are managed through desired state plus provider-owned commands. Do not
create buckets, CloudFront distributions, SES identities, certificates, DNS records, or
production env values from deployable app startup code.

## Desired State

Use `config/aws.ops.ts` or `config/aws.ops.mjs` for secret-free desired state:

```txt
accounts
environments
buckets
cdn
mailIdentities
certificates
dnsZones
apps
```

Do not put AWS secrets in config. Local operators should use AWS SSO profiles or assumed-role credentials.

Apps that need different resources per environment should keep one app key with an `environments` map. Do not create parallel app identities just to switch storage, CDN, or mail resources between dev and production:

```txt
apps.<app-id>.environments.dev.storageBucket
apps.<app-id>.environments.prod.storageBucket
apps.<app-id>.environments.prod.objectDeliveryPublicBaseUrlFromCdn
apps.<app-id>.environments.prod.mailIdentity
```

Mail identities that use SES in production should model the configuration-set event destination that captures bounces and complaints:

```txt
mailIdentities.<identity>.configurationSet
mailIdentities.<identity>.eventDestinations[].type = sns
mailIdentities.<identity>.eventDestinations[].topicArn
mailIdentities.<identity>.eventDestinations[].matchingEventTypes = BOUNCE, COMPLAINT
mailIdentities.<identity>.eventDestinations[].subscriptions[].protocol = https
mailIdentities.<identity>.eventDestinations[].subscriptions[].endpoint = https://<app-domain>/api/rest/v1/webhooks/in/ses
```

Mail identities that should show a sender logo in supported recipient inboxes should also model BIMI sender-brand desired state:

```txt
mailIdentities.<identity>.bimi.selector = default
mailIdentities.<identity>.bimi.logoUrl = https://assets.<domain>/bimi/<brand-logo-version>.svg
mailIdentities.<identity>.bimi.certificateUrl = https://assets.<domain>/bimi/<brand-cert-version>.pem
mailIdentities.<identity>.bimi.hostedZone = <dns-zone-key>
```

BIMI is not part of runtime SES delivery. It requires enforced DMARC on the sending domain, published SVG/PEM assets, a BIMI TXT record, and mailbox-provider support. For platform-owned brand marks, `unisane-devtools brand generate` can write the BIMI SVG plus `public/brand/publish-manifest.json`; publish the manifest's `objectKey` entries to the configured asset CDN prefix before treating BIMI as ready.

## New Platform Setup

For a new platform, wire production AWS in this order:

1. Add environment-scoped app desired state:
   - development storage/CDN/mail references
   - production storage/CDN/mail references
   - one app key with `apps.<app-id>.environments`
2. Add production buckets:
   - private storage bucket
   - CloudFront log bucket with `objectOwnership: bucket-owner-preferred`
   - classified prefixes for public assets, private uploads, generated private artifacts, and logs
3. Add production CDN desired state:
   - origin bucket
   - CloudFront OAC access
   - access logs
   - public asset prefixes
   - alias and ACM certificate reference only when the production asset domain is known
4. Add production DNS/certificate desired state:
   - external or Route 53 zone
   - CloudFront certificate in `us-east-1`
   - DNS validation records from domains plan
5. Add production SES desired state:
   - domain identity
   - MAIL FROM domain
   - configuration set
   - SNS event destination for `BOUNCE` and `COMPLAINT`
   - HTTPS SNS subscription endpoint for the app inbound SES webhook
   - BIMI sender-brand refs when the platform needs supported-inbox sender logos
6. Apply in dependency order:
   - `aws s3 plan/apply`
   - `aws domains plan/apply` for SES identity, config set, MAIL FROM, and certificate request
   - publish external DNS records
   - re-run `aws domains plan` until SES and ACM verification status clears or only expected staged items remain
   - deploy the app/domain with emitted env values, including `SES_SNS_TOPIC_ARN`
   - re-run `aws domains plan/apply` to create/confirm the SNS HTTPS subscription
   - run `aws cloudfront plan/apply`
   - publish final CloudFront alias DNS records
   - re-run plans until remaining operations are expected manual external DNS reminders or no-ops

Do not create production AWS resources from app startup, and do not keep app-specific AWS setup in hidden local notes. Durable desired state belongs in `config/aws.ops.*`; durable workflow rules belong in this guide; platform-specific launch gates belong in the platform docs pack.

## Readiness Loop

Run non-mutating commands first:

```txt
pnpm --filter unisane exec unisane provider aws doctor --env dev
pnpm --filter unisane exec unisane provider aws audit --env dev --json
pnpm --filter unisane exec unisane provider aws iam policy --env dev --output .unisane/aws/dev/iam/policy.json
```

`aws audit` is the CI-friendly readiness gate. It verifies account posture, S3 production prefix classification, private-bucket posture, CloudFront OAC and access-log configuration, SES production config expectations, SES BIMI sender-brand desired state, ACM CloudFront region rules, and DNS-zone references without mutating AWS.

## Plan Before Apply

Generate inventories and plans before mutation:

```txt
pnpm --filter unisane exec unisane provider aws s3 inventory --env dev
pnpm --filter unisane exec unisane provider aws s3 plan --env dev
pnpm --filter unisane exec unisane provider aws cloudfront inventory --env dev
pnpm --filter unisane exec unisane provider aws cloudfront plan --env dev
pnpm --filter unisane exec unisane provider aws domains inventory --env dev
pnpm --filter unisane exec unisane provider aws domains plan --env dev
```

Review plan artifacts under `.unisane/aws/<env>/plans/**`. Manual operations are instructions for external DNS providers and are skipped by guarded apply.

`aws domains apply` supports staged execution for DNS-dependent resources: it can create SES identities, SES configuration sets, MAIL FROM settings, SNS feedback subscriptions, ACM certificate requests, and reviewed Route 53 BIMI TXT records while skipping external DNS instructions and validation status checks. Non-staged blockers still remain blockers, especially production readiness issues such as missing bounce/complaint capture or BIMI without enforced DMARC.

HTTPS SNS subscriptions require the target app webhook to be publicly reachable when apply runs. If AWS returns an unreachable endpoint error, deploy the app/domain first, keep the failed receipt for audit, then re-run the domains plan and apply.

## Guarded Apply

Apply only reviewed plans:

```txt
pnpm --filter unisane exec unisane provider aws s3 apply --env dev --plan .unisane/aws/dev/plans/s3-plan.json --account-confirm <account-id> --yes
pnpm --filter unisane exec unisane provider aws cloudfront apply --env dev --plan .unisane/aws/dev/plans/cloudfront-plan.json --account-confirm <account-id> --yes
pnpm --filter unisane exec unisane provider aws domains apply --env dev --plan .unisane/aws/dev/plans/domains-plan.json --account-confirm <account-id> --yes
```

For production, include the exact production confirmation:

```txt
--production-confirm <env>:<account-id>:s3-apply
--production-confirm <env>:<account-id>:cloudfront-apply
--production-confirm <env>:<account-id>:domains-apply
```

Every apply writes a receipt under `.unisane/aws/<env>/receipts/**`.

## Development Cleanup

Use certificate deletion only for local/non-production cleanup of unused ACM certificates that were requested during development and are not attached to any resource:

```txt
pnpm --filter unisane exec unisane provider aws domains delete-certificate --env dev --certificate-arn <arn> --account-confirm <account-id> --yes
```

The command refuses production environments, requires exact account confirmation, checks the ARN account, and blocks deletion when ACM reports `InUseBy` entries. Production certificate cleanup is intentionally not available through this lane.

## App Env Output

After resources exist, generate secret-free app env values:

```txt
pnpm --filter unisane exec unisane provider aws env --env dev --app true-resume
```

The output may include storage bucket, public asset base URL, and SES identity/configuration-set values. It must not emit AWS credentials.

When a mail identity declares an SNS event destination for bounce and complaint events, app env output also emits `SES_SNS_TOPIC_ARN` from that desired state. The app webhook endpoint confirms verified SES SNS subscription confirmation messages; if a plan still reports a pending subscription, deploy the webhook with `SES_SNS_TOPIC_ARN` and re-run the domains plan.

## Production Rules

Production changes must satisfy:

1. exact AWS account confirmation
2. no public S3 buckets
3. classified S3 prefixes for production buckets
4. CloudFront OAC for public assets
5. CloudFront access logs for production public asset distributions
6. CloudFront standard S3 access logs use a bucket-owner-preferred log bucket
7. issued ACM certificate before aliased CloudFront distribution updates
8. DKIM, MAIL FROM, SPF, DMARC, and bounce/complaint readiness before production email volume
9. BIMI sender-brand readiness only after enforced DMARC and published logo/certificate assets
10. durable receipt preservation outside transient local worktrees

For production apps in the same AWS account as development, keep resources separate even when credentials/account are shared:

- separate production bucket
- separate CloudFront log bucket
- separate production CloudFront distribution entry
- production alias and ACM certificate, for example `assets.<domain>`
- production SES identity/configuration set/Mail From domain
- environment-scoped app env output

## Verification

For AWS provider changes, run:

```txt
pnpm --filter @unisane/cloud build
pnpm --filter @unisane/provider-aws check-types
pnpm --filter @unisane/provider-aws test
pnpm --filter @unisane/provider-aws build
pnpm --filter @unisane/devtools exec vitest run src/commands/aws/__tests__
pnpm --filter @unisane/devtools check-types
pnpm ops:architecture:check
pnpm docs:core:check
skopos task verify <task-id> . --actor <id>
pnpm architecture:index:check
pnpm -w typecheck
```
