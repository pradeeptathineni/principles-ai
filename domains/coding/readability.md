---
schema_version: 5
id: coding.readability
title: Coding Readability
domain: coding
type: subdomain
subdomain: readability
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: efab2895cc9ac4d4a452a007dae56c655f4e8102881c3da2b8d93293e1724734
---

# Coding Readability

Readability concerns how source code communicates local intent and behavior to people who must inspect or change it.

## Principles

### PRN-000017 — Name the meaning, not the mechanism

Choose names that communicate the domain role, unit, and consequence of a value or operation rather than merely its type or implementation. [1], [2]

#### Why

Meaningful names let readers infer behavior without repeatedly tracing definitions. Names that describe only mechanics force implementation knowledge into every use and become misleading when the mechanism changes. [1], [2]

#### Practices

- Name booleans as conditions, quantities with their units when ambiguity is plausible, and operations for the result or effect callers depend on. [1], [2]
- Rename code when its meaning changes; do not preserve an obsolete name solely to avoid a small, reviewable edit. [2]

### PRN-000018 — Make control flow tell one story

Structure each routine so its main path and exceptional paths can be followed without carrying unnecessary nesting or hidden state. [1], [2]

#### Why

Deep nesting, unrelated responsibilities, and implicit mutation increase the number of conditions a reader must remember. Direct flow and cohesive routines expose the decisions that determine behavior. [1], [2]

#### Practices

- Use early exits, named intermediate values, or extracted cohesive operations when they make decision points explicit. [1]
- Keep state changes close to the condition that justifies them and avoid relying on distant, implicit side effects. [1], [2]

### PRN-000019 — Standardize syntax, preserve judgment

Follow the project’s language and formatting conventions, but depart from advisory style rules when applying them would obscure meaning or damage compatibility. [2], [3]

#### Why

Consistency reduces incidental interpretation and review debate. Style is subordinate to correctness and comprehension, so rigid conformance is harmful when the local context makes the result less readable. [2], [3]

#### Practices

- Automate unambiguous formatting and lint rules so reviews can focus on behavior and design. [1], [2], [4]
- Document or narrowly suppress justified exceptions instead of silently creating a competing convention. [3]

## References

1. [Guide to the Software Engineering Body of Knowledge (SWEBOK Guide), Version 4.0a][1] — `SRC-000001`
2. [What to look for in a code review][2] — `SRC-000003`
3. [PEP 8 — Style Guide for Python Code][3] — `SRC-000017`
4. [NIST SP 800-218, Secure Software Development Framework Version 1.1][4] — `SRC-000014`

[1]: https://ieeecs-media.computer.org/media/education/swebok/swebok-v4.pdf
[2]: https://google.github.io/eng-practices/review/reviewer/looking-for.html
[3]: https://peps.python.org/pep-0008/
[4]: https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-218.pdf
