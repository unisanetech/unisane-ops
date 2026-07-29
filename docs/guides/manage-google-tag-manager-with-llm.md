---
id: 'DOC-8cd9af7c084b'
owner: 'unisane'
scope: workspace
role: guide
lifecycle: durable
authority: supporting
provenance: accepted
view: current
---

# Manage Google Tag Manager With LLM

Use this guide when an LLM-driven change touches Google Tag Manager control-plane
behavior, tracking manifests, ads tags, consent settings, data-layer events, GTM recipes,
`@unisane/growth/gtm`, or `@unisane/provider-google/gtm`.

## Changelog

- `2026-07-27`: Removed the unreleased Devtools GTM root and legacy package coordinate;
  `unisane growth gtm ...`, `@unisane/growth/gtm`, and
  `@unisane/provider-google/gtm` are now the only live surfaces.
- `2026-07-25`: Implemented the P116-W13 ownership split. `@unisane/growth` now owns
  provider-neutral GTM manifests, validation, policy, recipes, desired state, and
  planning; `@unisane/provider-google/gtm` owns Google API execution. First-party
  consumers use the new coordinates.
- `2026-07-25`: Routed the implemented GTM auth bridge through
  `@unisane/provider-google`. GTM manifest/diff/apply/version/publish workflows remain
  transitional Devtools behavior until the Growth extraction.
- `2026-07-24`: Added extraction authority: documented the implemented `unisane growth gtm` workflow while target GTM ownership moves to Unisane Ops Growth and the Google provider connection.
- `2026-05-27`: Clarified that GTM command lanes use the shared provider-control-plane cwd resolver and that the Marketing Google profile can include GTM read-only discovery.
- `2026-05-27`: Linked the provider control-plane baseline so GTM keeps its specialist command lifecycle while reusing shared Google auth/profile, env, artifact, and mutation-risk rules.
- `2026-05-27`: Clarified GTM OAuth/client-secret handling, separated GTM auth profiles from Marketing Google auth profiles, and made manifest app id the default local GTM profile name when available so LLM agents do not ask for unnecessary raw access tokens.
- `2026-04-29`: Added the devtools GTM auth workflow. Live GTM commands may now use a saved OAuth refresh-token profile when `GOOGLE_TAG_MANAGER_ACCESS_TOKEN` is not set; profiles default to macOS Keychain storage and plaintext file storage is explicitly opt-in for controlled CI/test environments.
- `2026-04-29`: Added the W4 preview, version, publish, and rollback workflow. GTM version creation now requires successful preview evidence, publish/rollback require `--yes`, production publish requires an exact confirmation token, and environments can block publish with `publishPolicy: never`.
- `2026-04-29`: Added the W3 safe apply workflow. `gtm apply --yes` may now mutate a controlled GTM workspace with the `tagmanager.edit.containers` scope, writes an apply receipt, blocks workspace conflicts, and still does not preview, create versions, publish, or rollback.
- `2026-04-29`: Updated the workflow for the read-only W2 command slice. `gtm validate`, `gtm pull`, `gtm diff`, and `gtm plan` now exist; later mutation gates build on this diff/plan foundation.
- `2026-04-29`: Added the canonical LLM workflow for GTM/tracking/ads changes so agents load the right context, preserve package boundaries, plan before applying, and treat GTM publish as a gated production operation.

## Command Authority

`unisane growth gtm ...` resolves the sealed `@unisane/growth` pack. Growth owns the
domain and command presentation; `@unisane/provider-google` owns authentication and
remote execution behind the canonical host binding. Browser integration uses
`@unisane/web-runtime/tracking`.

## Goal

Make GTM-related changes deterministic, reviewable, and safe for humans and LLM agents.

The default LLM stance is:

1. understand ownership first
2. change manifests and package code before remote GTM state
3. generate a plan before mutation
4. mutate only an isolated GTM workspace
5. preview before versioning
6. publish only through an explicit production gate

## Open First

1. `docs/work/archive/plans/framework-google-tag-manager-control-plane-plan.md`
2. `docs/work/archive/plans/framework-web-tracking-and-conversions-plan.md`
3. `docs/standards/12-provider-control-plane-baseline.md` when shared Google auth/profile, env, artifact, or provider-risk behavior changes
4. `docs/guides/execute-key-changes-with-llm.md`
5. `docs/guides/command-workflow-contract.md`
6. app-local `.unisane/START_HERE.md` when working inside a deployable that has local generated context

## Ownership Map

Use these boundaries:

| Concern                            | Owner                                              |
| ---------------------------------- | -------------------------------------------------- |
| Browser event runtime              | `@unisane/web-runtime/tracking`                    |
| GTM manifest, policy, and planning | `@unisane/growth/gtm`                              |
| Google GTM API execution           | `@unisane/provider-google/gtm`                     |
| CLI composition                    | canonical `unisane` pack host                      |
| Server conversion envelope         | `@unisane/web-runtime/conversions`                 |
| Google Ads server upload           | `@unisane/web-runtime/conversions/google-ads`      |
| App-specific GTM intent            | app/platform GTM manifest                          |
| Vendor credentials and OAuth       | Google provider connection and host secret surface |
| Feature event emission             | app code through `@unisane/web-runtime/tracking`   |

Feature code must not import GTM control-plane packages and must not call
`window.dataLayer` directly. Manifests import `@unisane/growth/gtm`.

## LLM Preflight

Before editing, classify the work:

1. Read-only analysis: no command lane beyond inspection.
2. App manifest change: `T1` unless production publish behavior changes.
3. `@unisane/growth/gtm` or `@unisane/provider-google/gtm` package change: `T2`.
4. `unisane growth gtm` command change: `T2`.
5. Consent, publish, rollback, auth, or drift-policy change: `T2`.
6. Remote GTM mutation: only after manifest/diff/plan workflow exists and the user explicitly asks to apply it.

Then run targeted discovery:

```bash
rg -n "growth/gtm|provider-google/gtm|web-runtime|dataLayer|GTM|google ads|consent" docs unisane-ops unisane-platforms
pnpm --filter @unisane/devtools exec unisane-devtools llm context --scope ops/growth --json
pnpm --filter @unisane/devtools exec unisane-devtools llm symbols --package @unisane/growth --json
pnpm --filter @unisane/devtools exec unisane-devtools llm symbols --package @unisane/provider-google --json
```

Use `llm resolve-ref` for app, module, operation, token, collection, enum, event, and dependency ownership. Use `llm symbols --package` for adapter-package discovery until adapter packages are promoted into the architecture scope resolver. If a package/scope does not exist yet, record that as a blocker classification before implementation instead of inventing a parallel local helper.

## Allowed Change Paths

### Add A Browser Tracking Event

1. Add or update the app-owned event contract.
2. Emit through `@unisane/web-runtime/tracking`.
3. Add or update GTM manifest trigger/variables through recipes.
4. Map to GA4 or browser Google Ads tags only when browser-side behavior is intended.
5. If conversion truth is server-confirmed, route the confirmed event through
   `@unisane/web-runtime/conversions`.
6. Declare dedupe when the same business event has browser and server delivery.

### Add A GTM Tag, Trigger, Or Variable

1. Add a typed manifest entry or recipe call.
2. Keep stable Unisane slugs.
3. Put managed resources under the app namespace/folder.
4. Add consent metadata for tags.
5. Add policy tests when the tag is broad, vendor-owned, or script-bearing.
6. Run validate/diff/plan before any apply.

### Add A Google Ads Conversion

1. Decide whether the conversion is browser-observed or server-confirmed.
2. Browser-observed conversion: GTM manifest/recipe under `@unisane/growth/gtm`.
3. Server-confirmed conversion: `@unisane/web-runtime/conversions` plus
   `@unisane/web-runtime/conversions/google-ads`.
4. Do not duplicate browser and server delivery without a dedupe identifier and documented attribution strategy.
5. Keep conversion ids/labels in secure config when they are treated as sensitive.

### Change Consent Behavior

1. Treat consent changes as high-impact.
2. Update the typed manifest consent block.
3. Review default consent states.
4. Review tag-level consent checks.
5. Add or update tests for policy enforcement.
6. Do not describe consent behavior as legal advice.

### Change CLI Apply Or Publish Behavior

1. Treat as `T2`.
2. Update the owning Growth/provider behavior and transitional Devtools command tests.
3. Preserve plan-before-apply and separate-publish semantics.
4. Keep production publish blocked without preview/version evidence.
5. Update this guide and the GTM control-plane plan when command semantics change.

### Change GTM Auth Behavior

1. Treat as `T2`.
2. Keep OAuth refresh-token handling owned by `@unisane/provider-google`, not manifests.
3. Preserve this precedence for live commands: explicit access-token environment variable first, saved auth profile second.
4. Store refresh tokens and OAuth client secrets in macOS Keychain by default.
5. Allow plaintext file storage only through explicit CI/test opt-in.
6. Never print refresh tokens, client secrets, or raw access tokens unless a user explicitly runs an auth-token command with a print flag.

## Remote GTM Mutation Rules

LLM agents must not mutate remote GTM as a first step.

Allowed sequence:

```bash
unisane growth gtm validate --cwd <app-cwd> --app <app> --env <env>
unisane growth gtm pull --cwd <app-cwd> --app <app> --env <env>
unisane growth gtm diff --cwd <app-cwd> --app <app> --env <env>
unisane growth gtm plan --cwd <app-cwd> --app <app> --env <env>
unisane growth gtm apply --cwd <app-cwd> --app <app> --env <env> --yes
unisane growth gtm preview --cwd <app-cwd> --app <app> --env <env>
unisane growth gtm create-version --cwd <app-cwd> --app <app> --env <env> --preview-receipt <preview.json> --yes
unisane growth gtm publish --cwd <app-cwd> --app <app> --env production --version <version> --version-receipt <version.json> --production-confirm <app>:production:<version> --yes
```

`<app-cwd>` may be repo-relative, for example `unisane-platforms/apps/true-resume`. GTM commands use the shared provider-control-plane cwd resolver, so package-local `pnpm --filter ... exec` working directories must not steal app manifests or `.unisane/**` artifacts.

Current implemented command slice:

1. `auth login|status|token|logout`: manages local OAuth profiles for GTM API access. Login uses a browser-based OAuth flow and stores refresh tokens outside the repo; status never prints secrets; token does not print raw access tokens unless `--print` is passed.
2. `validate`: local manifest and policy checks only, no Google credentials required.
3. `pull`: read-only GTM API snapshot; uses `GOOGLE_TAG_MANAGER_ACCESS_TOKEN` unless a command-specific token environment is provided, then falls back to a saved `gtm auth` profile.
4. `diff`: read-only live diff or offline `--snapshot <path>` diff.
5. `plan`: read-only live plan or offline `--snapshot <path>` plan artifact.
6. `apply --dry-run`: non-mutating apply plan from `--snapshot`, `--workspace-id`, or `--workspace-name`.
7. `apply --yes`: live GTM workspace mutation with `tagmanager.edit.containers`; creates a controlled workspace when no workspace id/name is passed, syncs it first, applies only managed resources, skips unmanaged resources, blocks merge conflicts, and writes an apply receipt.
8. `preview`: live GTM quick preview with `tagmanager.edit.containerversions`; fails on compiler errors or sync conflicts and writes a preview receipt.
9. `create-version --yes --preview-receipt <path>`: creates a GTM container version only after matching preview evidence and writes a version receipt.
10. `publish --yes --version <id> --version-receipt <path>`: publishes a specific container version with `tagmanager.publish` plus read/version scope for receipt reads; blocks environments with `publishPolicy: never`; production additionally requires `--production-confirm <app>:production:<version>`.
11. `rollback --yes --version <id>`: publishes a previous known-good version target through the same GTM publish path and writes a rollback receipt.

Rules:

1. `apply` must target a Unisane-owned workspace and requires `--yes` for live mutation.
2. `publish` must be separate from `apply`.
3. `create-version` requires a successful preview receipt for the same app, environment, account, and container.
4. `publish` and `rollback` require `--yes`, a specific version id, and an environment publish policy that allows publishing.
5. production publish or rollback requires an explicit user request plus `--production-confirm <app>:production:<version>`.
6. `delete` requires tombstone plus explicit delete approval.
7. remote drift on managed resources is a blocker unless the command is only reporting it.
8. never paste OAuth tokens, refresh tokens, client secrets, conversion labels marked as secret, or GTM preview auth values into chat/docs.
9. live `apply` must use an OAuth token with `tagmanager.edit.containers`; preview/version must use `tagmanager.edit.containerversions`; publish/rollback must use `tagmanager.publish` and should include read or version scope for receipt reads.

## GTM Auth Workflow

Use OAuth user consent for devtools GTM access. Google requires OAuth 2.0 for Tag Manager API calls, and desktop loopback authorization is the right fit for local CLI use.

Recommended setup:

1. Enable the Tag Manager API in Google Cloud.
2. Create an OAuth client with application type `Desktop app`.
3. Grant your Google user the needed GTM container permissions.
4. Run:

```bash
unisane growth gtm auth login --client-id <oauth-client-id>
unisane growth gtm auth status
unisane growth gtm pull --manifest config/google-tag-manager.ts --env staging
```

Rules:

1. `GOOGLE_TAG_MANAGER_ACCESS_TOKEN` and `--access-token-env <name>` still win for one-off use.
2. `--auth-profile <name>` selects a saved profile for live GTM commands; when a manifest is available, the default local profile name is the manifest `appId`, otherwise the auth namespace default is used.
3. `gtm auth login` stores refresh tokens in macOS Keychain by default.
4. `UNISANE_GTM_AUTH_STORE=file` plus `UNISANE_GTM_AUTH_ALLOW_PLAINTEXT_STORE=1` is allowed only for controlled CI/test environments.
5. If using a Web OAuth client instead of Desktop app, the loopback redirect URI must match the Google Cloud client exactly; Desktop app clients avoid this setup friction.
6. Repeated consent logins can consume Google refresh-token quota, so prefer reusing profiles and `gtm auth logout` only when replacing credentials.

Client-secret rules:

1. `GOOGLE_OAUTH_CLIENT_SECRET` is the shared default client-secret env for GTM auth.
2. `GOOGLE_OAUTH_CLIENT_SECRET` is the sole Google control-plane OAuth client-secret env.
3. Client id and client secret are different values. Never set a client-secret env to the OAuth client id.
4. GTM auth profiles are namespaced separately from Marketing Google auth profiles. A GTM profile grants GTM mutation scopes; a Marketing Google profile grants GTM read-only discovery plus Google Ads, GA4, and Search Console scopes.
5. Do not ask users to create `GOOGLE_TAG_MANAGER_ACCESS_TOKEN` manually unless saved-profile access is blocked; the CLI can mint access tokens from the saved refresh-token profile.

## Required Safety Checks

For package or CLI changes:

1. package unit tests
2. package `check-types`
3. package lint
4. package build
5. devtools command tests when CLI behavior changes
6. `pnpm docs:core:check` when docs are touched
7. `pnpm architecture:index:check`
8. `pnpm -w typecheck` unless scope or existing unrelated failures are explicitly recorded

For GTM manifest changes:

1. manifest validation
2. deterministic diff
3. plan artifact
4. policy result
5. preview result before version/publish

## Anti-Patterns

1. feature code imports GTM admin APIs
2. feature code calls `window.dataLayer.push`
3. an LLM edits remote GTM before reading manifest ownership
4. `apply` publishes production changes
5. raw Custom HTML is added without policy approval
6. consent is described only in prose and not represented in manifest data
7. conversion labels or credentials are committed
8. browser and server conversions fire for the same event without dedupe
9. unmanaged GTM resources are silently modified
10. GTM API calls are made in tight loops despite quota limits

## Completion Checklist

1. Ownership and package boundary are explicit.
2. App/event/manifest changes use stable slugs.
3. Consent and attribution behavior are declared.
4. Server-confirmed conversion behavior is not mixed into GTM management.
5. Diff/plan/apply/publish separation is preserved.
6. Remote mutation, if any, happened only through the GTM CLI workflow.
7. Tests and docs gates matching the touched surface passed or failures are recorded.
