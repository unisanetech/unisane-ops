---
id: 'F-3a32198d688a'
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

# F-20260528 AWS SES BIMI Sender Brand Readiness Gap

## Changelog

- `2026-08-15`: Superseded Devtools provider-operation ownership. BIMI/SES inventory,
  pull, plan, guarded DNS apply, repair, verification, approval, and receipts belong to
  typed Unisane Ops actions through `unisane-ops`; Compiler/Devtools perform no provider
  mutation. Existing Devtools implementation remains residue/history pending deletion,
  and this update does not claim it has moved.
- `2026-05-28`: Extended `P105-W1` with publishable BIMI brand asset generation, versioned True Resume BIMI URLs, and matching `bimi/` CDN prefix exposure.
- `2026-05-28`: Implemented `P105-W1`; devtools now models BIMI desired state, plans BIMI DNS and DMARC-enforcement readiness, allows guarded Route 53 BIMI TXT apply, audits BIMI posture, and carries True Resume BIMI refs.
- `2026-05-28`: Opened after the communication/mail planning review showed that AWS devtools can manage SES identities, DKIM, MAIL FROM, and bounce/complaint capture, but cannot yet model BIMI sender-logo readiness, enforced DMARC posture, or BIMI DNS records for brand logos in recipient inboxes.

## Finding

The observed AWS control-plane Devtools lane manages SES sending identities, DKIM, MAIL
FROM, configuration sets, BOUNCE/COMPLAINT event capture, and app env output. That is
useful implementation evidence, but remote ownership now belongs to Unisane Ops and the
AWS provider package. The existing Devtools source is residue pending a clean cut, not a
supported or forwarding command path.

To show a brand logo beside product emails in mailbox clients that support BIMI, a platform needs a separate sender-brand readiness lane:

1. enforced DMARC on the sending domain
2. BIMI-compatible SVG logo URL
3. optional but production-relevant VMC or CMC PEM URL
4. BIMI TXT record under `<selector>._bimi.<domain>`
5. publishable brand asset output for the logo and certificate object keys
6. audit/status output that distinguishes SES readiness from sender-brand readiness

Without this lane, teams can believe SES is production-ready while Gmail/Yahoo/Apple-style brand-logo presentation is still unconfigured, weakly authenticated, or invisible.

## Target

Expose BIMI sender-brand desired state through the AWS provider and one typed Ops
`ActionDefinition` family reached as `unisane-ops provider aws ...`. Framework may
produce deterministic local brand assets/manifests, but Compiler and Devtools never
inventory, pull, plan, apply, repair, or verify AWS state.

Target config shape:

```txt
mailIdentities.<key>.bimi:
  selector: default
  logoUrl: https://assets.<domain>/bimi/logo.svg
  certificateUrl: https://assets.<domain>/bimi/cert.pem
```

Target behavior:

1. config schema validates BIMI URLs and selector
2. the typed domains plan action checks DMARC enforcement when BIMI is configured
3. the typed domains plan action emits BIMI TXT DNS operations
4. Route 53 BIMI records are guarded through the Ops domains apply action
5. external DNS zones get manual BIMI operations
6. inventory/audit and verification actions surface BIMI readiness separately from SES readiness
7. True Resume desired state declares its intended BIMI sender-brand refs
8. brand generation emits a publish manifest for the logo object key and externally supplied certificate object key
9. CLI, MCP, API, automation, console, and agent adapters invoke the same typed action
   and structured result, including approval and receipt evidence

## Non-Goals

1. do not issue VMC or CMC certificates through Framework tooling or Ops
2. do not generate BIMI SVG assets inside Provider AWS or a remote provider action;
   deterministic local Framework brand generation remains a separate owner
3. do not upload logo or PEM files through Compiler/Devtools; a future Ops upload action
   requires separate admission
4. do not guarantee every recipient inbox displays the logo
5. do not create a separate `aws ses` command family in this workpack
6. do not change runtime SES mail delivery behavior

## Closure Signal

This finding can close after:

1. AWS ops config supports BIMI sender-brand desired state
2. the typed Ops domains plan action emits BIMI DNS operations and DMARC enforcement blockers
3. the typed Ops domains apply action supports Route 53 BIMI TXT upsert through the guarded apply path
4. config schema rejects non-HTTPS logo/cert refs, and Ops verification reports missing BIMI state plus production missing certificate refs
5. focused Provider AWS and typed-action tests cover Route 53 and external-DNS BIMI plans
6. True Resume has desired BIMI refs in the one canonical `unisane.config.ts`
7. brand generation emits a publishable BIMI SVG and object-key manifest for the configured asset CDN prefix

`P105-W1` implemented the observed Devtools control-plane coverage. Keep this finding
active until that behavior is clean-cut into Provider AWS and typed Ops actions, every
Devtools provider command/wrapper is deleted, and the referenced True Resume BIMI
assets, certificate, and DNS records are actually published and verified outside the
local desired-state model. The documentation update itself is not evidence that the
source move or provider mutation occurred.
