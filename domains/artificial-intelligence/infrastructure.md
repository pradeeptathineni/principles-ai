---
schema_version: 5
id: artificial-intelligence.infrastructure
title: Artificial Intelligence Infrastructure
domain: artificial-intelligence
type: subdomain
subdomain: infrastructure
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Infrastructure

Guidance for operating the compute, storage, network, scheduling, and serving foundations of AI systems.

## Principles

### PRN-000146 — Isolate learned components behind stable boundaries

Separate models and data-dependent pipelines from application logic through versioned interfaces, explicit resource contracts, and independently testable serving layers. [1], [2]

#### Why

Entanglement between learned behavior and surrounding systems creates hidden dependencies, brittle changes, and correction cascades that make capacity and failure difficult to reason about. [1], [2]

#### Practices

- Define input, output, timeout, batching, accelerator, memory, storage, and failure contracts for every training and serving component. [1], [2]
- Test infrastructure without the production model and models against realistic infrastructure substitutes so ownership and faults can be localized. [1]

### PRN-000147 — Plan capacity for failure and portability

Size and isolate infrastructure for representative peaks, degraded dependencies, recovery, and supplier or hardware changes rather than for average demand alone. [3], [4]

#### Why

AI workloads can combine large artifacts, bursty accelerators, shared schedulers, and long provisioning times, so contention or platform concentration can turn demand shifts into broad service failure. [1], [3], [4]

#### Practices

- Load-test concurrency, queues, cold starts, failover, artifact distribution, storage throughput, and recovery under constrained accelerator capacity. [4], [5]
- Preserve reproducible artifacts and deployment specifications, document hardware-specific behavior, and rehearse migration or reduced-capability operation. [1], [2]

## References

1. [Hidden Technical Debt in Machine Learning Systems][1] — `SRC-000086`
2. [NIST SP 800-218A, Secure Software Development Practices for Generative AI and Dual-Use Foundation Models][2] — `SRC-000079`
3. [Resiliency, and the components of reliability][3] — `SRC-000064`
4. [Addressing Cascading Failures][4] — `SRC-000067`
5. [MLPerf Inference Benchmark Suite][5] — `SRC-000095`

[1]: https://research.google/pubs/hidden-technical-debt-in-machine-learning-systems/
[2]: https://doi.org/10.6028/NIST.SP.800-218A
[3]: https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/resiliency-and-the-components-of-reliability.html
[4]: https://sre.google/sre-book/addressing-cascading-failures/
[5]: https://docs.mlcommons.org/inference/index_gh/
