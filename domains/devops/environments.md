---
schema_version: 5
id: devops.environments
title: DevOps Environments
domain: devops
type: subdomain
subdomain: environments
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: e86f6005b0728d63f11f52638f9fd2cf877406e04471d5a7e75a692dbe4a37d0
---

# DevOps Environments

This scope covers reproducible places where software is built, tested, staged, and operated with controlled differences.

## Principles

### PRN-000095 — Make environment differences explicit

Keep test and production environments alike in the behaviors a test is meant to exercise, and make every intentional difference explicit. [1]

#### Why

Undocumented differences weaken test evidence and make failures hard to interpret. Exact parity is neither always possible nor sufficient; the useful target is fidelity in the dependencies, controls, scale, and deployment behavior under test. [1]

#### Practices

- Inventory differences in topology, dependencies, identity, policy, data, scale, and failure behavior that can affect the test purpose. [1]
- Use the same deployment procedure across environments and express necessary differences as reviewed configuration. [1]

### PRN-000096 — Recreate environments from authoritative records

Make non-production and recovery environments disposable and reproducible from versioned infrastructure, configuration, data preparation, and deployment definitions. [1], [2]

#### Why

Long-lived environments drift and preserve hidden setup knowledge. Automated recreation turns setup into a testable contract, shortens access delays, and supports deterministic recovery when an environment is lost. [1], [2]

#### Practices

- Provision routine test environments on demand from version-controlled definitions with bounded lifetimes. [1], [2]
- Seed representative, privacy-safe data and verify critical dependency behavior rather than claiming production parity from topology alone. [1]

## References

1. [DORA | Capabilities: Deployment automation][1] — `SRC-000040`
2. [DORA | Capabilities: Flexible infrastructure][2] — `SRC-000045`

[1]: https://dora.dev/capabilities/deployment-automation/
[2]: https://dora.dev/capabilities/flexible-infrastructure/
