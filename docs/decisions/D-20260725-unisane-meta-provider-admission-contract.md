---
id: 'D-cfb606b23ccd'
owner: 'unisane'
repository: unisane-ops
scope: workspace
role: decision
lifecycle: durable
authority: canonical
provenance: accepted
view: current
status: accepted
---

# D-20260725 Unisane Meta Provider Admission Contract

## Changelog

- `2026-07-25`: Admitted one Meta provider-family package after the implemented
  management lifecycle passed the provider and package-budget tests; kept Meta CAPI in
  Web Runtime and Growth strategy/safety outside the provider.

## Context

The initial Ops topology correctly deferred `@unisane/provider-meta` because Meta CAPI
delivery alone is an application-runtime connector. The repository now contains a
broader operational lifecycle: saved Meta connection profiles, account/pixel/business/
Page/Instagram discovery, reporting, creative inventory, image/video asset upload, and
guarded campaign pause or paused campaign/ad-set/creative/ad creation.

Leaving those transports in Growth and Framework Devtools makes the suite select a vendor
implementation, duplicates Graph API pagination and parsing, and couples provider API
changes to strategy and compiler tooling releases.

## Decision

Admit one public `@unisane/provider-meta` family package in the Unisane Ops monorepo.

The package owns:

- the Meta connection/profile and secret-store lifecycle
- Graph API pagination, response handling, and provider identity normalization
- account, pixel, business, Page, and Instagram inventory/discovery transport
- Ads reporting and creative inventory transport
- image/video asset upload
- campaign pause and paused campaign/ad-set/creative/ad creation

Growth owns Meta-neutral configuration schemas, normalized reports, plans, creative and
campaign policy, confirmations, approvals, locks, blockers, receipts, and provider
contracts. Devtools remains a transitional command/presentation composition root. Meta
CAPI remains `@unisane/web-runtime/conversions/meta`; it is not moved into the management
provider package.

Use one provider-family package with `./marketing` as the management subpath. Do not
create separate packages for Meta Ads, Pages, Instagram, Pixels, or auth.

## Provider Admission Record

| Field                          | Evidence                                                                                                                                                                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| provider family and connection | One Meta access-token profile lifecycle with Keychain/default secret storage, explicit file-store opt-in for controlled CI/tests, profile identity, scopes, expiry, and fallback env handling.                                                                                      |
| admitted capabilities          | Connect/status/token/logout; ad-account/pixel/business/Page/Instagram inventory; campaign/ad-set/ad/creative reports; image/video upload; guarded campaign pause and paused campaign creation.                                                                                      |
| operational lifecycle          | Connect and Observe are implemented; Adopt is a reviewable Growth-owned discovery/config action; Manage uses Growth-owned plans and receipts. Provider-console app creation, permission review, billing, policy appeal, and system-user provisioning remain explicit human gaps.    |
| effect and risk model          | Auth is security-sensitive; inventory/reporting is `read-network`; asset mutation is `write`; campaign creation/pause is `spend-impact` and production-sensitive. Remote effects retain exact account/operation confirmation and approval.                                          |
| state and concurrency          | Secrets remain outside artifacts. Growth owns freshness, plan hash, approval, operation confirmation, blockers, receipts, and replay-safe orchestration; durable automation remains unavailable without the engine-grade stores and locks required by the provider safety baseline. |
| SDK/dependency isolation       | The current transport is standards-based `fetch`, so no Meta SDK is required. Graph API versions, permissions, pagination, retry/rate-limit policy, and any future optional SDK remain isolated in Provider Meta.                                                                   |
| fixtures and provider access   | Existing redacted Meta discovery, reporting, inventory, asset, auth, and live-campaign characterization uses mocked Graph responses and controlled file auth stores; no production customer data is required.                                                                       |
| independent consumers          | Transitional marketing report pull, ads apply, ads asset upload, and expert Meta inventory/auth command families consume the provider independently through Growth contracts or provider APIs.                                                                                      |
| package-budget result          | Passed below.                                                                                                                                                                                                                                                                       |
| terminal legacy disposition    | P116-W18 removes Meta Graph transport and saved-profile implementation from Growth/Devtools owners, retains only command composition, and adds permanent zero-residue gates.                                                                                                        |

## Package-Budget Admission Record

| Field                        | Evidence                                                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| proposed package and owner   | `@unisane/provider-meta`, owned by Unisane Ops provider maintainers in `unisane-ops/packages/provider-meta`.                                                                                       |
| consumers                    | Growth-backed reporting, ads apply, ads asset upload, and expert Meta inventory/auth commands need one reusable provider lifecycle; a Growth folder would invert suite/provider ownership.         |
| public surface               | Root auth/connection exports plus `./marketing`; Node 18+ ESM; Growth contracts and Ops engine only; command registration, strategy, receipts, UI, and CAPI excluded.                              |
| dependency isolation         | Meta Graph API versions, secrets, permissions, and any future Meta SDK stay outside Growth, Web Runtime consumers, and Framework compiler tooling.                                                 |
| release independence         | Provider API-version, permission, pagination, auth, and mutation fixes can ship without changing Growth strategy contracts; lockstep release is retained only where a contract change requires it. |
| security/licensing boundary  | Gains one auditable secret/profile and remote-mutation boundary; no additional commercial license boundary.                                                                                        |
| package-content proof        | Exact export map, side-effect-free manifest, generated metadata/symbol ownership, tests, types, package build, and architecture gate are required by P116-W18.                                     |
| rejected simpler alternative | A Growth subfolder preserves dependency inversion; a Devtools folder remains Framework-coupled; separate Meta service packages fragment one shared Graph connection and release lifecycle.         |
| removal/merge condition      | Merge or retire only if Meta management capabilities are removed or lose all consumers beyond runtime CAPI; file count or conceptual symmetry is not a split/merge reason.                         |

## Consequences

- Provider Meta becomes an approved target package and generated Ops owner.
- Growth no longer contains Meta Graph API request transport or a Meta live-executor
  fallback.
- Devtools command wrappers may remain temporarily for public compatibility but must
  import Provider Meta rather than own auth or Graph transport.
- Provider Meta must consume Growth through the exact `@unisane/growth/contracts`
  subpath.
- New Meta capabilities require capability-level admission and safety proof inside this
  family; they do not justify more packages.

## Rejected Options

1. Retire all Meta management despite live report, inventory, asset, and guarded campaign
   consumers.
2. Keep Meta implementation in Growth as a permanent special case.
3. Keep the provider implementation private inside Devtools.
4. Create separate packages for Meta auth, Ads, Pages, Instagram, and Pixels.
