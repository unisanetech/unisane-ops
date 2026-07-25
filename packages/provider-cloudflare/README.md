# @unisane/provider-cloudflare

Cloudflare provider-family implementations for Unisane Cloud. The first admitted
capabilities are DNS plus Queue, Worker, route, binding/settings, secret, and Cron
transport through exact `@unisane/cloud/*` contract subpaths.

The package owns Cloudflare HTTP authentication, wire-response validation, errors, and
normalization for account/zone discovery, DNS records, Queues, Workers, routes, settings,
scripts, secrets, consumers, and Cron schedules.
Its first-party pack also owns `connect cloudflare check`, a read-only credential
verification and account/zone discovery command. Reports are redacted and credentials
remain environment-variable inputs; the command does not persist secrets.

The provider does not own provider-neutral planning, project configuration, plan
approval, local state selection, or Unisane Framework integration.
Queue, Worker, route, settings, script, secret, consumer, and Cron mutations are invoked
only by the Cloud-owned safety lifecycle after exact plan/approval/lock validation.
