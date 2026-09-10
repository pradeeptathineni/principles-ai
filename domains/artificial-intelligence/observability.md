---
schema_version: 5
id: artificial-intelligence.observability
title: Artificial Intelligence Observability
domain: artificial-intelligence
type: subdomain
subdomain: observability
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Observability

Guidance for producing actionable evidence about AI behavior in operation.

## Principles

### PRN-000144 — Observe inputs, decisions, and outcomes together

Connect privacy-aware telemetry for inputs, context, versions, outputs, tool actions, system health, user behavior, and downstream outcomes so changes can be explained rather than merely detected. [1], [2]

#### Why

AI failures may originate in data, code, models, prompts, dependencies, interfaces, or feedback loops, and aggregate service metrics alone cannot identify which change caused a quality shift. [1], [2]

#### Practices

- Attach traceable versions and correlation identifiers across ingestion, inference, retrieval, tool use, human review, and outcome measurement. [1], [2]
- Monitor distributions, critical slices, abstentions, overrides, safety events, latency, cost, and business or human outcomes with explicit baselines. [1], [2]

### PRN-000145 — Make telemetry actionable and proportionate

Collect only evidence tied to a decision, control, or investigation, and define owners, thresholds, escalation, and retention before an alert or log is relied upon. [1], [2]

#### Why

Unbounded logging creates privacy, security, and cost exposure, while noisy alerts and ownerless dashboards delay response and can create a false sense of control. [1], [2]

#### Practices

- Minimize or transform sensitive payloads, control access, document sampling, and test whether retained evidence is sufficient for incident reconstruction. [1]
- Regularly exercise alerts and response playbooks, tune them against confirmed incidents, and retire signals that do not change action. [1], [2]

## References

1. [Artificial Intelligence Risk Management Framework (AI RMF 1.0)][1] — `SRC-000077`
2. [The ML Test Score: A Rubric for ML Production Readiness and Technical Debt Reduction][2] — `SRC-000085`

[1]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
[2]: https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/
