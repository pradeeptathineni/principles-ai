# Principles Repository Agent Guide

This repository maintains an evidence-grounded corpus of principles, practices, and personal-growth goals. Humans define intent, priorities, and governance; agents research, synthesize, implement, validate, and propose changes within repository rules.

Keep this file short. It is a map to the system of record in `docs/`, `config/`, and each domain's `domain.yaml`.

## Read the applicable context

Always read:

- `docs/project.md`
- `docs/architecture.md`

For domain-content or taxonomy work, also read:

- `docs/standards/content.md`
- `docs/standards/research.md`
- `docs/standards/sources.md`
- `docs/standards/citations.md`
- `docs/standards/writing.md`
- `docs/standards/taxonomy.md`
- `docs/standards/ai-contributions.md`
- `docs/standards/prompting.md`
- `docs/standards/context.md`
- `docs/standards/evaluation.md`

Use machine-readable policy from:

- `config/schema.yaml`
- `config/content-policy.yaml`
- `config/source-policy.yaml`
- `config/taxonomy-policy.yaml`
- `config/validation.yaml`

For work inside an existing domain, also read `domains/<domain>/domain.yaml`.

Use only the appropriate template in `config/templates/` when creating corpus files.

## Core invariants

- Research precedes synthesis.
- Read relevant source content; search snippets, titles, and remembered model knowledge are not evidence.
- Prefer the strongest source that is fit for the specific claim.
- Do not generate a desired principle first and then search for citations that merely resemble support.
- Every externally grounded principle statement, substantive rationale claim, and recommended practice requires claim-level provenance.
- A citation must substantively support the specific claim it accompanies.
- Goals may be uncited when they are developmental objectives derived from the surrounding evidence.
- Preserve meaningful disagreement, uncertainty, scope, and exceptions.
- Do not fabricate sources, quotations, citations, dates, versions, or source support.
- Use exact source language during research when needed to verify meaning, but synthesize final prose unless a short quotation is genuinely necessary.
- Do not bulk-copy source material into this repository.
- Prefer durable guidance over transient tooling fashion in principle statements.
- Markdown under `domains/` is canonical for corpus content.
- `domains/*/domain.yaml` is canonical for accepted domain taxonomy.
- `config/taxonomy-policy.yaml` governs taxonomy; it does not enumerate the taxonomy.
- Explicitly user-required subdomains are protected intent and must not be silently removed, merged, or renamed by an agent.
- Generated indexes, aggregates, and machine formats are derived artifacts.
- Optimize simultaneously for human readability, machine parseability, and AI legibility.
- Do not weaken these invariants for convenience.

## Natural-language interaction

The primary interactive interface may be a natural-language request to an agent. A user may specify:

- a domain to create or change;
- subdomains they explicitly care about;
- priorities, exclusions, or scope constraints.

The agent should preserve explicit user intent, research the remaining taxonomy, and use repository workflows rather than requiring the user to express taxonomy as YAML or CLI arguments.

## Workflow routing

- New domain: `docs/workflows/create-domain.md`
- Add, rename, merge, deprecate, or remove subdomains: `docs/workflows/update-taxonomy.md`
- Create a registered corpus file: `docs/workflows/create-content.md`
- Update corpus content: `docs/workflows/update-content.md`
- Bootstrap tooling: `docs/workflows/bootstrap.md`

## Change discipline

The evidence bar rises with semantic impact:

1. Reference/link maintenance
2. Practice changes
3. Goal changes
4. Rationale changes
5. Principle wording changes
6. Principle additions, removals, or scope changes
7. Taxonomy changes, especially changes to explicit human priorities

Treat principle-level and taxonomy-level changes as high-impact.

## Validation

Before completing work:

1. Validate file structure and frontmatter.
2. Validate domain manifests, stable IDs, and taxonomy membership.
3. Validate reference definitions and links.
4. Validate required claim-level citations.
5. Check citation entailment for changed claims.
6. Check source quality and source fitness.
7. Review for duplicate, conflicting, overbroad, or misplaced principles.
8. Run repository tests and evals applicable to the change.
9. Report unresolved uncertainty explicitly instead of guessing.

If validation tooling has not yet been implemented, follow `docs/workflows/bootstrap.md` before bulk-generating domain content.

## Scope control

Do not add a new domain or subdomain merely because a topic exists. Follow `docs/standards/taxonomy.md`.

Do not fill a file to a target count. Include only principles that earn their place.

Do not silently resolve conflicts between credible sources. Represent the nuance or escalate the judgment.

## Repository improvement

When an agent failure reveals a missing rule, unclear context, or unenforced invariant, prefer improving repository documentation, configuration, tests, or validation so future agents do not repeat the failure.
