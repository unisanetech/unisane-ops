---
'@unisane/web-runtime': minor
'@unisane/provider-meta': patch
---

Add consent-controlled tracking, stable conversion identity, transactional publication, provider
acceptance receipts and complete delivery observations. Google Ads uses typed customer hashes.
Provider retries retain their ID/time and honor bounded retry guidance. Meta API pins now have one
shared contract owner, with existing API versions preserved.

Migration: configure explicit advertising consent and occurrence time; use destination-specific
hashing helpers; move Google email/phone hashes from properties into customer.hashedEmail and
customer.hashedPhone; pass the Core worker's delivery context to conversion subscribers. Install the
coordinated Core events/outbox update and apply events\_\_003_outbox_deduplication before enabling
keyed PostgreSQL publication. See the Web Runtime README for the host wiring.
