---
schema_version: 5
id: devops.change-management
title: DevOps Change Management
domain: devops
type: subdomain
subdomain: change-management
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 6451b2eb9636fccbdf56f84c1f48c4a6561027b5eebf40642b543fc279194ab2
---

# DevOps Change Management

This scope covers authorization, evidence, risk treatment, traceability, and recovery for changes to live services.

## Principles

### PRN-000097 — Match control to change risk

Use peer review and automated evidence for routine changes, and add independent approval only where impact, uncertainty, or obligation justifies it. [1]

#### Why

Heavy external approval adds delay without inherently lowering failure rates. Controls are more effective when they detect problems early and scale with the actual risk while still preserving required segregation and authorization evidence. [1]

#### Practices

- Classify change types by potential impact, reversibility, novelty, and compliance requirements. [1]
- Preauthorize low-risk standard changes that pass defined review, test, security, and deployment controls. [1]

### PRN-000098 — Make every production change traceable and reversible

Link each live change to its intent, reviewed inputs, actor, artifact, execution evidence, observed outcome, and recovery path. [2], [3]

#### Why

Small, intentional releases narrow the search and blast radius when behavior changes. Traceability connects symptoms to the exact intervention, while a prepared reversal shortens mitigation without inventing a new change under pressure. [2], [3]

#### Practices

- Record who or what changed production, when, from which reviewed revision, and with what result. [3]
- Define rollback, roll-forward, or compensating action before execution, and test it in proportion to impact. [2], [3]

### PRN-000105 — Retire systems as a controlled migration

Retire a service or digital asset through an owned plan that accounts for users, dependencies, data, replacement paths, and verification after removal. [4], [5]

#### Why

An apparently unused system may still carry hidden traffic, data obligations, or downstream dependencies. Keeping it indefinitely preserves cost and attack surface, while deleting it without discovery, communication, and recovery planning can interrupt users or destroy needed information. [4], [5]

#### Practices

- Confirm the asset’s purpose, consumers, data, associated components, and downstream effects, and observe a meaningful period of inactivity before irreversible removal. [4]
- Notify affected users and owners, provide any replacement or migration path, and preserve a tested rollback or archive for the agreed retention interval. [4], [5]
- Revoke obsolete access, sanitize or retain data according to policy, update inventories, and monitor for delayed effects after decommissioning. [4]

#### Applicability

Notice periods, archival evidence, data transfer, sanitization, and rollback duration depend on user commitments, information sensitivity, regulation, and whether a replacement service exists. Make those obligations explicit in the retirement plan. [4], [5]

## References

1. [DORA | Capabilities: Streamlining change approval][1] — `SRC-000042`
2. [DORA | Capabilities: Working in small batches][2] — `SRC-000039`
3. [Release Engineering][3] — `SRC-000047`
4. [Decommissioning assets][4] — `SRC-000075`
5. [Retiring your service][5] — `SRC-000076`

[1]: https://dora.dev/capabilities/streamlining-change-approval/
[2]: https://dora.dev/capabilities/working-in-small-batches/
[3]: https://sre.google/sre-book/release-engineering/
[4]: https://www.ncsc.gov.uk/guidance/decommissioning-assets
[5]: https://www.gov.uk/service-manual/agile-delivery/retiring-your-service
