---
'@unisane/provider-cloudflare': patch
---

Correct Worker binding updates to use Cloudflare's PATCH settings endpoint and multipart settings payload. Preserve existing bindings, including secret references, when adding queue or environment bindings.
