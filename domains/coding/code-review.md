---
schema_version: 5
id: coding.code-review
title: Coding Code Review
domain: coding
type: subdomain
subdomain: code-review
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: cc0cf069778a3981851a8817bba7db203a24e9df3a7a51d91faf256e0ad4777d
---

# Coding Code Review

Code review concerns independent examination of a proposed change for behavior, design, risk, maintainability, and shared understanding.

## Principles

### PRN-000046 — Verify the change in system context

Independently judge whether the proposed change belongs, behaves correctly, and preserves the health of the surrounding system before polishing individual lines. [1], [2], [3]

#### Why

A locally tidy implementation can still solve the wrong problem, violate an architectural boundary, or degrade the wider codebase. Because change understanding is central to modern review, reviewers need the purpose and design context before spending attention on details. [1], [2], [3]

#### Practices

- Read the change description and inspect the main behavioral and design path before reviewing details. [1], [3]
- Compare the author’s stated impact with affected callers, tests, data, documentation, concurrency, and specialized risks beyond the displayed diff. [1]

### PRN-000047 — Demand evidence, not personal preference

Base blocking review decisions on requirements, observable behavior, project standards, risk, or engineering rationale, and distinguish them from optional preferences. [1], [2]

#### Why

Unlabeled preference creates needless conflict and inconsistent gates. Explicit evidence and severity let authors understand what must change, what may improve, and why. [2], [4]

#### Practices

- State the consequence or violated contract behind a required change and label non-blocking suggestions clearly. [2], [4]
- Accept an author’s reasonable choice when alternatives are equivalent under applicable evidence and standards. [2]

### PRN-000048 — Bound reviewer attention and feedback delay

Shape review units so a reviewer can understand their behavior and risk, and respond while feedback can still change direction. [2], [5], [6]

#### Why

Review size determines how much context must be held at once; delay determines how much dependent work accumulates before correction. Keeping both bounded improves attention and reduces discarded work. [5], [6]

#### Practices

- Split a review by behavior or dependency when each part remains independently understandable, and keep its evidence with it. [5]
- Send an early review when design direction is uncertain. [5], [6]
- Respond first to direction-changing issues, then complete the detailed pass once the approach is sound. [1], [6]

### PRN-000049 — Review code rigorously and people respectfully

Make comments clear, courteous, and directed at the code while remaining explicit about material defects and risk. [4]

#### Why

Respectful explanation improves collaboration and learning; vagueness or personal judgment obscures the technical issue. Kindness does not require weakening the severity of a consequential finding. [4]

#### Practices

- Explain why a change matters and balance problem statements with direct guidance according to what will help the author most. [4]
- Acknowledge effective decisions as well as defects, especially when doing so reinforces a reusable practice. [1], [4]

## References

1. [What to look for in a code review][1] — `SRC-000003`
2. [The Standard of Code Review][2] — `SRC-000026`
3. [Expectations, Outcomes, and Challenges of Modern Code Review][3] — `SRC-000036`
4. [How to write code review comments][4] — `SRC-000028`
5. [Small CLs][5] — `SRC-000027`
6. [Speed of Code Reviews][6] — `SRC-000032`

[1]: https://google.github.io/eng-practices/review/reviewer/looking-for.html
[2]: https://google.github.io/eng-practices/review/reviewer/standard.html
[3]: https://www.microsoft.com/en-us/research/publication/expectations-outcomes-and-challenges-of-modern-code-review/
[4]: https://google.github.io/eng-practices/review/reviewer/comments.html
[5]: https://google.github.io/eng-practices/review/developer/small-cls.html
[6]: https://google.github.io/eng-practices/review/reviewer/speed.html
