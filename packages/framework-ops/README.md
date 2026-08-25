# @unisane/framework-ops

`@unisane/framework-ops` is the optional descriptor-only boundary between Unisane Framework projects
and Unisane Ops. It accepts static JSON bytes from the versioned
`@unisane/compiler/project-descriptor-contract/v1` coordinate and never imports or executes
Framework, Compiler, Devtools, generated runtime code, or another product CLI.

The package validates the exact supported contract and JSON Schema assets before it parses a
descriptor. Descriptor validation then enforces canonical serialized bytes, the SHA-256 core digest,
project and compiler identity, an explicit allowed capability set, required feature and operation
coverage, and the complete API compatibility lifecycle policy.

`validateAndMapFrameworkProjectDescriptor(...)` returns one deeply immutable, Ops-owned
`FrameworkOpsProjectIntegration`. The model contains static project, compiler, capability, and API
compatibility facts only. It contains no handler, command, source path, service, container,
provider, credential, approval, policy, or workflow authority.

Callers must supply:

- the raw `contract.json` and `framework-project-descriptor.schema.json` bytes resolved from
  `@unisane/compiler/project-descriptor-contract/v1`;
- the raw `.cache/unisane/project-descriptor.json` bytes;
- the exact expected project and compiler identities;
- the complete allowed capability id set and any required capability facts.

The contract assets and descriptor are immutable inputs. This package does not invoke Framework
compilation, discover commands or packages, or provide a compatibility path for the retired
executable Framework bridge.
