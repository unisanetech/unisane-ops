# @unisane/provider-meta

Meta Graph transport and provider-specific resource normalization for Unisane Ops.

Growth retains provider-neutral configuration, reporting, planning, mutation safety,
and receipts. This package owns Meta Graph discovery, reporting, asset upload, and
guarded remote execution behind host bindings.

No local token-profile or provider CLI surface is supported. Meta-backed commands must
fail closed until a canonical Meta connection adapter supplies the required
identity, grants, resources, and credentials. Provider-specific expert commands must not
be advertised as connectable before that lifecycle is implemented.

Meta CAPI remains an application-runtime connector under `@unisane/web-runtime`; it is
not a management credential bypass.
