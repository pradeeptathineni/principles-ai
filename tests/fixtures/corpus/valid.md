---
schema_version: 5
id: coding.principles
title: Coding Principles
domain: coding
type: principles
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Coding Principles

Editorial scope for this fixture.

## Principles

### PRN-000001 — Keep changes reviewable

Prefer bounded changes with visible intent. [1]

#### Why

Reviewers can reason more precisely about a bounded change. [1], [2]

#### Practices

- Separate unrelated changes. [1]
- Preserve a reproducible verification path. [2]

#### Applicability

Emergency mitigation can require a different initial tradeoff. [2]

#### Goals

- Develop the judgment to choose a useful change boundary.
- Learn to record verification evidence. [2]

#### Tags

- code-review

## References

1. [Example Source One][1] — `SRC-000001`
2. [Example Source Two][2] — `SRC-000002`

[1]: https://example.com/one
[2]: https://example.com/two
