# Content Standard

## Purpose

This standard defines what belongs in the principles corpus and how its content types differ.

## Core content types

### Principle

A durable statement that guides judgment or behavior within a defined scope.

A strong principle:

- Matters repeatedly, not only in an edge case.
- Changes a meaningful decision or behavior.
- Is durable enough to outlive ordinary tool churn.
- Is scoped no more broadly than its evidence supports.
- Can be explained and operationalized.
- Is not merely a fact, feature, slogan, or preference.

### Why

The reasoning that makes the principle worth following.

A strong rationale may explain:

- Consequences.
- Tradeoffs.
- Failure modes.
- Empirical evidence.
- Standards or requirements.
- Operational experience.
- Conditions under which the principle applies or does not apply.

`Why` must add reasoning. It should not simply restate the principle in different words.

### Practice

A concrete behavior, technique, or decision pattern that operationalizes a principle.

A practice should be:

- Actionable.
- Specific enough to change behavior.
- Appropriate to the principle's scope.
- More replaceable than the principle when technology evolves.

A tool name by itself is not a practice.

### Goal

A developmental capability, habit, or outcome worth pursuing to better embody the surrounding principle.

Goals are intentionally different from practices:

- A practice says what to do.
- A goal says what capability or outcome to develop.

Goals may be personal and need not be direct quotations or prescriptions from external authorities.

### Tag

A concise normalized concept used for retrieval and grouping.

Tags should describe meaning, not duplicate every word in the file path.

## File types

### `principles.md`

Contains the domain's highest-order principles.

Use this test:

> If nearly all other files in the domain disappeared, which principles would still be most important to carry into work in this domain?

It is not a summary of every subdomain and should remain selective.

### `personal-growth.md`

Contains the principles and practices for continuously developing capability, judgment, fluency, and currency within the domain.

It may include:

- Deliberate practice.
- Projects.
- Reading.
- Feedback.
- Mentorship.
- Formal education.
- Certifications when materially useful.
- Community participation.
- Reflection.
- Staying current with changing standards and tooling.

### Subdomain file

Contains principles specific to a materially distinct dimension of practice, such as `coding/design.md` or `devops/observability.md`.

## Entry structure

Every principle entry uses this structure:

```markdown
### COD-DES-001 — Delay abstraction until the pattern is understood

Do not generalize code merely because two implementations currently look similar. [1]

#### Why

Premature abstractions can encode assumptions before the real variation of a problem is understood. [1]

#### Practices

- Generalize after a meaningful pattern emerges. [1]
- Remove abstractions that no longer reduce conceptual complexity. [2]

#### Goals

- Improve judgment about when abstraction is worthwhile.
- Become comfortable retaining small duplication when the alternative is a worse abstraction.

#### Tags

- abstraction
- simplicity
- maintainability
```

## Selection bar

A candidate principle should be evaluated for:

- Importance.
- Durability.
- Evidence strength.
- Breadth within its intended scope.
- Distinctness from existing principles.
- Actionability.
- Ability to survive wording simplification without losing meaning.

Do not write to a target principle count.

## Duplication

Duplication across domains is allowed when the context materially changes the principle's interpretation, practices, goals, or authoritative sources.

For example, `security.md` may belong in engineering, coding, DevOps, cloud, AI, and frontend development because security responsibilities and evidence differ across those contexts.

Within the same file, avoid principles that merely restate one another.

## Facts and tutorials

Facts may appear in rationale when needed, but the corpus is not an encyclopedia.

Tutorial steps may appear only when they represent a durable practice. Detailed procedures belong in external documentation or a different repository.

## Principles versus current techniques

Prefer:

> Make important system behavior observable.

over:

> Always deploy Prometheus.

The first is a durable principle. The second may be one implementation choice.

## Normative strength

Use language calibrated to the evidence:

- `must` for genuine requirements or invariants.
- `should` for strong recommendations.
- `prefer` for context-sensitive defaults.
- `consider` for conditional techniques.

Avoid absolute wording when credible exceptions exist.
