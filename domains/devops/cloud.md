---
schema_version: 5
id: devops.cloud
title: DevOps Cloud
domain: devops
type: subdomain
subdomain: cloud
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 0114855e7909c04a28f11f99bb72674055e53b88ffcd0b5fd27274bb3e80e499
---

# DevOps Cloud

This scope covers operating models and architectural choices that arise from on-demand, pooled, elastic services.

## Principles

### PRN-000077 — Adopt cloud capabilities, not just cloud location

Use on-demand self-service, measured consumption, automation, and elasticity to change how teams provision and operate services. [1], [2]

#### Why

Cloud computing is defined by operational characteristics, not by a provider label. Moving workloads while retaining tickets, long provisioning delays, and opaque capacity misses the feedback and flexibility those characteristics enable. [1], [2]

#### Practices

- Provide governed self-service paths for routine provisioning and configuration. [1], [2]
- Scale supply with observed demand and expose consumption to workload owners. [1], [2]

### PRN-000078 — Make provider dependencies deliberate

Choose managed services and portability boundaries from business value, recovery needs, and the cost of dependency change. [2], [3], [4]

#### Why

Managed services can remove undifferentiated operations, but they also define failure, data, identity, and exit constraints. Reliability comes from designing and planning recovery for those actual dependencies rather than assuming either total portability or provider infallibility. [3], [4]

#### Practices

- Record which provider, region, identity, network, and data services are critical to each workload. [4]
- Test the recovery path for the failures the architecture claims to tolerate before paying for additional redundancy. [3], [4]

## References

1. [NIST SP 800-145, The NIST Definition of Cloud Computing][1] — `SRC-000056`
2. [DORA | Capabilities: Flexible infrastructure][2] — `SRC-000045`
3. [Resiliency, and the components of reliability][3] — `SRC-000064`
4. [NIST SP 800-34 Rev. 1, Contingency Planning Guide for Federal Information Systems][4] — `SRC-000053`

[1]: https://csrc.nist.gov/pubs/sp/800/145/final
[2]: https://dora.dev/capabilities/flexible-infrastructure/
[3]: https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/resiliency-and-the-components-of-reliability.html
[4]: https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-34r1.pdf
