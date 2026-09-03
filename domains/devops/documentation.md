---
schema_version: 5
id: devops.documentation
title: DevOps Documentation
domain: devops
type: subdomain
subdomain: documentation
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: b577923c1a2ea4bcaa170fa0005454daa67c705b3cc8acbd1f6e50e7f58cfe4c
---

# DevOps Documentation

This scope covers operational knowledge used to deliver, operate, diagnose, and recover services.

## Principles

### PRN-000101 — Keep operational documentation aligned with production

Give operational documentation an owner and update it through the change process whenever the production behavior or procedure it describes evolves. [1], [2]

#### Why

Operational guidance reduces risk only while operators can trust it. Explicit ownership, version control, and validation by another practitioner expose drift before an outdated procedure is needed during a release or incident. [1], [2]

#### Practices

- Record an owner and review trigger for each service overview, runbook, deployment procedure, and dependency record. [2]
- Review documentation impact with the system change, update affected procedures before use, and remove or redirect superseded instructions. [1], [2]

### PRN-000102 — Write for the operator’s immediate task

Separate learning, procedural, reference, and explanatory material so an operator can reach the task-specific guidance needed under current conditions. [2], [3]

#### Why

A tutorial, a runbook, a reference, and an architectural explanation answer different questions. Mixing them forces readers to extract urgent steps from teaching or background material and makes maintenance boundaries unclear. [3]

#### Practices

- State each runbook’s outcome, required tools and permissions, ordered steps, error handling, exceptions, and escalation path. [2]
- Have another qualified operator execute or rehearse critical runbooks, then repair steps that were missing, ambiguous, or unsafe. [2], [4]

## References

1. [DORA | Capabilities: Documentation quality][1] — `SRC-000044`
2. [OPS07-BP03 Use runbooks to perform procedures][2] — `SRC-000071`
3. [Diátaxis in five minutes][3] — `SRC-000024`
4. [NIST SP 800-61r3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management][4] — `SRC-000052`

[1]: https://dora.dev/capabilities/documentation-quality/
[2]: https://docs.aws.amazon.com/wellarchitected/latest/framework/ops_ready_to_support_use_runbooks.html
[3]: https://diataxis.fr/start-here/
[4]: https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r3.pdf
