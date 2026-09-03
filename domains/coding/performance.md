---
schema_version: 5
id: coding.performance
title: Coding Performance
domain: coding
type: subdomain
subdomain: performance
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: c65ae3417a0ae3db15df346c22388c5d8e57e115c642349ec4d9cae5cf461c01
---

# Coding Performance

Performance concerns meeting explicit resource and responsiveness objectives without sacrificing correctness or maintainability blindly.

## Principles

### PRN-000037 — Define performance in user-relevant terms

Express performance goals as measurable behavior for a stated workload, environment, and observer. [1], [2]

#### Why

“Fast” has no stable meaning without a quantity and context. Latency, throughput, memory, energy, and cost can trade off, and server-side averages may conceal the experience or constraint that matters. [1], [2]

#### Practices

- Define the metric, population, percentile or aggregation, workload shape, environment, and target before optimizing. [1]
- Measure at the boundary experienced by the relevant user or downstream system when internal measurements can omit material delay. [1]

### PRN-000038 — Profile before changing the design

Locate the dominant resource cost with representative measurements before choosing an optimization. [1], [2]

#### Why

Intuition about bottlenecks is often incomplete, and an optimization can move cost elsewhere or improve an unimportant path. Profiles and controlled benchmarks turn the proposed change into a testable hypothesis. [1], [2]

#### Practices

- Capture a repeatable baseline and inspect distributions, saturation, and resource attribution rather than relying only on averages. [1]
- Change one suspected bottleneck at a time, then compare against the same workload and verify correctness. [1], [2]

### PRN-000039 — Spend complexity only for measured value

Add performance-related complexity only when a measured, user-relevant objective justifies its tradeoffs. [1], [2]

#### Why

An optimization should be evaluated against the objective it is meant to improve. Because performance interacts with other software qualities, a faster local result is not automatically a better system. [1], [2]

#### Practices

- Compare before and after under a representative workload, recording which objective improves and which quality tradeoffs are accepted. [1], [2]

#### Applicability

When no measured bottleneck violates an objective, retain the simpler design. A hard constraint can justify necessary complexity, but its benefit and effects still need evaluation. [1], [2]

## References

1. [Service Level Objectives][1] — `SRC-000022`
2. [Guide to the Software Engineering Body of Knowledge (SWEBOK Guide), Version 4.0a][2] — `SRC-000001`

[1]: https://sre.google/sre-book/service-level-objectives/
[2]: https://ieeecs-media.computer.org/media/education/swebok/swebok-v4.pdf
