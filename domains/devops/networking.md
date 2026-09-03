---
schema_version: 5
id: devops.networking
title: DevOps Networking
domain: devops
type: subdomain
subdomain: networking
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: d40178873b71dcb99571bf610ae5ee2a5ea2ec4c6f8af8fa8c7d70bf91bb3197
---

# DevOps Networking

This scope covers connectivity, traffic policy, and failure behavior among users, services, and infrastructure.

## Principles

### PRN-000079 — Authorize connections by identity and purpose

Grant network access to authenticated subjects for specific resources and actions; do not infer trust from location alone. [1]

#### Why

Cloud, remote, and shared environments dissolve a dependable perimeter. Resource-centered authorization and explicit communication policy limit lateral movement and make permitted dependencies reviewable. [1]

#### Practices

- Default to no application connectivity, then allow the minimum required ingress and egress for named identities and ports. [1]
- Reevaluate authorization using current subject, device, workload, and resource context rather than a one-time network placement. [1]

### PRN-000080 — Bound failure amplification at every call

Give remote calls finite timeouts, bounded retries with backoff and jitter, and overload behavior that protects the whole service. [2]

#### Why

Retries, queues, and failover can turn a partial network or dependency failure into excess work on surviving capacity. Explicit budgets and load shedding keep recovery traffic from becoming the next outage. [2]

#### Practices

- Set connection and request deadlines from the caller’s end-to-end budget, not a library default. [2]
- Cap retries, apply exponential backoff with jitter, and shed or degrade work when total demand exceeds safe capacity. [2]

#### Applicability

Retry only failures classified as transient, and enforce the budget across layers rather than independently at each call site. Permanent errors, malformed requests, and overload signals should fail or back off instead of multiplying work. [2]

## References

1. [NIST SP 800-207, Zero Trust Architecture][1] — `SRC-000055`
2. [Addressing Cascading Failures][2] — `SRC-000067`

[1]: https://www.nist.gov/publications/zero-trust-architecture
[2]: https://sre.google/sre-book/addressing-cascading-failures/
