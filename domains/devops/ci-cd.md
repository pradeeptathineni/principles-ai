---
schema_version: 5
id: devops.ci-cd
title: DevOps CI/CD
domain: devops
type: subdomain
subdomain: ci-cd
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: f5fde280bcb1acdb101dc4734c29db7414c664b24f3a4225d4da6fcc670efdcb
---

# DevOps CI/CD

This scope covers continuous integration and the automated path that keeps changes releasable and promotes them safely.

## Principles

### PRN-000069 — Keep the mainline releasable

Integrate small changes frequently into one authoritative mainline and restore a failed build or test result before adding more change. [1]

#### Why

Long-lived divergence postpones integration risk and creates large stabilization events. Fast automated checks on each commit turn incompatibility into immediate team feedback while the responsible change is still easy to isolate. [1]

#### Practices

- Trigger a repeatable build and a reliable, fast test suite for every proposed mainline change. [1]
- Stop the line when the mainline fails; fix or revert promptly instead of normalizing a red pipeline. [1]

### PRN-000070 — Build once, promote the same artifact

Create one identified artifact in CI and promote that unchanged artifact through environments with environment-specific configuration kept separate. [2], [3]

#### Why

Rebuilding at each stage weakens the connection between tested and released software. A repeatable release process and one promotable artifact preserve provenance, reduce variation, and make rollback and audit more dependable. [2], [3]

#### Practices

- Number and retain authoritative build outputs with their source revision and build evidence. [2], [3]
- Use the same automated deployment process in every environment and run a post-deployment verification before promotion. [2]

## References

1. [DORA | Capabilities: Continuous integration][1] — `SRC-000038`
2. [DORA | Capabilities: Deployment automation][2] — `SRC-000040`
3. [Release Engineering][3] — `SRC-000047`

[1]: https://dora.dev/capabilities/continuous-integration/
[2]: https://dora.dev/capabilities/deployment-automation/
[3]: https://sre.google/sre-book/release-engineering/
