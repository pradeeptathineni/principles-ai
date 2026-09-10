---
schema_version: 5
id: artificial-intelligence.security-privacy
title: Artificial Intelligence Security & Privacy
domain: artificial-intelligence
type: subdomain
subdomain: security-privacy
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Security & Privacy

Guidance for protecting AI systems and the people and information they affect.

## Principles

### PRN-000139 — Threat-model the entire AI lifecycle

Analyze adversaries, assets, trust boundaries, and attack paths across data, models, prompts, retrieval, tools, infrastructure, interfaces, suppliers, and feedback loops. [1], [2]

#### Why

AI systems add attack surfaces such as poisoning, evasion, extraction, prompt injection, and model or data supply-chain compromise that cross conventional component boundaries. [1], [2]

#### Practices

- Revisit the threat model when capabilities, data flows, integrations, permissions, deployment exposure, or attacker incentives change. [1], [2]
- Test both AI-specific attacks and ordinary software abuse, including composed attacks that move from untrusted content to privileged actions. [1], [2]

### PRN-000140 — Minimize and isolate authority

Grant every model, pipeline, user, and tool the least data and action access needed, with strong isolation and independently enforced policy boundaries. [1], [2]

#### Why

Models cannot reliably distinguish benign from adversarial instructions, so unrestricted credentials or shared trust can convert content manipulation into disclosure or system compromise. [1], [2]

#### Practices

- Separate control instructions from untrusted data, scope credentials to the task and duration, and require authorization outside the model for consequential actions. [1], [2]
- Verify provenance and integrity for datasets, models, adapters, code, containers, and other artifacts before use or promotion. [1]

### PRN-000141 — Treat privacy as a data-flow constraint

Minimize personal and sensitive data throughout collection, training, evaluation, prompting, logging, retrieval, output, and retention, and test for unintended disclosure. [1], [2]

#### Why

AI systems can expose information through memorization, inference, logs, generated outputs, or overbroad retrieval even when the original collection was authorized. [1], [2]

#### Practices

- Record purpose, lawful or authorized basis, access, retention, deletion, and downstream-use constraints for sensitive data. [1]
- Use representative privacy attacks and leakage tests, then restrict, transform, or exclude data when mitigations do not reduce exposure to tolerance. [1], [2]

## References

1. [NIST SP 800-218A, Secure Software Development Practices for Generative AI and Dual-Use Foundation Models][1] — `SRC-000079`
2. [Adversarial Machine Learning: A Taxonomy and Terminology of Attacks and Mitigations][2] — `SRC-000080`

[1]: https://doi.org/10.6028/NIST.SP.800-218A
[2]: https://csrc.nist.gov/pubs/ai/100/2/e2025/final
