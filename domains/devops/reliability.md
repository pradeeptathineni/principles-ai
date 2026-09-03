---
schema_version: 5
id: devops.reliability
title: DevOps Reliability
domain: devops
type: subdomain
subdomain: reliability
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 997256d3fe9aab78746ef327e38acb2391b770174689b42df117c56103103095
---

# DevOps Reliability

This scope covers explicit service expectations and engineering choices that keep workloads useful through change and failure.

## Principles

### PRN-000085 — Define reliability from the user outward

Specify service-level indicators and objectives for the behavior users depend on, grounded in user and business needs rather than component availability alone. [1]

#### Why

Component availability can look healthy while a user journey fails. A user-centered objective creates a shared expectation and makes both accepted unreliability and the cost of further improvement visible. [1]

#### Practices

- Choose a small set of indicators that directly represent successful service outcomes and measure them at the closest credible boundary. [1]
- Set targets from user and business needs, review them with stakeholders, and revisit them when usage or consequences change. [1]

### PRN-000086 — Prefer controlled degradation to collapse

Design overload and dependency failure modes that preserve the most important service within bounded resource use. [2], [3]

#### Why

Resilience includes recovering from disruption and acquiring capacity, but redundancy alone cannot prevent cascading failure. Load shedding, backpressure, and reduced functionality keep excess demand from consuming every remaining resource. [2], [3]

#### Practices

- Rank service functions so optional or expensive work can be disabled before essential work is lost. [3]
- Test overload beyond the planned limit and verify that queues, retries, and failover remain bounded. [3]

## References

1. [Service Level Objectives][1] — `SRC-000022`
2. [Resiliency, and the components of reliability][2] — `SRC-000064`
3. [Addressing Cascading Failures][3] — `SRC-000067`

[1]: https://sre.google/sre-book/service-level-objectives/
[2]: https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/resiliency-and-the-components-of-reliability.html
[3]: https://sre.google/sre-book/addressing-cascading-failures/
