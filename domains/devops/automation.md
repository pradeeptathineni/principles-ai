---
schema_version: 5
id: devops.automation
title: DevOps Automation
domain: devops
type: subdomain
subdomain: automation
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 8735ab1da13431b661871abd72f95053687de1186a51c25096c0fb95a49de4b8
---

# DevOps Automation

This scope covers software that performs or coordinates recurring operational work beyond a specific delivery pipeline.

## Principles

### PRN-000067 — Simplify before you automate

Remove unnecessary steps and clarify invariants before encoding an operational process in software. [1], [2]

#### Why

Automation multiplies the behavior it encodes. Automating a fragile process can make failure faster and less legible, whereas a clear model and stable interface allow automation to reduce toil without hiding operational meaning. [1], [2]

#### Practices

- Observe the manual process, remove exceptions that have no current purpose, and state the desired outcome before scripting steps. [1], [2]
- Build reusable APIs or controllers around system intent instead of accumulating host-specific command sequences. [1]

### PRN-000068 — Keep automation observable and recoverable

Automation should expose its decisions, detect inconsistent state, fail safely, and leave a tested path for human recovery. [1], [2]

#### Why

Autonomous systems need self-observation to correct drift, but operators also need enough internal detail to diagnose automation failure. Removing routine contact without preserving recovery skill can make rare failures harder to control. [1]

#### Practices

- Emit structured progress, inputs, outputs, and terminal state without exposing secrets. [1]
- Provide bounded retries, idempotent recovery, and a documented way to pause or override automation when its assumptions fail. [1], [2]

## References

1. [The Evolution of Automation at Google][1] — `SRC-000046`
2. [DORA | Capabilities: Deployment automation][2] — `SRC-000040`

[1]: https://sre.google/sre-book/automation-at-google/
[2]: https://dora.dev/capabilities/deployment-automation/
