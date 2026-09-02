---
schema_version: 5
id: coding.dependencies
title: Coding Dependencies
domain: coding
type: subdomain
subdomain: dependencies
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 55fa20207561acdaa2adeb4c9924bfae63b89c862325c96242052cc9b5d71adb
---

# Coding Dependencies

Dependency management concerns selecting, constraining, recording, updating, and removing external software incorporated into code or its build.

## Principles

### PRN-000040 — Earn every dependency

Adopt a dependency only when its demonstrated value exceeds the security, compatibility, operational, legal, and maintenance obligations it adds. [1], [2]

#### Why

Reuse can reduce duplicated implementation and defects, but it also imports another component’s interfaces, release decisions, vulnerabilities, and transitive graph. Fitness depends on the expected use, not popularity alone. [1], [2]

#### Practices

- Evaluate capability fit, maintenance status, provenance, license, vulnerability history, update path, and viable alternatives before adoption. [1], [3]
- Prefer the smallest supported surface that meets the need, and remove dependencies whose continuing cost exceeds their purpose. [1], [2]

### PRN-000041 — Make the resolved graph reproducible

Record enough identity, version, integrity, and relationship information to reconstruct and inspect the dependency graph used by a build. [1], [3], [4]

#### Why

A manifest range or package name does not identify the artifacts actually consumed. Resolved versions, digests, provenance, and relationships support repeatable builds, incident analysis, and impact assessment. [1], [3], [4]

#### Practices

- Record the ecosystem’s lock or resolution data and verify downloaded artifacts with supported integrity mechanisms. [1], [4]
- Generate standards-based composition or provenance data when consumers or risk require transitive visibility. [1], [3], [4]

### PRN-000042 — Update dependencies as controlled changes

Continuously monitor dependencies and apply upgrades, replacements, or removals through tested, reviewable changes. [1]

#### Why

Dependencies evolve after adoption: vulnerabilities appear, maintainers end support, and interfaces change. Unbounded staleness increases exposure, while unreviewed automatic updates can introduce incompatible or compromised behavior. [1]

#### Practices

- Monitor supported releases and vulnerability sources for direct and transitive components, prioritizing action by exploitability and impact. [1]
- Test updates against affected behavior and retain an explicit plan for components that are unmaintained or nearing end of life. [1]

## References

1. [NIST SP 800-218, Secure Software Development Framework Version 1.1][1] — `SRC-000014`
2. [Guide to the Software Engineering Body of Knowledge (SWEBOK Guide), Version 4.0a][2] — `SRC-000001`
3. [SPDX Specification 3.0.1 — Scope][3] — `SRC-000020`
4. [SLSA v1.2 — Provenance][4] — `SRC-000019`

[1]: https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-218.pdf
[2]: https://ieeecs-media.computer.org/media/education/swebok/swebok-v4.pdf
[3]: https://spdx.github.io/spdx-spec/v3.0.1/scope/
[4]: https://slsa.dev/spec/v1.2/provenance
