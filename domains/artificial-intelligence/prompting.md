---
schema_version: 5
id: artificial-intelligence.prompting
title: Artificial Intelligence Prompting
domain: artificial-intelligence
type: subdomain
subdomain: prompting
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Prompting

Guidance for treating inference-time instructions as tested behavioral interfaces.

## Principles

### PRN-000125 — Treat prompts as versioned program inputs

Review, test, version, and deploy prompts with the same change discipline as other behavior-shaping configuration. [1], [2]

#### Why

Prompt wording, examples, ordering, context, and model version can materially change outputs, while technique effectiveness varies by task and model. [1]

#### Practices

- Store prompts, templates, examples, output schemas, model settings, and evaluation results together under change control. [1]
- Compare changes on representative and adversarial cases; do not approve them from a few persuasive examples. [1], [2]

### PRN-000126 — Separate instructions from untrusted content

Preserve explicit trust boundaries between governing instructions, user input, retrieved material, tool results, and prior model output, and assume lower-trust content may attempt to redirect behavior. [2], [3]

#### Why

Generative systems can interpret data as instructions, enabling prompt injection and related attacks when untrusted content reaches privileged model or tool contexts. [2], [3]

#### Practices

- Label and delimit content by source and trust level, minimize privileged context, and enforce sensitive rules outside the model. [2], [3]
- Validate structured outputs and authorize resulting actions independently rather than trusting compliance with the prompt. [2]

## References

1. [The Prompt Report: A Systematic Survey of Prompting Techniques][1] — `SRC-000091`
2. [Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile][2] — `SRC-000078`
3. [Adversarial Machine Learning: A Taxonomy and Terminology of Attacks and Mitigations][3] — `SRC-000080`

[1]: https://arxiv.org/abs/2406.06608
[2]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
[3]: https://csrc.nist.gov/pubs/ai/100/2/e2025/final
