# @unisane/framework-ops

Reserved typed boundary for the optional integration between a serialized Unisane Framework
project descriptor and Unisane Ops.

This package has no runtime implementation while the Framework-owned descriptor schema, digest
rules, compatibility contract, and canonical fixtures remain unavailable. Its only source export is
a generic TypeScript boundary whose input is `unknown`; it deliberately makes no claim about
descriptor fields or the shape of the eventual Ops projection.

The package does not compile a Framework project, load Framework source or cache state, import
Framework, Compiler, or Devtools packages, contribute CLI commands, execute another binary, or parse
terminal output. It is not part of the default Ops installation.

`private: true` prevents this incomplete boundary from being published as a usable adapter. Remove
that guard only after the Framework-owned contract is frozen and package-owned validation, mapping,
compatibility fixtures, and release proof are complete.
