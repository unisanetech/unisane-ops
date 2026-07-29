---
id: 'F-3a32198d688a'
owner: 'unisane'
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

- `2026-05-28`: Extended `P105-W1` with publishable BIMI brand asset generation, versioned True Resume BIMI URLs, and matching `bimi/` CDN prefix exposure.
- `2026-05-28`: Implemented `P105-W1`; devtools now models BIMI desired state, plans BIMI DNS and DMARC-enforcement readiness, allows guarded Route 53 BIMI TXT apply, audits BIMI posture, and carries True Resume BIMI refs.
- `2026-05-28`: Opened after the communication/mail planning review showed that AWS devtools can manage SES identities, DKIM, MAIL FROM, and bounce/complaint capture, but cannot yet model BIMI sender-logo readiness, enforced DMARC posture, or BIMI DNS records for brand logos in recipient inboxes.

## Finding

The AWS control-plane devtools lane already manages SES sending identities, DKIM, MAIL FROM, configuration sets, BOUNCE/COMPLAINT event capture, and app env output. That is enough for basic SES deliverability, but it is not enough for sender-brand inbox presentation.

To show a brand logo beside product emails in mailbox clients that support BIMI, a platform needs a separate sender-brand readiness lane:

1. enforced DMARC on the sending domain
2. BIMI-compatible SVG logo URL
3. optional but production-relevant VMC or CMC PEM URL
4. BIMI TXT record under `<selector>._bimi.<domain>`
5. publishable brand asset output for the logo and certificate object keys
6. audit/status output that distinguishes SES readiness from sender-brand readiness

Without this lane, teams can believe SES is production-ready while Gmail/Yahoo/Apple-style brand-logo presentation is still unconfigured, weakly authenticated, or invisible.

## Target

Extend the existing `@unisane/devtools aws domains` control-plane lane so mail identities can declare BIMI sender-brand desired state.

Target config shape:

```txt
mailIdentities.<key>.bimi:
  selector: default
  logoUrl: https://assets.<domain>/bimi/logo.svg
  certificateUrl: https://assets.<domain>/bimi/cert.pem
```

Target behavior:

1. config schema validates BIMI URLs and selector
2. domains plan checks DMARC enforcement when BIMI is configured
3. domains plan emits BIMI TXT DNS operations
4. Route 53 BIMI records are guarded through existing domains apply
5. external DNS zones get manual BIMI operations
6. audit surfaces BIMI readiness separately from SES readiness
7. True Resume desired state declares its intended BIMI sender-brand refs
8. brand generation emits a publish manifest for the logo object key and externally supplied certificate object key

## Non-Goals

1. do not issue VMC or CMC certificates through devtools
2. do not generate BIMI SVG assets in this workpack
3. do not upload logo or PEM files in this workpack
4. do not guarantee every recipient inbox displays the logo
5. do not create a separate `aws ses` command family in this workpack
6. do not change runtime SES mail delivery behavior

## Closure Signal

This finding can close after:

1. AWS ops config supports BIMI sender-brand desired state
2. `aws domains plan` emits BIMI DNS operations and DMARC enforcement blockers
3. `aws domains apply` supports Route 53 BIMI TXT upsert through the existing guarded apply path
4. config schema rejects non-HTTPS logo/cert refs, and `aws audit` reports missing BIMI state plus production missing certificate refs
5. focused devtools tests cover route53 and external-DNS BIMI plans
6. True Resume has desired BIMI refs in `config/aws.ops.ts`
7. brand generation emits a publishable BIMI SVG and object-key manifest for the configured asset CDN prefix

`P105-W1` implemented the devtools control-plane coverage. Keep this finding active until the referenced True Resume BIMI assets/certificate and DNS records are actually published and verified outside the local desired-state model.
