---
schema_version: 5
id: artificial-intelligence.context-rag
title: Artificial Intelligence Context & RAG
domain: artificial-intelligence
type: subdomain
subdomain: context-rag
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Context & RAG

Guidance for supplying current, relevant, authorized knowledge to models at runtime.

## Principles

### PRN-000127 — Evaluate retrieval and generation as one system

Measure whether the complete pipeline finds the right evidence, preserves it through context assembly, and produces a supported answer rather than evaluating retrieval or generation alone. [1], [2]

#### Why

Retrieval-augmented generation combines parametric and external memory, so failures may arise from ingestion, indexing, query formulation, ranking, context limits, or unsupported generation. [1]

#### Practices

- Maintain separate retrieval, context-faithfulness, answer-quality, abstention, latency, and cost measures plus end-to-end cases. [1], [2]
- Test multi-document conflicts, missing evidence, stale content, rare queries, and cases where retrieval should return nothing. [2]

### PRN-000128 — Preserve provenance, freshness, and authorization

Carry source identity, version, access policy, and retrieval time into context and outputs so users and controls can judge what grounded each response. [1], [2]

#### Why

External memory can improve specificity and updateability, but it also introduces changing, permissioned, and potentially adversarial dependencies. [1], [2]

#### Practices

- Enforce access before retrieval and again before disclosure; never rely on the model to hide unauthorized context. [2]
- Make source citations inspectable, expire or re-index stale material, and isolate untrusted retrieved text from governing instructions. [1], [2]

## References

1. [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks][1] — `SRC-000090`
2. [Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile][2] — `SRC-000078`

[1]: https://arxiv.org/abs/2005.11401
[2]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
