---
schema_version: 5
id: artificial-intelligence.cost
title: Artificial Intelligence Cost
domain: artificial-intelligence
type: subdomain
subdomain: cost
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Cost

Guidance for governing the lifecycle economics and resource consequences of AI systems.

## Principles

### PRN-000150 — Decide with lifecycle unit economics

Compare AI options using the total cost per useful, acceptable outcome across research, data, training, evaluation, integration, serving, oversight, incidents, change, and retirement. [1], [2]

#### Why

Low prototype or per-call prices can conceal recurring evaluation, infrastructure, human review, vendor, remediation, and maintenance costs, while raw compute spend says nothing about delivered value. [1], [2]

#### Practices

- Model fixed and variable costs under expected, peak, growth, and failure scenarios, including retries, fallbacks, monitoring, and exit costs. [1], [2]
- Track unit cost beside quality and outcome measures, and revisit build, buy, reuse, or stop decisions when either changes. [1]

### PRN-000151 — Put explicit budgets around uncertainty

Bound experimentation and production consumption with staged budgets, usage limits, forecasts, and review points that reflect both financial and environmental consequences. [1], [3]

#### Why

Training searches and high-volume inference can consume substantial energy and money before evidence of value emerges, and scale can multiply small per-request inefficiencies. [2], [3]

#### Practices

- Set separate exploration and operating budgets, terminate low-information experiments early, and retain comparable resource and result records. [3]
- Attribute spend and consumption to an owner, workload, model, version, and outcome, then alert before commitments or usage become difficult to reverse. [1], [2]

## References

1. [FinOps Framework][1] — `SRC-000066`
2. [Rules of Machine Learning: Best Practices for ML Engineering][2] — `SRC-000084`
3. [Energy and Policy Considerations for Deep Learning in NLP][3] — `SRC-000096`

[1]: https://www.finops.org/framework/
[2]: https://developers.google.com/machine-learning/guides/rules-of-ml
[3]: https://arxiv.org/abs/1906.02243
