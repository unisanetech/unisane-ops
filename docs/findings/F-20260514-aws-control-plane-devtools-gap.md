---
id: 'F-cc6a4b74dd7e'
owner: 'unisane'
repository: unisane-ops
scope: workspace
role: finding
lifecycle: active
authority: supporting
provenance: accepted
view: current
severity: SHOULD
status: open
---

# F-20260514 AWS Control Plane Devtools Gap

## Changelog

- `2026-08-15`: Corrected the final owner after the typed-action audit. AWS remains
  implemented by `@unisane/provider-aws`, but its opaque nested CLI, root-only pack
  manifest, parallel `config/aws.ops.*` loader, and remaining Devtools registration are
  not the final contract. Closure now requires typed leaf actions behind the generic Ops
  host, one canonical config authority, and zero Devtools command ownership.
- `2026-07-25`: Closed and archived P116-W10 after all declared ownership, compatibility,
  provider, architecture, workspace type, dependency, dead-code, and LLM evaluation
  proof passed. Later AWS capability expansion must use the provider owner.
- `2026-07-25`: P116-W10 moved the complete proven AWS implementation, its eight AWS
  SDK/credential dependencies, and 72 characterization tests to
  `@unisane/provider-aws`; shared contracts now live at
  `@unisane/cloud/aws-contracts`, and Devtools retains compatibility registration only.
- `2026-07-24`: Rerouted remaining AWS capability work from Framework Devtools to Unisane Ops Cloud plus `@unisane/provider-aws`; the P86 implementation remains current-state evidence during extraction.
- `2026-05-14`: Opened after the AWS control-plane strategy converged. The first implementation gap is not S3 or CloudFront mutation; it is the framework operations foundation for secret-free AWS desired state, expected account checks, credential-source diagnosis, and a read-only `aws doctor` command before any resource apply path exists.
- `2026-05-14`: Completed and archived `P86-W1`. The AWS lane now has a non-mutating devtools foundation: `config/aws.ops.ts`, AWS ops config schema/loader, STS identity reader, expected account validation, credential-source reporting, placeholder-account refusal, artifact path readiness reporting, and focused tests. The remaining gap starts with S3 inventory and plan generation.
- `2026-05-14`: Completed and archived `P86-W2`. The AWS lane now has read-only S3 inventory, non-mutating S3 plan artifacts, create/update/blocked/no-op classification, and focused tests. The next safe slice is S3 guarded apply with locks and receipts, still before CloudFront/SES/ACM/Route 53 mutation.
- `2026-05-14`: Completed and archived `P86-W3`. The AWS lane now has guarded S3 apply for reviewed plans with exact account confirmation, production confirmation, local locking, receipt artifacts, and safe bucket posture operations. The next safe slice is CloudFront/OAC inventory and plan generation before CloudFront distribution apply or S3 bucket-policy attachment.
- `2026-05-14`: Completed and archived `P86-W4`. The AWS lane now has read-only CloudFront/OAC inventory, non-mutating CloudFront/OAC plan artifacts, create/update/blocked/no-op classification, and focused tests. The next safe slice is guarded CloudFront apply plus S3 OAC bucket-policy attachment.
- `2026-05-14`: Completed and archived `P86-W5`. The AWS lane now has guarded CloudFront apply, OAC creation/attachment, distribution create/update support, explicit S3 OAC bucket-policy plan operations, idempotent bucket-policy attachment, local locking, receipt artifacts, and focused tests. The remaining gap starts with CloudFront invalidations, immutable asset cache policy, app env output, SES, ACM, and Route 53 coverage.
- `2026-05-14`: Completed and archived `P86-W6`. The AWS lane now has guarded CloudFront invalidation with default paths from configured public prefixes, invalidation receipts, and read-only app env output for storage bucket and public asset base URLs. The remaining gap starts with immutable asset cache policy hardening, SES, ACM, and Route 53 coverage.
- `2026-05-14`: Completed and archived `P86-W7`. The AWS lane now has custom immutable CloudFront cache-policy inventory, drift planning, guarded cache-policy creation, distribution create/update attachment, and focused tests. The remaining gap starts with SES, ACM, Route 53, custom-domain TLS wiring, and wider production apply coverage.
- `2026-05-14`: Completed and archived `P86-W8`. The AWS lane now has read-only SES, ACM, and Route 53 inventory, non-mutating domain/mail plan artifacts, and focused tests. The remaining gap starts with DNS validation record planning, guarded SES/ACM/Route 53 apply, and wider production apply coverage.
- `2026-05-14`: Completed and archived `P86-W9`. The AWS lane now has Route 53 record-set inventory and non-mutating DNS validation record planning for ACM validation, SES DKIM, and SES MAIL FROM records. The remaining gap starts with guarded SES/ACM/Route 53 apply and wider production apply coverage.
- `2026-05-14`: Opened `P86-W10` for guarded domains apply across safe SES, ACM, and Route 53 operations.
- `2026-05-14`: Completed and archived `P86-W10`. The AWS lane now has guarded `aws domains apply`, reviewed-plan validation, exact account and production confirmation, local locking, receipt artifacts, safe SES identity/configuration-set/MAIL FROM operations, ACM certificate requests, and Route 53 validation-record UPSERTs.
- `2026-05-14`: Opened `P86-W11` for CloudFront custom ACM certificate wiring on aliased CDN distributions.
- `2026-05-14`: Completed and archived `P86-W11`. The AWS lane now has CloudFront `cdn.<key>.certificate` config validation, viewer-certificate inventory, issued ACM certificate gating, viewer-certificate planning, guarded viewer-certificate apply, and certificate-before-alias apply ordering proof.
- `2026-05-14`: Opened `P86-W12` for Route 53 CloudFront alias record planning and guarded apply.
- `2026-05-14`: Completed and archived `P86-W12`. The AWS lane now has CloudFront alias-target inventory in the domains lane, Route 53 `A` and `AAAA` alias-record planning, and guarded alias-record apply.
- `2026-05-14`: Opened `P86-W13` for external DNS manual-output records.
- `2026-05-14`: Completed and archived `P86-W13`. The AWS lane now emits manual DNS record operations for external-provider zones and skips those operations safely during guarded domains apply.
- `2026-05-14`: Completed and archived `P86-W14`. The AWS lane now has CI-friendly non-mutating audit, least-privilege IAM policy output, SES app env output, production S3 prefix data-class blocking, and the canonical AWS control-plane how-to.
- `2026-05-14`: Completed and archived `P86-W15`. The AWS lane now has SES account sandbox/production-access inventory, configuration-set event-destination inventory, and production domains-plan blocking for SES sandbox, disabled sending, unhealthy reputation, missing DMARC, and missing BOUNCE/COMPLAINT event capture.
- `2026-05-14`: Completed and archived `P86-W16`. The AWS lane now has optional CloudFront access-log desired state, distribution logging inventory, guarded plan/apply support, audit checks, and a blocker unless log buckets use bucket-owner-preferred ownership.

## Finding

`@unisane/provider-aws` now owns the proven AWS behavior, but it has not converged onto
the final Ops extension and action contract:

1. its pack manifest exposes an opaque root command instead of typed leaf actions with
   exact input, effect, result, and receipt schemas
2. its handler instantiates a nested Commander CLI and accepts raw argv beneath the Ops
   presentation boundary
3. generic pack execution captures process-global output and process-exit state rather
   than receiving a structured action result
4. AWS desired state still has a parallel `config/aws.ops.*` loader instead of one
   `unisane.config.ts` authority and lowered Ops artifacts
5. Devtools retains transitional AWS registration/compatibility residue even though
   Framework tooling is not the provider control plane

The implemented inventory, doctor, planning, mutation, verification, and receipt
behavior is valuable and remains with the provider owner. The open gap is architectural
convergence onto one typed Ops action engine, generic trusted-pack host, canonical config
authority, and zero Devtools ownership.

## Target

Preserve the implemented AWS behavior under the archived P116-W10 ownership boundary:
shared AWS types are published by `@unisane/cloud/aws-contracts`, and AWS-specific
config, auth/API execution, inventory, planning, mutation, reports, and SDK dependencies
are owned by `@unisane/provider-aws`. Every callable capability is one typed Ops
`ActionDefinition` named by a validated pack manifest. The generic Ops host owns trust,
dispatch, approval, result rendering, and receipts. Devtools owns no AWS registration,
transport, config, or compatibility route.

The target system is:

```txt
secret-free AWS ops config
  -> expected account and environment validation
  -> read-only inventory and doctor
  -> deterministic plan artifacts
  -> guarded apply with locks and receipts
  -> app env output
```

New AWS capability work must extend the provider owner or add a genuinely
provider-neutral Cloud workflow through
`docs/work/plans/unisane-ops-product-architecture-and-extraction-plan.md`. It must not restore a Devtools
implementation owner, nested provider CLI, raw-argv handler, or parallel provider config.

## Non-Goals

- reimplementing or reducing the AWS behavior already proved by historical workpacks
- restoring an AWS Devtools lane, nested provider CLI, raw-argv engine, or compatibility
  command path
- creating another authored AWS config or a second action/approval/receipt engine
- moving AWS SDKs into the generic Ops engine, Framework, or application runtime
- replacing Terraform/CDK or changing unrelated app runtime adapters
- authorizing a provider mutation, deployment, package publication, repository cutover,
  or visibility change through this Finding

## Closure Signal

This finding can close only after the AWS provider pack reaches production-ready
control-plane coverage through the canonical typed Ops action model:

1. `aws doctor` verifies account, credentials, config, tags, and safety posture
2. S3 plans and applies manage private buckets, data-class prefixes, lifecycle, and OAC bucket policies safely
3. CloudFront plans and applies manage private S3 origins, OAC, cache policy, aliases, certificates, and invalidations
4. SES plans and applies cover identities, DKIM, MAIL FROM, config sets, sandbox status, and bounce/complaint readiness
5. ACM and Route 53 plans and applies handle certificates and DNS records with external-DNS manual-output fallback
6. app env output is generated without secrets
7. production applies require exact account confirmation, locks, and receipts
8. old buckets/resources are migrated through an explicit legacy migration lane rather than staying implicit
9. the pack manifest declares typed leaf inputs/effects and handlers return structured
   results without nested Commander, raw argv, global output capture, or process exit
10. `unisane.config.ts` and its lowered Ops artifacts are the only desired-state config
    authority; `config/aws.ops.*` has zero current residue
11. Devtools has zero AWS registrars, compatibility routes, provider dependencies, or
    user-facing AWS command documentation

`P86-W1` through `P86-W16` are historical behavior proof for the opening AWS S3,
CloudFront/OAC/cache/logging, app env output, domain/mail planning, guarded domains apply,
CloudFront custom certificate foundation, Route 53 CloudFront alias records, external
DNS manual output, IAM policy output, CI audit, production-readiness docs, and SES
production readiness. The next bounded slice is action/manifest/config convergence;
optional KMS policy, cost doctor, legacy migration guidance, and real asset-resolution
proof follow only through that owner.
