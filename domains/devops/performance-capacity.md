---
schema_version: 5
id: devops.performance-capacity
title: DevOps Performance & Capacity
domain: devops
type: subdomain
subdomain: performance-capacity
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: e5ab18b8ead126051b28698e53ea0c327f76c54b4c63f21890daf3749c63c287
---

# DevOps Performance & Capacity

This scope covers measurable workload performance, demand, resource efficiency, headroom, and overload limits.

## Principles

### PRN-000091 — Measure performance against workload outcomes

Define user-relevant performance indicators and benchmark or load-test the architecture with representative demand before changing capacity. [1], [2]

#### Why

Resource counts do not reveal delivered capacity, and historical ratios decay as software and traffic change. Workload metrics and controlled tests connect architecture choices to latency, throughput, errors, and resource use at the relevant load. [1], [2]

#### Practices

- Establish latency distributions, throughput, error, and saturation targets for representative user journeys. [1]
- Test steady state, expected peaks, and the failure boundary; record the demand-to-resource curve rather than one maximum number. [1], [2]

### PRN-000092 — Provision ahead of the demand horizon

Forecast demand beyond provisioning lead time and reserve tested headroom for expected peaks and tolerated resource loss. [2]

#### Why

Capacity arrives after a delay and usable capacity changes with software efficiency, dependencies, and traffic shape. Forecasts tied to measured service capacity make shortfall risk and the cost of headroom visible before demand arrives. [2]

#### Practices

- Include organic growth, launches, seasonality, dependency limits, and failure scenarios in the forecast. [2]
- Recalculate headroom when the workload, software efficiency, service objective, or provisioning lead time changes. [2]

## References

1. [Performance Efficiency Pillar][1] — `SRC-000065`
2. [Addressing Cascading Failures][2] — `SRC-000067`

[1]: https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/welcome.html
[2]: https://sre.google/sre-book/addressing-cascading-failures/
