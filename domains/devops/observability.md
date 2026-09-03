---
schema_version: 5
id: devops.observability
title: DevOps Observability
domain: devops
type: subdomain
subdomain: observability
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 51345a6a9e900e5d38f17e471758942287534f3f6822728c392ad0842c9ab41b
---

# DevOps Observability

This scope covers telemetry and diagnostic interfaces that reveal service behavior from user outcome through dependencies.

## Principles

### PRN-000083 — Instrument the path a user depends on

Collect correlated signals that connect user-visible requests and outcomes to the services and resources that produced them. [1], [2]

#### Why

Metrics, logs, and traces answer different questions. Common context and service identity let responders move from a symptom to the relevant operation and dependency without reconstructing the request path from isolated data. [1]

#### Practices

- Propagate trace or request context across supported boundaries and attach stable service, operation, version, and environment attributes. [1]
- Measure latency, traffic, errors, and saturation at user-facing and critical dependency boundaries. [2]

### PRN-000084 — Page on actionable symptoms

Alert when user-relevant service behavior requires timely human action, and keep diagnostic detail available for investigation rather than paging on every anomaly. [2], [3]

#### Why

Alerts compete for finite attention. Symptom-based signals tied to service objectives make urgency meaningful, while low-actionability pages train responders to ignore the channel and obscure real incidents. [2], [3]

#### Practices

- Tie paging thresholds to sustained impact or rapid service-objective budget consumption. [2], [3]
- Give every page an owner, concise meaning, initial diagnostic path, and tested escalation route. [2]

## References

1. [Observability primer][1] — `SRC-000063`
2. [Monitoring Distributed Systems][2] — `SRC-000048`
3. [Service Level Objectives][3] — `SRC-000022`

[1]: https://opentelemetry.io/docs/concepts/observability-primer/
[2]: https://sre.google/sre-book/monitoring-distributed-systems/
[3]: https://sre.google/sre-book/service-level-objectives/
