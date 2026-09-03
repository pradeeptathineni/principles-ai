---
schema_version: 5
id: devops.infrastructure
title: DevOps Infrastructure
domain: devops
type: subdomain
subdomain: infrastructure
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: b767e83eef99682d40905cbc075dadbd3996863ba84f679d49d227ccf7ebf668
---

# DevOps Infrastructure

This scope covers the structural resources, dependencies, and failure boundaries on which services run.

## Principles

### PRN-000061 — Design around failure boundaries

Place service capacity and state so the failure of one component, location, or dependency does not exceed the service’s agreed impact. [1], [2]

#### Why

Infrastructure and services fail in correlated as well as isolated ways. Resilience depends on understanding dependencies, distributing critical capacity, and preventing retries or failover from transferring overload into the remaining system. [1], [2]

#### Practices

- Map critical dependencies and the failures they share before choosing redundancy or placement. [1], [2]
- Test loss of a component or location under realistic load, including the capacity and behavior of the surviving path. [2]

### PRN-000062 — Prefer replaceable infrastructure

Provision infrastructure from known configuration so failed, drifted, or obsolete resources can be replaced through the normal change path. [1], [3]

#### Why

Automated, versioned provisioning makes replacement repeatable and reduces dependence on hidden repair history. Replacement is safe only when state and dependencies are separated or recovered deliberately. [1], [3]

#### Practices

- Recreate compute and network resources from reviewed definitions; keep durable state in explicitly protected services. [1], [3]
- Exercise replacement under representative load before relying on it as a recovery mechanism. [1]

#### Applicability

Replacement is the default for stateless or reconstructible resources. Stateful infrastructure requires an explicit durability, migration, and recovery design before the original resource is terminated. [1], [3]

## References

1. [Resiliency, and the components of reliability][1] — `SRC-000064`
2. [Addressing Cascading Failures][2] — `SRC-000067`
3. [DORA | Capabilities: Flexible infrastructure][3] — `SRC-000045`

[1]: https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/resiliency-and-the-components-of-reliability.html
[2]: https://sre.google/sre-book/addressing-cascading-failures/
[3]: https://dora.dev/capabilities/flexible-infrastructure/
