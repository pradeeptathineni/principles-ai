---
schema_version: 5
id: artificial-intelligence.problem-framing
title: Artificial Intelligence Problem Framing
domain: artificial-intelligence
type: subdomain
subdomain: problem-framing
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Problem Framing

Guidance for deciding whether and how AI should address a real need before technical selection begins.

## Principles

### PRN-000113 — Start with the consequential decision or task

Frame the work around the human decision, task, or outcome to improve, including who benefits and who may bear harm, before framing it as an AI problem. [1], [2]

#### Why

A technically successful model can still fail when its objective is a poor proxy for user value, its context is misunderstood, or its effects fall on unrepresented parties. [1], [2]

#### Practices

- Describe the current workflow, decision rights, pain points, affected groups, and desired change without naming an AI technique. [1], [2]
- Identify feedback loops, incentives, distributional effects, and ways optimization could move the proxy while worsening the real outcome. [1]

### PRN-000114 — Prove that AI is preferable to a simpler alternative

Compare AI with rules, search, conventional software, process redesign, and human service, and choose AI only when its incremental value justifies its uncertainty and lifecycle cost. [2], [3]

#### Why

Simple baselines can deliver much of the value with clearer behavior and lower operational burden, while premature ML adds data, evaluation, and maintenance dependencies. [3]

#### Practices

- Establish a non-AI baseline and quantify the gap the proposed system must close. [3]
- Include acquisition, evaluation, oversight, failure handling, monitoring, and retirement in the comparison—not only prototype accuracy. [1]

### PRN-000115 — Define success and refusal before building

Specify measurable success, unacceptable outcomes, operating boundaries, and conditions for fallback or non-deployment before selecting data or models. [1], [2]

#### Why

Early criteria make later tradeoffs reviewable and reduce the risk that teams redefine success around whatever the system happens to optimize. [1]

#### Practices

- Set task, human-outcome, safety, fairness, reliability, latency, and cost criteria appropriate to the context. [1]
- State what evidence would stop the project, narrow its scope, or require human handling. [1]

## References

1. [Artificial Intelligence Risk Management Framework (AI RMF 1.0)][1] — `SRC-000077`
2. [People + AI Guidebook][2] — `SRC-000089`
3. [Rules of Machine Learning: Best Practices for ML Engineering][3] — `SRC-000084`

[1]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
[2]: https://pair.withgoogle.com/guidebook-v2/chapters
[3]: https://developers.google.com/machine-learning/guides/rules-of-ml
