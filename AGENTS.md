# unisane-ops Agent Contract

Read `skopos session context . --json` before implementation. Skopos owns local Tasks, Project Memory, Evidence, Readiness, and closure; product behavior must not depend on Skopos.

Use `docs/00-start-here.md` as the documentation router. Work only through repository-local commands and dependencies. Do not import infrastructure, a sibling checkout, or the checkout parent.

This repository contains migrated history but follows clean-refactor policy: remove obsolete paths rather than adding compatibility shims before a stable release. Preserve named, tested resilience and safe persisted-data migration.

Never commit credentials or secret values. External repository, registry, DNS, cloud, visibility, release, or authority mutations require explicit human approval.
