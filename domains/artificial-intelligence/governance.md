---
schema_version: 5
id: artificial-intelligence.governance
title: Artificial Intelligence Governance
domain: artificial-intelligence
type: subdomain
subdomain: governance
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Governance

Guidance for accountable, proportionate control of AI systems across organizations and lifecycles.

## Principles

### PRN-000152 — Make every AI system and decision accountable

Maintain an inventory of AI systems, components, uses, owners, suppliers, affected parties, and accountable decisions from proposal through retirement. [1], [2]

#### Why

Risks cannot be governed when deployments, dependencies, decision rights, or obligations are unknown, and diffuse participation can leave consequential choices without an owner. [1], [2]

#### Practices

- Assign business, technical, risk, data, security, and operational responsibilities with one named owner for each acceptance or exception decision. [1], [2]
- Link inventory records to intended use, versions, evaluations, impact assessments, incidents, suppliers, approvals, and current operating status. [1]

### PRN-000153 — Govern in proportion to context and impact

Classify systems by purpose, affected parties, autonomy, scale, data, capability, consequence, and applicable obligations, then scale controls and evidence to the resulting risk. [1], [3], [4]

#### Why

AI systems with similar techniques can create very different benefits and harms in different settings, so neither one universal process nor purely model-based classification is adequate. [1], [3], [4]

#### Practices

- Perform impact and risk assessment before deployment and when a material change alters use, exposure, capability, population, supplier, or legal context. [1], [4]
- Document control rationales, residual risk, dissent, exceptions, and the authority and evidence supporting each consequential decision. [1], [2]

### PRN-000154 — Treat governance as an operating loop

Connect policy, evaluation, monitoring, incident response, supplier oversight, change control, and retirement so new evidence can change authority and system state. [1], [2], [4]

#### Why

Models, data, environments, suppliers, laws, and observed impacts evolve after approval, making a one-time review unable to govern the deployed lifecycle. [1], [2]

#### Practices

- Define triggers for re-evaluation, restriction, suspension, disclosure, remediation, and retirement, with tested escalation paths. [1], [2]
- Audit whether controls work in practice, learn from incidents and appeals, and track corrective actions to closure rather than treating documentation as the outcome. [1], [4]

## References

1. [Artificial Intelligence Risk Management Framework (AI RMF 1.0)][1] — `SRC-000077`
2. [ISO/IEC 42001:2023 — AI management systems][2] — `SRC-000082`
3. [OECD Framework for the Classification of AI Systems][3] — `SRC-000081`
4. [Regulation (EU) 2024/1689 — Artificial Intelligence Act][4] — `SRC-000083`

[1]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
[2]: https://www.iso.org/standard/42001
[3]: https://doi.org/10.1787/cb6d9eca-en
[4]: https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng
