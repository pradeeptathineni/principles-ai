---
schema_version: 5
id: artificial-intelligence.evaluation
title: Artificial Intelligence Evaluation
domain: artificial-intelligence
type: subdomain
subdomain: evaluation
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Evaluation

Guidance for producing decision-relevant evidence about AI behavior and outcomes.

## Principles

### PRN-000132 — Evaluate the system in its intended context

Test the complete AI system against the tasks, people, environments, consequences, and operating constraints that define its intended use. [1], [2]

#### Why

Component scores can conceal failures introduced by data pipelines, interfaces, automation, human reliance, or deployment conditions, while performance on a generic benchmark may not transfer to a specific use. [1], [2]

#### Practices

- Derive evaluation criteria from documented use cases, affected groups, unacceptable outcomes, and operational service levels. [1]
- Combine task quality, safety, security, fairness, human outcomes, latency, cost, and reliability measures according to the decision at hand. [1], [2]

### PRN-000133 — Separate development feedback from independent evidence

Reserve representative, adversarial, and regression evaluations that are not repeatedly optimized against, and use independent review when consequences warrant it. [1], [2]

#### Why

Reusing evaluation cases for development creates leakage and overfitting, and a single aggregate score can hide subgroup, edge-case, or failure-mode regressions. [1], [2]

#### Practices

- Version datasets and rubrics, document sampling and exclusions, and prevent test examples from entering training, retrieval, or prompt demonstrations. [2], [3]
- Examine distributions and slices, preserve counterexamples, and add confirmed production failures to a governed regression suite. [1], [2]

### PRN-000134 — Make uncertainty and decision thresholds explicit

Report limitations, variability, unresolved failures, and confidence alongside results, and define in advance what evidence permits release, escalation, or rejection. [1], [3]

#### Why

Evaluation is evidence for a decision rather than proof of universal safety or quality; omitted conditions and uncertain estimates determine how far results can be generalized. [1], [3]

#### Practices

- Include confidence intervals or repeated-run variability where meaningful, plus known blind spots and conditions not tested. [1], [3]
- Bind release gates to disaggregated thresholds and risk tolerances, not to an unqualified average or a favorable demonstration. [1]

## References

1. [Artificial Intelligence Risk Management Framework (AI RMF 1.0)][1] — `SRC-000077`
2. [The ML Test Score: A Rubric for ML Production Readiness and Technical Debt Reduction][2] — `SRC-000085`
3. [Model Cards for Model Reporting][3] — `SRC-000087`

[1]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
[2]: https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/
[3]: https://research.google/pubs/model-cards-for-model-reporting/
