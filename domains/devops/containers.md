---
schema_version: 5
id: devops.containers
title: DevOps Containers
domain: devops
type: subdomain
subdomain: containers
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: da2bf019664bc0dd461dfb60fa8f0838dc7fc3e968ba19c8647d5757f3f9df14
---

# DevOps Containers

This scope covers the construction, identity, portability, and operational contract of container images.

## Principles

### PRN-000073 — Deploy images by immutable identity

Build a new content-addressed image for each change and promote the verified digest rather than relying on a mutable tag. [1], [2]

#### Why

An OCI image’s configuration and filesystem content determine its identity. A digest binds deployment to exact content, while provenance lets a consumer verify where, when, and how the artifact was produced. [1], [2]

#### Practices

- Record the image digest with its source revision, build provenance, and release evidence. [1], [2]
- Treat tags as discoverable pointers; resolve and verify the digest before promotion or rollback. [1], [2]

### PRN-000074 — Keep the image contract narrow

Limit an image to the workload’s required runtime content and defaults, and supply deployment-specific configuration and secrets outside it. [1], [3], [4]

#### Why

Images package filesystem layers and execution configuration as one portable artifact. Extra services and components enlarge the vulnerability and maintenance surface, while embedded credentials expose secrets to anyone who can inspect the image. [1], [3], [4]

#### Practices

- Build the final image from reviewed runtime components, excluding credentials and any service or utility the workload does not need. [3], [4]
- Declare the entry point and runtime requirements explicitly, then inject environment configuration and secrets through the deployment system. [1], [4]

## References

1. [The OpenContainers Image Spec][1] — `SRC-000061`
2. [SLSA v1.2 — Provenance][2] — `SRC-000019`
3. [NIST SP 800-218, Secure Software Development Framework Version 1.1][3] — `SRC-000014`
4. [NIST SP 800-190, Application Container Security Guide][4] — `SRC-000070`

[1]: https://specs.opencontainers.org/image-spec/
[2]: https://slsa.dev/spec/v1.2/provenance
[3]: https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-218.pdf
[4]: https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-190.pdf
