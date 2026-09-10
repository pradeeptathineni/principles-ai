---
schema_version: 5
id: artificial-intelligence.research-experimentation
title: Artificial Intelligence Research & Experimentation
domain: artificial-intelligence
type: subdomain
subdomain: research-experimentation
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Research & Experimentation

Guidance for turning AI exploration into reproducible, decision-relevant evidence.

## Principles

### PRN-000155 — Make experiments answer a decision

State the hypothesis, decision, baseline, intervention, measures, population, and stopping rule before interpreting an AI experiment. [1], [2]

#### Why

Flexible metrics, changing baselines, and repeated trial selection can turn noise or implementation artifacts into apparent improvement without showing that the result matters or generalizes. [1], [2]

#### Practices

- Compare against the simplest credible baseline and isolate one material change when feasible, using controls, ablations, and repeated runs appropriate to the uncertainty. [1], [2]
- Predefine primary measures and minimum meaningful effects, then separate exploratory findings from confirmatory evidence. [1]

### PRN-000156 — Preserve enough context to reproduce and challenge results

Record data, code, environments, model and prompt versions, parameters, seeds where relevant, evaluation procedures, failures, and resource use with every consequential result. [1], [2]

#### Why

AI results can depend on undocumented implementation and data choices, and selective reporting of successful runs prevents others from detecting fragility or learning from negative evidence. [1]

#### Practices

- Package executable artifacts or precise reconstruction instructions and verify reproduction outside the original working state. [1]
- Retain negative and null results, deviations from plan, uncertainty, and known limitations, and require stronger independent evidence before production claims. [1], [2]

## References

1. [Improving Reproducibility in Machine Learning Research][1] — `SRC-000097`
2. [Rules of Machine Learning: Best Practices for ML Engineering][2] — `SRC-000084`

[1]: https://www.jmlr.org/papers/v22/20-303.html
[2]: https://developers.google.com/machine-learning/guides/rules-of-ml
