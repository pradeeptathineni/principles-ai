---
schema_version: 5
id: artificial-intelligence.principles
title: Artificial Intelligence Principles
domain: artificial-intelligence
type: principles
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Principles

Highest-order guidance for deciding, building, and governing AI systems across their lifecycle.

## Principles

### PRN-000106 — Let context determine what good means

Define AI quality, trustworthiness, and acceptable risk from the people, purpose, environment, and consequences of the specific use—not from a universal capability score. [1], [2]

#### Why

AI risks and benefits vary with affected parties, deployment context, system role, and impact; the same model can therefore be suitable in one setting and unacceptable in another. [1], [2]

#### Practices

- Record intended use, affected groups, foreseeable misuse, constraints, and unacceptable outcomes before selecting a technical approach. [1]
- Translate stakeholder needs into measurable task, system, human-outcome, safety, and operational criteria with explicit tradeoffs. [1], [2]

### PRN-000107 — Engineer the whole sociotechnical system

Treat data, models, prompts, retrieval, software, infrastructure, operators, users, governance, and feedback loops as one evolving system whose interactions determine outcomes. [1], [3]

#### Why

Model behavior alone cannot establish system trustworthiness because risks emerge across lifecycle stages, human roles, external dependencies, and the environment of use. [1]

#### Practices

- Assign owners and interfaces for every consequential component and handoff, including acquired models and downstream use. [1], [3]
- Evaluate end-to-end behavior under representative operating conditions whenever a component, policy, or context changes. [1]

### PRN-000108 — Match autonomy to evidence and reversibility

Grant an AI system only the autonomy justified by demonstrated performance, consequence severity, reversibility, observability, and available human control. [1]

#### Why

Uncertain or changing behavior becomes more consequential when a system can act broadly, quickly, or irreversibly without effective detection and intervention. [1]

#### Practices

- Begin with bounded recommendations or reversible actions and expand authority only after representative evidence supports the change. [1]
- Put deterministic limits, approval points, stop mechanisms, and recovery paths around high-impact actions. [1]

### PRN-000109 — Keep accountability human and explicit

Name accountable people and organizational owners for AI decisions, risks, operation, and retirement; never assign responsibility to the model itself. [1], [3]

#### Why

Effective AI risk management depends on defined roles, executive responsibility, traceability, competence, and continual improvement across the system lifecycle. [1], [3]

#### Practices

- Document who may approve, deploy, override, investigate, change, and retire each AI system. [1]
- Give owners the authority, information, training, and resources needed to discharge their responsibilities. [1], [3]

## References

1. [Artificial Intelligence Risk Management Framework (AI RMF 1.0)][1] — `SRC-000077`
2. [OECD Framework for the Classification of AI Systems][2] — `SRC-000081`
3. [ISO/IEC 42001:2023 — AI management systems][3] — `SRC-000082`

[1]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
[2]: https://doi.org/10.1787/cb6d9eca-en
[3]: https://www.iso.org/standard/42001
