---
schema_version: 5
id: devops.principles
title: DevOps Principles
domain: devops
type: principles
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: f7a96e2a509e6284dba8586c2b8ca6db0246d52dfa3877c3bd7a4a481ddbb29c
---

# DevOps Principles

DevOps joins delivery and operations around fast evidence, safe change, and shared responsibility for service outcomes.

## Principles

### PRN-000055 — Shorten every consequential feedback loop

Organize delivery so code, operational, security, and user feedback reaches the people who can act while a change is still small. [1], [2]

#### Why

Small batches and continuous delivery reduce the distance between a decision and evidence about its effect. Delayed or fragmented feedback lets risk accumulate across handoffs, large releases, and diverging assumptions. [1], [2]

#### Practices

- Measure the delay from a consequential decision to build, test, production, security, and user evidence, then shorten the loop with the greatest current risk. [1], [2]
- Make build, test, deployment, telemetry, and customer signals visible to the team that owns the service. [1]

### PRN-000056 — Trade change velocity against explicit reliability

Use user-centered service objectives and observed error-budget consumption to decide when to ship, mitigate, or invest in reliability. [1], [3]

#### Why

Reliability has diminishing returns and change creates both value and risk. A shared objective turns that tension into an inspectable policy instead of allowing either feature pressure or risk aversion to dominate by default. [3]

#### Practices

- Define service-level indicators and objectives around behavior users experience, not only component health. [3]
- Agree in advance how error-budget consumption changes release pace, investigation, and reliability work. [3]

## References

1. [DORA | Capabilities: Continuous delivery][1] — `SRC-000037`
2. [DORA | Capabilities: Working in small batches][2] — `SRC-000039`
3. [Service Level Objectives][3] — `SRC-000022`

[1]: https://dora.dev/capabilities/continuous-delivery/
[2]: https://dora.dev/capabilities/working-in-small-batches/
[3]: https://sre.google/sre-book/service-level-objectives/
