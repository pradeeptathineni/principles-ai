---
schema_version: 5
id: devops.infrastructure-as-code
title: DevOps Infrastructure as Code
domain: devops
type: subdomain
subdomain: infrastructure-as-code
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 9e2ed6e9d0e4d63a501688ee36e0a1588b8b5150fe1ff0444e369c7abf6ac799
---

# DevOps Infrastructure as Code

This scope covers declarative, versioned, and reviewable representations of infrastructure state.

## Principles

### PRN-000063 — Make desired state the change interface

Express infrastructure intent declaratively in versioned records and change it through reviewable history. [1], [2]

#### Why

A durable desired-state record makes proposed change inspectable and environments reproducible. Version history supports attribution and recovery, while imperative changes performed outside that record create state that cannot be reliably reviewed or recreated. [1], [2]

#### Practices

- Store desired state and its reusable modules in version control without embedding secrets. [1], [2]
- Review a computed plan against policy and expected service impact before applying consequential changes. [2]

### PRN-000064 — Reconcile drift; do not normalize it

Continuously compare actual infrastructure with declared intent and resolve divergence through the authoritative change path. [1], [3]

#### Why

Declarative management becomes trustworthy only when an agent observes current state and drives it toward desired state. Silent manual repair leaves intent stale and makes the next automated application unsafe. [1], [3]

#### Practices

- Detect and report drift with enough context to distinguish emergency intervention from controller or configuration failure. [1], [3]
- After an emergency change, encode the intended result or revert it promptly rather than accepting an undocumented fork. [1]

## References

1. [OpenGitOps GitOps Principles v1.0.0][1] — `SRC-000062`
2. [DORA | Capabilities: Deployment automation][2] — `SRC-000040`
3. [Controllers][3] — `SRC-000058`

[1]: https://opengitops.dev/
[2]: https://dora.dev/capabilities/deployment-automation/
[3]: https://kubernetes.io/docs/concepts/architecture/controller/
