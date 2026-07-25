# @unisane/provider-aws

AWS provider-family operations for Unisane Cloud.

The package owns AWS credential-chain access and SDK transport together with the proven
AWS-specific S3, CloudFront/OAC/cache/invalidation, ACM, Route 53, SES, SNS, STS,
doctor, audit, IAM, environment, inventory, plan, apply, receipt, and
certificate-deletion workflows.

Shared public AWS config, report, reader, and executor contracts are imported from
`@unisane/cloud/aws-contracts`. AWS SDK dependencies do not belong in Devtools, Cloud,
the generic Ops engine, Framework runtime packages, or application code.

This package deliberately represents one AWS provider family. Individual AWS services
are capabilities inside the family, not separate packages. It owns the sealed
`provider aws` command pack and exact handler:

```bash
unisane provider aws ...
```

The existing Devtools `aws ...` root is a thin compatibility registrar over this owner.
