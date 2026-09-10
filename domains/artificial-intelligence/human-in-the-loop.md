---
schema_version: 5
id: artificial-intelligence.human-in-the-loop
title: Artificial Intelligence Human-in-the-Loop
domain: artificial-intelligence
type: subdomain
subdomain: human-in-the-loop
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Human-in-the-Loop

Guidance for allocating authority and designing meaningful human oversight of AI systems.

## Principles

### PRN-000142 — Allocate authority by consequence and reversibility

Decide which actions AI may recommend, prepare, execute, or never take according to potential harm, uncertainty, detectability, time pressure, and the ability to reverse an error. [1], [2]

#### Why

Human involvement is not inherently protective: it is useful only when the person has suitable authority, information, competence, time, and a realistic way to intervene. [1], [2]

#### Practices

- Define decision rights, escalation triggers, overrides, appeal paths, and accountability for each consequential workflow. [1], [2]
- Require stronger review or multiple controls for high-impact or irreversible actions, and automate low-risk work only within bounded conditions. [1]

### PRN-000143 — Design oversight for calibrated reliance

Give people enough context to judge AI output, communicate material uncertainty and limitations, and measure whether the interaction produces appropriate reliance rather than reflexive trust or rejection. [1], [3]

#### Why

People form mental models from interfaces, explanations, and observed behavior; superficial review prompts can produce automation bias, alert fatigue, or responsibility without effective control. [1], [3]

#### Practices

- Present relevant evidence, alternatives, confidence cues, provenance, and consequences at the point of decision without overwhelming the reviewer. [1], [3]
- Observe overrides, corrections, appeals, response time, and reviewer disagreement, then redesign the division of work when oversight is nominal or burdensome. [1], [3]

## References

1. [Artificial Intelligence Risk Management Framework (AI RMF 1.0)][1] — `SRC-000077`
2. [Regulation (EU) 2024/1689 — Artificial Intelligence Act][2] — `SRC-000083`
3. [People + AI Guidebook][3] — `SRC-000089`

[1]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
[2]: https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng
[3]: https://pair.withgoogle.com/guidebook-v2/chapters
