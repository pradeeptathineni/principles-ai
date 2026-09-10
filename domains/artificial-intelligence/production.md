---
schema_version: 5
id: artificial-intelligence.production
title: Artificial Intelligence Production
domain: artificial-intelligence
type: subdomain
subdomain: production
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Production

Guidance for releasing, changing, operating, and retiring AI systems safely.

## Principles

### PRN-000157 — Version the deployable system, not only the model

Bind each release to reproducible versions of data, models, adapters, prompts, retrieval indexes, code, configuration, dependencies, infrastructure, evaluations, and approvals. [1], [2], [3]

#### Why

AI behavior emerges from interacting components, so a model identifier alone cannot explain, reproduce, roll back, or audit the system users actually experienced. [1], [2], [3]

#### Practices

- Produce an immutable release manifest with provenance, integrity checks, compatible interfaces, migration requirements, and retained rollback artifacts. [2], [3]
- Correlate every production decision with the release manifest and preserve lineage through feedback, relabeling, retraining, and redeployment. [1], [2]

### PRN-000158 — Earn exposure through staged release

Expand traffic, users, capabilities, and authority only after predefined evaluation, operational readiness, monitoring, and rollback criteria are met at each stage. [1], [3]

#### Why

Offline tests cannot reproduce every production interaction, while an immediate broad release increases the number of affected people and the difficulty of isolating or reversing a failure. [1], [3]

#### Practices

- Use shadowing, internal trials, canaries, limited cohorts, or reduced authority as appropriate, with protected comparison groups where feasible. [1]
- Automate rollback for clear technical thresholds and define human stop authority for ambiguous quality, safety, security, or impact signals. [1], [3]

### PRN-000159 — Operate the lifecycle through retirement

Assign enduring ownership for monitoring, incidents, changes, feedback, retraining, supplier updates, decommissioning, and retained records before production begins. [1], [2], [4]

#### Why

Production AI changes as data, use, dependencies, and models evolve, and abandoned endpoints, artifacts, credentials, or feedback loops can retain risk after visible use ends. [1], [2]

#### Practices

- Define change classes and the evaluation, approval, communication, and migration each requires, including vendor-initiated changes. [1], [4]
- Retire access, jobs, data flows, credentials, artifacts, and monitoring deliberately while preserving records needed for audit, appeal, incident response, and reproducibility. [2], [4]

## References

1. [The ML Test Score: A Rubric for ML Production Readiness and Technical Debt Reduction][1] — `SRC-000085`
2. [Hidden Technical Debt in Machine Learning Systems][2] — `SRC-000086`
3. [NIST SP 800-218A, Secure Software Development Practices for Generative AI and Dual-Use Foundation Models][3] — `SRC-000079`
4. [ISO/IEC 42001:2023 — AI management systems][4] — `SRC-000082`

[1]: https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/
[2]: https://research.google/pubs/hidden-technical-debt-in-machine-learning-systems/
[3]: https://doi.org/10.6028/NIST.SP.800-218A
[4]: https://www.iso.org/standard/42001
