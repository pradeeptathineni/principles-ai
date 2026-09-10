---
schema_version: 5
id: artificial-intelligence.models
title: Artificial Intelligence Models
domain: artificial-intelligence
type: subdomain
subdomain: models
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Models

Guidance for understanding and managing model artifacts as bounded components of AI systems.

## Principles

### PRN-000119 — Document capability with its conditions and limits

Accompany each model with its intended uses, excluded uses, training context, evaluation conditions, subgroup behavior, limitations, and known ethical or operational considerations. [1], [2]

#### Why

Model performance is conditional; documentation helps downstream teams judge whether evidence transfers to their use rather than treating a benchmark as a universal capability claim. [1]

#### Practices

- Version model documentation with the exact artifact and update it when data, training, evaluation, or safeguards change. [1]
- Report disaggregated and stress-condition results that matter to intended users, not only a headline average. [1], [2]

### PRN-000120 — Prefer the simplest model that satisfies the system

Use the least complex model architecture that meets contextual quality, safety, latency, interpretability, and operating requirements. [2], [3]

#### Why

Additional model complexity can slow iteration and amplify coupling, debugging difficulty, resource cost, and hidden dependencies without producing proportional user value. [3], [4]

#### Practices

- Establish a simple model or heuristic baseline before adding capacity, ensembles, or learned dependencies. [3]
- Require each complexity increase to demonstrate a material end-to-end gain against its maintenance and risk cost. [2], [4]

## References

1. [Model Cards for Model Reporting][1] — `SRC-000087`
2. [Artificial Intelligence Risk Management Framework (AI RMF 1.0)][2] — `SRC-000077`
3. [Rules of Machine Learning: Best Practices for ML Engineering][3] — `SRC-000084`
4. [Hidden Technical Debt in Machine Learning Systems][4] — `SRC-000086`

[1]: https://research.google/pubs/model-cards-for-model-reporting/
[2]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
[3]: https://developers.google.com/machine-learning/guides/rules-of-ml
[4]: https://research.google/pubs/hidden-technical-debt-in-machine-learning-systems/
