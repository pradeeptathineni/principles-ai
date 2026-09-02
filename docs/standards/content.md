# Content Standard

## Purpose

This standard defines what belongs in the corpus and the semantic meaning of its content types. Executable structure is defined by `config/schema.yaml` and `config/content-policy.yaml`.

## Content types

### Principle

A durable normative statement that guides judgment or behavior within a defined scope. It must be important, useful, evidence-calibrated, distinct, and durable enough to outlive ordinary tool churn.

A principle is not merely a fact, feature, slogan, preference, or tutorial step.

### Why

Rationale explaining consequences, evidence, tradeoffs, requirements, failure modes, conditions, or meaningful disagreement. It must add reasoning rather than restate the principle.

Each top-level paragraph is a structural rationale claim block and requires citations.

### Practice

A concrete behavior or decision pattern that operationalizes the principle. Each top-level practice list item is a structural claim block and requires citations.

Practices may change faster than principles. A product or tool name by itself is not a practice.

### Applicability

An optional section for conditions, limitations, exceptions, or contexts that materially affect correct use. Do not add it when the rationale already communicates scope clearly.

Each top-level Applicability paragraph is a structural claim block and requires citations. This prevents conditions and exceptions from becoming an uncited escape hatch.

### Goal

An optional developmental capability, habit, or outcome that helps a person embody the principle. Goals are not required for symmetry and should not repeat `personal-growth.md` mechanically.

Goals need no citation when they are editorial developmental objectives. If a goal makes an externally grounded claim, cite and review that claim.

### Tag

An optional normalized retrieval concept. Tags should not merely duplicate the domain or file path. Until a tag vocabulary is adopted, prefer fewer high-value tags over uncontrolled expansion.

Frontmatter tags describe the file. Tags under an entry describe that principle. Both use the executable normalized syntax, but no controlled vocabulary is imposed before the pilot demonstrates a need.

## File presets

### `principles.md`

The domain's selective highest-order guidance.

### `personal-growth.md`

Principles and practices for developing capability, judgment, fluency, and currency in the domain. It differs by selection criteria, not parser grammar.

### Subdomain file

Guidance specific to one registered, materially distinct scope.

All three presets share one grammar.

## Entry grammar

Every entry contains:

1. `### PRN-000001 — Title`
2. Exactly one statement paragraph with citations.
3. Required `#### Why` with at least one cited top-level paragraph.
4. Required `#### Practices` with at least one cited top-level list item.
5. Optional `#### Applicability` with at least one cited top-level paragraph when present.
6. Optional `#### Goals`.
7. Optional `#### Tags`.

The grammar is closed. Statement, Why, and Applicability blocks are top-level paragraphs; Practices and Goals are flat single-paragraph unordered items; Tags is a flat unique normalized list. Sections follow policy order, and unknown or duplicate sections are invalid. Ordinary GFM inline forms remain available within allowed paragraphs, subject to the claim-hash restrictions. Images, strikethrough, and raw HTML are outside the initial grammar.

Each document has one title, one editorial introduction, one `## Principles` section with at least one entry, and final `## References`; no other level-two section is allowed. `config/content-policy.yaml` is canonical for exact AST shapes, inline restrictions, ordering, and bibliography grammar.

## Path and frontmatter agreement

Corpus Markdown lives directly under `domains/<domain>/`. Universal filenames and IDs use the domain `principles` and `personal-growth` presets; subdomain filenames, IDs, type, and registered subdomain agree. Directory, path, frontmatter, and decoded title agreement is exact under `config/content-policy.yaml`. Corpus content requires an accepted domain, and subdomain content requires that subdomain to be accepted.

Corpus status is `draft` or `active`; taxonomy and principle retirement provide historical lifecycle, so a third deprecated-file state is intentionally absent. `last_reviewed` is null while status is `draft`. An `active` file carries the date of its last complete semantic content review against then-current citations and required human review. Any substantive draft revision resets it to null. Formatting or link reachability alone does not advance it.

## Introductions

The paragraph after the file title is an editorial scope statement. It should define the file boundary and must not be used to place substantive external claims outside the citation grammar.

## Selection bar

Evaluate candidates for importance, durability, evidence strength, scope fit, distinctness, actionability, and ability to survive wording simplification. Do not write to a target count.

## Duplication

Contextual duplication across domains is allowed when meaning, practices, goals, evidence, scope, or importance materially changes. Avoid duplication for structural symmetry.

## Normative strength

- `must` for genuine requirements or invariants.
- `should` for strong recommendations.
- `prefer` for contextual defaults.
- `consider` for conditional techniques.

Do not strengthen wording beyond the cited evidence and reviewed judgment.
