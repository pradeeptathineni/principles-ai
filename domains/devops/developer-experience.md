---
schema_version: 5
id: devops.developer-experience
title: DevOps Developer Experience
domain: devops
type: subdomain
subdomain: developer-experience
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: bbfa4751b9f32f1529ae8e1a90e88ef6c0b48e60147ad877c46f78935e7f9c7c
---

# DevOps Developer Experience

This scope covers the internal products and working conditions that help developers deliver and operate software safely.

## Principles

### PRN-000099 — Treat the platform as an internal product

Design shared delivery and operational capabilities around developer tasks, research their friction, and assign a team to evolve the experience. [1], [2]

#### Why

A platform creates value when it removes cognitive and coordination load for its users, not when it merely centralizes infrastructure. User-centered product work and stable priorities support productivity, quality, and well-being. [1], [2]

#### Practices

- Observe how developers build, test, deploy, diagnose, and recover; prioritize the delays and error-prone handoffs that recur. [1], [2]
- Publish ownership, support, reliability expectations, and a roadmap for each shared capability. [1]

### PRN-000100 — Offer a safe paved path with room for judgment

Provide self-service defaults that make the secure, reliable route easy, while supporting reviewed exceptions when workload needs differ. [1]

#### Why

Golden paths can reduce repeated work and encode safeguards, but a mandatory abstraction that ignores user needs becomes another bottleneck. Clear feedback and an explicit escape path preserve autonomy without discarding standards. [1]

#### Practices

- Make common workflows discoverable, composable, fast, and explicit about the outcome of each task. [1]
- Measure adoption, task success, wait time, reliability, and exception reasons; improve the path instead of forcing use by policy alone. [1]

## References

1. [DORA | Capabilities: Platform engineering][1] — `SRC-000043`
2. [Accelerate State of DevOps Report 2024][2] — `SRC-000068`

[1]: https://dora.dev/capabilities/platform-engineering/
[2]: https://dora.dev/research/2024/dora-report/2024-dora-accelerate-state-of-devops-report.pdf
