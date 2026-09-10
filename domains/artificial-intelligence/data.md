---
schema_version: 5
id: artificial-intelligence.data
title: Artificial Intelligence Data
domain: artificial-intelligence
type: subdomain
subdomain: data
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Data

Guidance for treating training, evaluation, and operational data as governed, changing system dependencies.

## Principles

### PRN-000116 — Make provenance and permitted use inspectable

Record where data came from, how it was collected and transformed, whose interests it represents, what rights govern it, and which uses and users it supports or excludes. [1], [2]

#### Why

Data origin, collection, annotation, intended use, and evolution shape model behavior and determine whether downstream use is responsible and informed. [1]

#### Practices

- Maintain versioned data documentation covering sources, consent or authority, licenses, collection and labeling methods, known gaps, and retention. [1], [2]
- Propagate lineage and usage restrictions into derived datasets, features, checkpoints, and downstream products. [2]

### PRN-000117 — Design data for the deployment distribution

Build training and evaluation data around the intended population, environment, time horizon, and edge conditions, and keep evaluation evidence independent of model fitting. [2], [3]

#### Why

Unrepresentative data, leakage, and train-serving differences can create convincing offline results that do not survive real use or that hide unequal failure. [2], [3]

#### Practices

- Define units of independence and split by time, entity, or context where random splitting would leak information. [3]
- Measure coverage and performance for consequential subgroups and rare conditions rather than relying only on aggregate balance. [2]

### PRN-000118 — Treat data quality as a monitored contract

Define and continuously check data schemas, semantics, freshness, coverage, and distribution at collection, transformation, training, and serving boundaries. [2], [3]

#### Why

Data dependencies can fail silently or change meaning while pipelines continue running, causing gradual or localized degradation that ordinary availability checks miss. [3]

#### Practices

- Validate ranges, missingness, cardinality, joins, label delays, duplication, and training-serving consistency before promotion. [3]
- Alert on meaningful distribution or provenance changes and require review before silently adapting the system to them. [2], [3]

## References

1. [Data Cards: Purposeful and Transparent Dataset Documentation for Responsible AI][1] — `SRC-000088`
2. [Artificial Intelligence Risk Management Framework (AI RMF 1.0)][2] — `SRC-000077`
3. [Rules of Machine Learning: Best Practices for ML Engineering][3] — `SRC-000084`

[1]: https://research.google/pubs/data-cards-purposeful-and-transparent-dataset-documentation-for-responsible-ai/
[2]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
[3]: https://developers.google.com/machine-learning/guides/rules-of-ml
