---
schema_version: 5
id: devops.software-delivery
title: DevOps Software Delivery
domain: devops
type: subdomain
subdomain: software-delivery
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 924d2699b53937d67dcc50c85f7dc08d0b93246008f968b8f12f066d572e0389
---

# DevOps Software Delivery

This scope covers the flow, release, and production verification of software changes after they are integrated.

## Principles

### PRN-000071 — Deliver in independently reversible increments

Shape changes so each increment can be tested, released, observed, and reversed without waiting for a larger batch. [1], [2]

#### Why

Smaller batches shorten feedback and narrow the cause and impact of failure. They remain valuable only when downstream testing and release preserve the boundary instead of recombining increments into a risky release train. [1]

#### Practices

- Decouple incomplete features from exposure with compatible interfaces or controlled feature activation. [1]
- Keep schema, configuration, and application changes compatible across the deployment and rollback interval. [2]

### PRN-000072 — Observe a release before expanding it

Increase exposure progressively and use defined service signals to continue, pause, or reverse the release. [2], [3]

#### Why

Pre-release tests cannot represent every production interaction. Canarying limits initial exposure and compares real behavior, while an automated rollback path reduces recovery time when evidence shows harm. [2], [3]

#### Practices

- Start with a representative, bounded population and compare user-facing health against a suitable baseline. [2], [3]
- Define abort and rollback conditions before the rollout begins, and retain the last known-good artifact. [2]

#### Applicability

Progressive exposure provides useful evidence only when the initial population and observation window can reveal the relevant failure. Low-volume, delayed-effect, or irreversible changes need additional rehearsal, synthetic checks, or explicit controls rather than a nominal canary. [2], [3]

### PRN-000104 — Earn operational acceptance before launch

Before a service or major capability enters ongoing ownership, verify that its people, procedures, telemetry, capacity, security, recovery, and support arrangements are ready for expected operation and failure. [4]

#### Why

An operational readiness review brings cross-functional requirements and lessons from prior failures into one inspectable decision before general availability. It reveals workloads that can be deployed but cannot yet be monitored, supported, recovered, or governed safely. [4]

#### Practices

- Build the readiness review with development, operations, security, and other accountable stakeholders, using evidence appropriate to the workload rather than an inherited checklist alone. [4]
- Resolve each material gap before launch or record an accountable mitigation and acceptance, then repeat the review after consequential changes or observed drift. [4]

#### Applicability

Use a full review for new services and consequential changes in architecture or ownership. Turn stable recurring requirements into tested defaults or automated guardrails so readiness does not become a manual approval ritual for every routine release. [4]

## References

1. [DORA | Capabilities: Working in small batches][1] — `SRC-000039`
2. [Release Engineering][2] — `SRC-000047`
3. [Service Level Objectives][3] — `SRC-000022`
4. [OPS07-BP02 Ensure a consistent review of operational readiness][4] — `SRC-000072`

[1]: https://dora.dev/capabilities/working-in-small-batches/
[2]: https://sre.google/sre-book/release-engineering/
[3]: https://sre.google/sre-book/service-level-objectives/
[4]: https://docs.aws.amazon.com/wellarchitected/latest/framework/ops_ready_to_support_const_orr.html
