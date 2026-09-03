---
schema_version: 5
id: devops.disaster-recovery
title: DevOps Disaster Recovery
domain: devops
type: subdomain
subdomain: disaster-recovery
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 78dde18f0db839626dd71c182d8b9932b966e27664e7c93627bab0e84ce92d5a
---

# DevOps Disaster Recovery

This scope covers restoring critical services and data after loss exceeds ordinary resilience and incident mitigation.

## Principles

### PRN-000089 — Derive recovery objectives from impact

Set recovery time, recovery point, and service priorities from a business impact analysis of critical functions, data, and dependencies. [1]

#### Why

Recovery architecture cannot protect everything equally. Impact analysis identifies which functions must return first and how much delay or data loss is tolerable, giving backup, redundancy, and staffing decisions a reviewable basis. [1]

#### Practices

- Map critical functions to applications, data, identities, networks, providers, people, and external dependencies. [1]
- Agree recovery time and recovery point objectives with accountable service and business owners before selecting mechanisms. [1]

### PRN-000090 — Prove restoration, not backup creation

Exercise recovery end to end under realistic loss assumptions and verify the integrity, dependency order, and usefulness of the restored service. [1], [2]

#### Why

A stored backup does not demonstrate that credentials, tooling, documentation, capacity, and dependent data can restore an operable service within its objective. Repeated exercises expose hidden coupling and keep plans current. [1], [2]

#### Practices

- Restore into an isolated environment and verify data integrity, application behavior, access, and downstream reconciliation. [1], [2]
- Record actual recovery time and data loss, repair gaps, and repeat the exercise after material architecture or dependency change. [2]

#### Applicability

When a full destructive exercise is unsafe or impractical, use progressively deeper component, tabletop, simulation, and parallel-environment tests. Periodically exercise the complete path whenever the recovery claim depends on the interactions among people, tooling, credentials, data, and dependencies. [1], [2]

## References

1. [NIST SP 800-34 Rev. 1, Contingency Planning Guide for Federal Information Systems][1] — `SRC-000053`
2. [NIST SP 800-184, Guide for Cybersecurity Event Recovery][2] — `SRC-000054`

[1]: https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-34r1.pdf
[2]: https://csrc.nist.gov/pubs/sp/800/184/final
