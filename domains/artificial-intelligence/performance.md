---
schema_version: 5
id: artificial-intelligence.performance
title: Artificial Intelligence Performance
domain: artificial-intelligence
type: subdomain
subdomain: performance
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Performance

Guidance for measuring and improving AI speed, scale, and quality-resource tradeoffs.

## Principles

### PRN-000148 — Optimize within a quality envelope

Treat latency, throughput, concurrency, memory, and energy as constraints on an explicit quality floor rather than as independent wins. [1], [2]

#### Why

Faster hardware, batching, compression, caching, or smaller models can change output quality and failure behavior, while a higher-quality component may be unusable if end-to-end service misses operational needs. [1], [2]

#### Practices

- Report quality and resource measures together for every meaningful configuration, including tail latency and behavior on critical slices. [1]
- Reject optimizations that cross stated quality, safety, reliability, or privacy thresholds even when average speed improves. [2]

### PRN-000149 — Benchmark the end-to-end workload

Measure representative request shapes, data paths, concurrency, hardware, software, and service objectives before selecting or optimizing a bottleneck. [1], [2]

#### Why

Isolated model timing can omit retrieval, preprocessing, queues, transfers, tool calls, post-processing, and cold starts, so it may misidentify both the user-visible constraint and the useful optimization. [1], [2]

#### Practices

- Profile before changing the system and distinguish queueing, compute, memory, storage, network, and dependency time across percentiles. [1]
- Re-run versioned benchmarks after model, data, prompt, infrastructure, compiler, or traffic changes and compare against the same quality criteria. [1], [2]

## References

1. [MLPerf Inference Benchmark Suite][1] — `SRC-000095`
2. [Rules of Machine Learning: Best Practices for ML Engineering][2] — `SRC-000084`

[1]: https://docs.mlcommons.org/inference/index_gh/
[2]: https://developers.google.com/machine-learning/guides/rules-of-ml
