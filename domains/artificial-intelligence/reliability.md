---
schema_version: 5
id: artificial-intelligence.reliability
title: Artificial Intelligence Reliability
domain: artificial-intelligence
type: subdomain
subdomain: reliability
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Reliability

Guidance for maintaining predictable AI service under uncertainty, change, and failure.

## Principles

### PRN-000135 — Design for distributions, not ideal examples

Define the conditions in which an AI system is expected to work, detect departures from them, and test behavior across ordinary variation, edge cases, and plausible shifts. [1], [2]

#### Why

Learned behavior depends on data and context, so apparently stable aggregate performance can deteriorate when inputs, populations, upstream systems, or feedback loops change. [1], [2]

#### Practices

- Specify supported input ranges, abstention conditions, critical slices, dependencies, and minimum quality floors. [1]
- Stress perturbations, missing or delayed dependencies, changing prevalence, unusual combinations, and repeated nondeterministic runs. [1], [2]

### PRN-000136 — Fail in a bounded and recoverable way

Pair uncertain AI behavior with explicit fallbacks, containment, recovery paths, and human escalation proportionate to the consequence of failure. [1], [3]

#### Why

No finite evaluation eliminates residual error, and retries or silent substitutions can amplify a local failure into inconsistent decisions, cascading load, or irreversible harm. [1], [3]

#### Practices

- Prefer abstention, a simpler deterministic path, cached safe results, reduced capability, or human review when required confidence or dependencies are unavailable. [1]
- Test fallback activation, rollback, state reconciliation, retry limits, and recovery objectives as part of normal release readiness. [2], [3]

## References

1. [Artificial Intelligence Risk Management Framework (AI RMF 1.0)][1] — `SRC-000077`
2. [The ML Test Score: A Rubric for ML Production Readiness and Technical Debt Reduction][2] — `SRC-000085`
3. [Addressing Cascading Failures][3] — `SRC-000067`

[1]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
[2]: https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/
[3]: https://sre.google/sre-book/addressing-cascading-failures/
