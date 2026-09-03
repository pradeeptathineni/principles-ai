---
schema_version: 5
id: devops.security
title: DevOps Security
domain: devops
type: subdomain
subdomain: security
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 64ed309d742147d860e1fce47fec04aaeeea462b8b99f50ac582773567978c6a
---

# DevOps Security

This scope covers security controls embedded in delivery systems, runtime operations, identities, and software supply chains.

## Principles

### PRN-000081 — Make security part of the delivery path

Integrate risk-based security requirements, verification, and remediation into the same workflow that builds and releases change. [1]

#### Why

Security defects become more expensive and disruptive when discovered after release. The SSDF places preparation, software protection, secure production, and vulnerability response across the development lifecycle rather than in a separate final inspection. [1]

#### Practices

- Derive automated and human checks from the workload’s threats, data, dependencies, and assurance requirements. [1]
- Block or escalate findings by defined severity and exploitability, with owned remediation and documented exceptions. [1]

### PRN-000082 — Verify every privileged handoff

Before a delivery step changes protected state, authenticate its actor, authorize only the required action, and verify the artifact and provenance against approved expectations. [2], [3], [4]

#### Why

Delivery pipelines join source, builders, registries, identities, and runtime control planes. Provenance describes how an artifact was produced, while verification binds it to the artifact and tests its builder and inputs against a root of trust; neither network location nor provenance presence alone establishes authorization. [2], [3], [4]

#### Practices

- Use workload identities and narrowly scoped, dynamically evaluated permissions for build and deployment steps. [3]
- Verify that the provenance subject matches the artifact digest, its signature and builder identity are trusted, and its source and external build parameters match approved expectations. [4]

## References

1. [NIST SP 800-218, Secure Software Development Framework Version 1.1][1] — `SRC-000014`
2. [SLSA v1.2 — Provenance][2] — `SRC-000019`
3. [NIST SP 800-207, Zero Trust Architecture][3] — `SRC-000055`
4. [SLSA v1.2 — Verifying artifacts][4] — `SRC-000069`

[1]: https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-218.pdf
[2]: https://slsa.dev/spec/v1.2/provenance
[3]: https://www.nist.gov/publications/zero-trust-architecture
[4]: https://slsa.dev/spec/v1.2/verifying-artifacts
