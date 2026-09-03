---
schema_version: 5
id: devops.incident-response
title: DevOps Incident Response
domain: devops
type: subdomain
subdomain: incident-response
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: bf010e5296f4cb4547f3570b237086884c7d8bfe2af360345060b955d7c39d9c
---

# DevOps Incident Response

This scope covers prepared command, coordination, mitigation, communication, and learning during service incidents.

## Principles

### PRN-000087 — Establish command before complexity grows

Use a rehearsed incident structure with one coordinating lead, explicit operational roles, and a shared record of state and decisions. [1], [2]

#### Why

Incidents increase cognitive load while attracting responders and stakeholders. Clear command, delegated operations and communication, and a current incident log reduce duplicated work and keep restoration decisions from being displaced by coordination noise. [1], [2]

#### Practices

- Define severity, declaration, leadership, escalation, and communication procedures before an incident. [1], [2]
- Keep a timestamped record of symptoms, hypotheses, actions, results, ownership, and stakeholder updates. [1], [2]

### PRN-000088 — Restore safely, then investigate deeply

Prioritize bounded mitigation and recovery during active impact, preserve evidence, and conduct a separate systemic review after control is restored. [1], [2], [3]

#### Why

An incident demands fast reduction of harm, while causal analysis requires time and reliable evidence. Mixing the goals can delay recovery or produce a premature story that overlooks contributing conditions. [1], [3]

#### Practices

- Prefer rehearsed rollback, isolation, traffic shift, or degradation actions whose risks and success signals are understood. [1], [2]
- After recovery, document impact, response, contributing conditions, lessons, and owned preventive actions without assigning individual blame. [2], [3]

## References

1. [Managing Incidents][1] — `SRC-000049`
2. [NIST SP 800-61r3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management][2] — `SRC-000052`
3. [Postmortem Culture: Learning from Failure][3] — `SRC-000050`

[1]: https://sre.google/sre-book/managing-incidents/
[2]: https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r3.pdf
[3]: https://sre.google/sre-book/postmortem-culture/
