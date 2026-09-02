---
schema_version: 5
id: coding.principles
title: Coding Principles
domain: coding
type: principles
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 516ef19b2ffc66fb71539b3e497b5a624e49eb13568f3a67b14d3833310f420f
---

# Coding Principles

These principles govern the highest-order choices involved in writing and changing code; narrower files develop their application to particular concerns.

## Principles

### PRN-000010 — Make intent easy to recover

Write code so another person can recover its purpose, behavior, and constraints without reconstructing avoidable complexity. [1], [2]

#### Why

Code is repeatedly read, reviewed, tested, debugged, and changed. Simple structure, meaningful names, and explicit boundaries reduce the mental context required for those activities and make defects easier to notice. [1], [2]

#### Practices

- Prefer direct control flow, domain-meaningful names, and cohesive units over clever compression. [1], [2]
- Put non-obvious reasons and constraints where future readers will encounter the affected code. [2]

### PRN-000011 — Build evidence into every change

Make each change produce proportionate evidence that it behaves as intended and preserves relevant existing behavior. [1], [3]

#### Why

Testing can reveal defects and reduce operational risk, but it cannot prove that none remain. Combining executable checks, review, and risk-focused analysis provides different forms of evidence without overstating certainty. [1], [3]

#### Practices

- Define observable acceptance conditions before or while coding, then test normal, boundary, failure, and interaction behavior according to risk. [1], [3]
- Keep tests and other verification artifacts with the change so reviewers can judge both the implementation and its evidence. [2], [3]

### PRN-000012 — Change code in coherent, reversible steps

Prefer small, self-contained changes that remain understandable, verifiable, and recoverable on their own. [4], [5]

#### Why

Smaller logical changes are easier to review thoroughly, test independently, inspect later, merge, and reverse. Size is contextual: the unit should preserve a complete idea and enough context to judge its implications. [4], [5]

#### Practices

- Separate unrelated refactoring, formatting, dependency, and behavior changes when each can stand independently. [2], [4]
- Ensure each published step is internally consistent and passes the checks required for its risk. [5]

### PRN-000013 — Treat safety constraints as part of correctness

Implement security, failure behavior, resource limits, and other safety constraints as requirements of the code rather than cleanup after functional completion. [1], [6]

#### Why

Defects outside nominal functionality can expose data, bypass controls, corrupt state, or make recovery impossible. Addressing these risks during design and construction reduces both vulnerability exposure and later remediation cost. [1], [6]

#### Practices

- Identify relevant abuse cases, failure modes, data sensitivities, and operational limits before committing to an implementation shape. [6]
- Use language, compiler, analysis, review, and testing controls appropriate to the risk, and track discovered issues to resolution. [1], [6]

## References

1. [Guide to the Software Engineering Body of Knowledge (SWEBOK Guide), Version 4.0a][1] — `SRC-000001`
2. [What to look for in a code review][2] — `SRC-000003`
3. [ISTQB Certified Tester Foundation Level Syllabus v4.0.1][3] — `SRC-000013`
4. [Small CLs][4] — `SRC-000027`
5. [gitworkflows — An overview of recommended workflows with Git][5] — `SRC-000021`
6. [NIST SP 800-218, Secure Software Development Framework Version 1.1][6] — `SRC-000014`

[1]: https://ieeecs-media.computer.org/media/education/swebok/swebok-v4.pdf
[2]: https://google.github.io/eng-practices/review/reviewer/looking-for.html
[3]: https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf
[4]: https://google.github.io/eng-practices/review/developer/small-cls.html
[5]: https://git-scm.com/docs/gitworkflows/2.35.0
[6]: https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-218.pdf
