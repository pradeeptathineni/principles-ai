---
schema_version: 5
id: artificial-intelligence.safety
title: Artificial Intelligence Safety
domain: artificial-intelligence
type: subdomain
subdomain: safety
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Safety

Guidance for preventing and limiting AI-enabled harm to people, society, and the environment.

## Principles

### PRN-000137 — Lead with hazards and affected people

Identify who or what can be harmed, through which system behaviors and use conditions, before choosing safeguards or declaring a system safe enough. [1], [2], [3]

#### Why

Harm emerges from the interaction of capabilities, users, institutions, environments, and misuse—not from a model in isolation—and its severity and distribution can differ across groups. [1], [2], [3]

#### Practices

- Maintain a hazard register covering intended use, foreseeable misuse, accidental misuse, interaction effects, vulnerable groups, and environmental impacts. [1], [2]
- Trace each material hazard to preventive, detective, responsive, and recovery controls with an accountable owner and residual-risk decision. [1], [3]

### PRN-000138 — Scale assurance and authority to potential harm

Increase evidence, independence, monitoring, access limits, and human control as consequences become more severe, widespread, difficult to detect, or irreversible. [1], [2], [3]

#### Why

A uniform checklist cannot account for differences in scale, autonomy, exposure, reversibility, or uncertainty, while high-impact deployments require stronger grounds than low-stakes experiments. [1], [3]

#### Practices

- Test abuse, dangerous capabilities, cascading effects, and safeguard bypasses before expanding users, permissions, or deployment scale. [1], [2]
- Stop, restrict, or roll back deployment when residual risk exceeds stated tolerance or required evidence is absent. [1], [3]

## References

1. [Artificial Intelligence Risk Management Framework (AI RMF 1.0)][1] — `SRC-000077`
2. [Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile][2] — `SRC-000078`
3. [Regulation (EU) 2024/1689 — Artificial Intelligence Act][3] — `SRC-000083`

[1]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
[2]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
[3]: https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng
