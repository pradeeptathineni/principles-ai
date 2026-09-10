---
schema_version: 5
id: artificial-intelligence.model-selection
title: Artificial Intelligence Model Selection
domain: artificial-intelligence
type: subdomain
subdomain: model-selection
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Model Selection

Guidance for choosing models and providers from evidence tied to the intended system.

## Principles

### PRN-000121 — Select against a use-case scorecard

Compare candidate models against predeclared task quality, safety, security, privacy, latency, throughput, cost, licensing, deployment, and support requirements under representative conditions. [1], [2]

#### Why

Model suitability is multidimensional and contextual, so a leader on a public benchmark may be inferior once system constraints, affected groups, and operational tradeoffs are included. [1], [2]

#### Practices

- Use the same held-out scenarios and acceptance thresholds for every serious candidate, including the incumbent and non-AI baseline. [1]
- Record disqualifying failures and tradeoffs instead of collapsing all evidence into one weighted score. [1]

### PRN-000122 — Preserve the ability to reconsider the choice

Isolate provider- and model-specific behavior behind explicit interfaces, evaluation suites, and migration paths so selection remains reversible as evidence and constraints change. [1], [3]

#### Why

AI models, services, costs, and policies evolve, while tight coupling and undeclared assumptions turn an initial selection into expensive lock-in. [3]

#### Practices

- Keep prompts, schemas, safety controls, and business rules outside provider-specific code where their meaning is portable. [3]
- Re-run the scorecard on material model, provider, workload, price, or policy changes before promotion. [1]

## References

1. [Artificial Intelligence Risk Management Framework (AI RMF 1.0)][1] — `SRC-000077`
2. [Model Cards for Model Reporting][2] — `SRC-000087`
3. [Hidden Technical Debt in Machine Learning Systems][3] — `SRC-000086`

[1]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
[2]: https://research.google/pubs/model-cards-for-model-reporting/
[3]: https://research.google/pubs/hidden-technical-debt-in-machine-learning-systems/
