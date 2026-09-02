---
schema_version: 5
id: coding.code-review
title: Coding Code Review
domain: coding
type: subdomain
subdomain: code-review
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 75fa15511789eb02fab35d1de0dc2e2821718cbaf67a1462be42208a25d5017c
---

# Coding Code Review

Code review concerns independent examination of a proposed change for behavior, design, risk, maintainability, and shared understanding.

## Principles

### PRN-000046 — Review the change in system context

Judge whether the change belongs, behaves correctly, and improves the health of the surrounding system before polishing individual lines. [1], [2]

#### Why

A locally tidy implementation can still solve the wrong problem, violate an architectural boundary, or degrade the wider codebase. Reviewing purpose and design first prevents detailed work on a change whose direction must be revised. [1], [2]

#### Practices

- Read the change description and inspect the main behavioral and design path before reviewing details. [1]
- Check affected callers, tests, data, documentation, concurrency, and specialized risks beyond the displayed diff when needed. [1]

### PRN-000047 — Demand evidence, not personal preference

Base blocking review decisions on requirements, observable behavior, project standards, risk, or engineering rationale, and distinguish them from optional preferences. [1], [2]

#### Why

Unlabeled preference creates needless conflict and inconsistent gates. Explicit evidence and severity let authors understand what must change, what may improve, and why. [2], [3]

#### Practices

- State the consequence or violated contract behind a required change and label non-blocking suggestions clearly. [2], [3]
- Accept an author’s reasonable choice when alternatives are equivalent under applicable evidence and standards. [2]

### PRN-000048 — Keep reviews small and responsive

Submit and review self-contained changes promptly enough that feedback can still shape the work. [2], [4], [5]

#### Why

Smaller changes are reviewed faster and more thoroughly, are easier to test and reverse, and waste less work when their direction is wrong. Delayed review reduces team flow and pressures reviewers to accept weaker changes. [4], [5]

#### Practices

- Split work by coherent behavior or independently reviewable dependency, keeping related tests with the change. [4]
- Respond first to direction-changing issues, then complete the detailed pass once the approach is sound. [1], [4], [5]

### PRN-000049 — Review code rigorously and people respectfully

Make comments clear, courteous, and directed at the code while remaining explicit about material defects and risk. [3]

#### Why

Respectful explanation improves collaboration and learning; vagueness or personal judgment obscures the technical issue. Kindness does not require weakening the severity of a consequential finding. [3]

#### Practices

- Explain why a change matters and balance problem statements with direct guidance according to what will help the author most. [3]
- Acknowledge effective decisions as well as defects, especially when doing so reinforces a reusable practice. [1], [3]

## References

1. [What to look for in a code review][1] — `SRC-000003`
2. [The Standard of Code Review][2] — `SRC-000026`
3. [How to write code review comments][3] — `SRC-000028`
4. [Small CLs][4] — `SRC-000027`
5. [Speed of Code Reviews][5] — `SRC-000032`

[1]: https://google.github.io/eng-practices/review/reviewer/looking-for.html
[2]: https://google.github.io/eng-practices/review/reviewer/standard.html
[3]: https://google.github.io/eng-practices/review/reviewer/comments.html
[4]: https://google.github.io/eng-practices/review/developer/small-cls.html
[5]: https://google.github.io/eng-practices/review/reviewer/speed.html
