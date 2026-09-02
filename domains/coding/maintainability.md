---
schema_version: 5
id: coding.maintainability
title: Coding Maintainability
domain: coding
type: subdomain
subdomain: maintainability
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 11940b7fc5a2a93006eeaa5b156167ecc686915e22a1f1929387c9aa0a5b1b30
---

# Coding Maintainability

Maintainability concerns preserving the ability to understand, diagnose, test, and modify code throughout its useful life.

## Principles

### PRN-000020 — Preserve integrity through change

Modify code so the requested behavior changes while relevant structure, contracts, and quality properties remain coherent. [1], [2]

#### Why

Maintenance is continued development under accumulated constraints. A locally correct patch can still degrade the system when it leaves duplicated logic, inconsistent interfaces, stale tests, or weakened quality attributes. [1], [2]

#### Practices

- Trace the affected contracts, callers, tests, documentation, and operational assumptions before finalizing a change. [1]
- Leave the touched area internally consistent, removing obsolete paths and updating related artifacts in the same coherent change. [1]

### PRN-000021 — Pay down complexity where it compounds

Reduce complexity when evidence shows that it repeatedly increases change cost, defect risk, or diagnosis time. [1]

#### Why

Evolving software tends to become more complex unless maintainers actively simplify it. Improvement is most valuable at change hotspots and unstable boundaries, not wherever cleanup is aesthetically attractive. [1]

#### Practices

- Use change history, defect recurrence, review difficulty, and test friction to identify costly maintenance hotspots. [1]
- Refactor in verified steps that preserve behavior, and keep unrelated cleanup out of urgent or high-risk fixes. [1], [3]

### PRN-000022 — Make impact analysis routine

Before changing shared behavior, identify which components, data, interfaces, and quality objectives can be affected. [1], [2]

#### Why

Maintainability includes the ability to assess a proposed change and locate what must be modified. Explicit impact analysis reduces omissions and gives testing and review a defensible scope. [1], [2]

#### Practices

- Start from the changed contract and follow both direct dependencies and important runtime or data-mediated interactions. [1]
- Record uncertain or untestable impacts and escalate verification where failure would be costly or difficult to reverse. [1], [2]

## References

1. [Guide to the Software Engineering Body of Knowledge (SWEBOK Guide), Version 4.0a][1] — `SRC-000001`
2. [ISO/IEC 25010:2023 — Product quality model][2] — `SRC-000018`
3. [What to look for in a code review][3] — `SRC-000003`

[1]: https://ieeecs-media.computer.org/media/education/swebok/swebok-v4.pdf
[2]: https://www.iso.org/standard/78176.html
[3]: https://google.github.io/eng-practices/review/reviewer/looking-for.html
