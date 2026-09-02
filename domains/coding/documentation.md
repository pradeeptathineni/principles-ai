---
schema_version: 5
id: coding.documentation
title: Coding Documentation
domain: coding
type: subdomain
subdomain: documentation
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 7ec6fe76b28b41404cd52dca3f9fc0c6cf7b09dab451e609712f20d7e57fff11
---

# Coding Documentation

Documentation concerns preserving the knowledge that code alone cannot reliably communicate to its users, maintainers, and operators.

## Principles

### PRN-000050 — Document the contract at its boundary

Document a public unit’s purpose, supported use, inputs, outputs, effects, constraints, and failure behavior where its users encounter it. [1], [2]

#### Why

Readers should not need to inspect an implementation to discover the behavior they may depend on. Boundary documentation separates stable obligations from internal choices and supports correct use and change. [1], [2]

#### Practices

- Describe observable behavior and meaningful constraints rather than narrating the implementation line by line. [1], [2]
- Include units, ownership, ordering, concurrency, security, and error semantics when callers must act on them. [1]

### PRN-000051 — Keep code and documentation in one change

Update affected documentation whenever a change alters how people build, use, test, operate, or extend the code. [1], [2]

#### Why

Documentation that diverges from behavior creates a second, misleading system. Reviewing both together lets maintainers detect contradictions while the intent and evidence are available. [1], [2]

#### Practices

- Include reference, examples, migration notes, configuration, and generated documentation affected by the change. [2]
- Remove or mark obsolete guidance when code is deleted, deprecated, or no longer supported. [2]

### PRN-000052 — Write for the reader’s task

Separate learning, goal-directed procedures, factual reference, and conceptual explanation when combining them would make the reader search through irrelevant material. [3]

#### Why

Different documentation needs imply different structures and levels of interpretation. A tutorial teaches, a how-to supports a goal, reference supplies exact facts, and explanation builds understanding. [3]

#### Practices

- Identify the intended reader and task before choosing the document type, order, and level of detail. [3]
- Link complementary material instead of forcing procedural, reference, and explanatory content into one undifferentiated page. [3]

## References

1. [Guide to the Software Engineering Body of Knowledge (SWEBOK Guide), Version 4.0a][1] — `SRC-000001`
2. [What to look for in a code review][2] — `SRC-000003`
3. [Diátaxis in five minutes][3] — `SRC-000024`

[1]: https://ieeecs-media.computer.org/media/education/swebok/swebok-v4.pdf
[2]: https://google.github.io/eng-practices/review/reviewer/looking-for.html
[3]: https://diataxis.fr/start-here/
