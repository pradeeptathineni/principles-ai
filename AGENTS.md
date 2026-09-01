# Principles Repository Agent Guide

This repository maintains an evidence-grounded corpus of principles, practices, rationales, and personal-growth goals.

Humans define intent, priorities, and governance. Agents research, synthesize, implement, validate, and propose changes within repository rules.

This file is intentionally short. It routes agents to the system of record in `docs/`, `config/`, and each domain's `domain.yaml`.

## Context

### Always read

- [Project purpose](docs/project.md)
- [Architecture](docs/architecture.md)

### For domain content or taxonomy work

Also read:

- [Content standard](docs/standards/content.md)
- [Research standard](docs/standards/research.md)
- [Source standard](docs/standards/sources.md)
- [Citation standard](docs/standards/citations.md)
- [Writing standard](docs/standards/writing.md)
- [Taxonomy standard](docs/standards/taxonomy.md)
- [AI contribution standard](docs/standards/ai-contributions.md)
- [Prompting standard](docs/standards/prompting.md)
- [Context standard](docs/standards/context.md)
- [Evaluation standard](docs/standards/evaluation.md)

### Machine-readable policy

Use:

- [`config/schema.yaml`](config/schema.yaml)
- [`config/content-policy.yaml`](config/content-policy.yaml)
- [`config/source-policy.yaml`](config/source-policy.yaml)
- [`config/taxonomy-policy.yaml`](config/taxonomy-policy.yaml)
- [`config/validation.yaml`](config/validation.yaml)

For work inside an existing domain, also read:

`domains/<domain>/domain.yaml`

When creating corpus files, use only the applicable template under [`config/templates/`](config/templates/).

## Core invariants

- Research precedes synthesis.
- Read relevant source content. Search snippets, titles, summaries, and remembered model knowledge are not evidence.
- Prefer the strongest source that is fit for the specific claim.
- Do not generate a desired conclusion first and then search for citations that merely resemble support.
- Every externally grounded principle statement, substantive rationale claim, and recommended practice requires claim-level provenance.
- A citation must substantively support the specific claim it accompanies.
- Goals may be uncited when they are developmental objectives derived from the surrounding evidence.
- Preserve meaningful disagreement, uncertainty, scope, tradeoffs, and exceptions.
- Never fabricate sources, quotations, citations, dates, versions, or source support.
- Inspect exact source language when necessary to verify meaning, but synthesize final prose unless a short quotation is genuinely necessary.
- Do not bulk-copy source material into the repository.
- Prefer durable guidance over transient tooling fashion in principle statements.
- Optimize simultaneously for human readability, machine parseability, and AI legibility.
- Do not weaken these invariants for convenience.

## Sources of truth

Treat the following as canonical:

- `domains/**/*.md` — corpus content
- `domains/*/domain.yaml` — accepted domain taxonomy
- `config/taxonomy-policy.yaml` — rules governing taxonomy
- `docs/` — human-readable project policy and standards
- `config/` — machine-readable policy and schemas

Generated indexes, aggregates, context bundles, and machine formats are derived artifacts. Do not treat them as canonical or edit them as source material.

Explicitly user-required subdomains represent protected human intent. Agents must not silently remove, merge, rename, or materially redefine them.

## Natural-language interaction

Natural-language requests are a primary interface to the repository.

A user may specify:

- a domain to create or change;
- subdomains they explicitly care about;
- priorities or desired emphasis;
- exclusions;
- scope constraints.

Agents should:

1. Preserve explicit user intent.
2. Determine the applicable repository workflow.
3. Research unresolved taxonomy or content questions.
4. Update canonical repository state.
5. Validate the result.

Do not require users to express normal requests as YAML, configuration files, or CLI arguments when their intent can be reliably interpreted from natural language.

## Workflow routing

Use the applicable workflow:

- [Create a domain](docs/workflows/create-domain.md)
- [Update domain taxonomy](docs/workflows/update-taxonomy.md)
- [Create registered corpus content](docs/workflows/create-content.md)
- [Update corpus content](docs/workflows/update-content.md)
- [Bootstrap repository tooling](docs/workflows/bootstrap.md)

Do not bypass a defined workflow merely because the requested change appears small.

## Change discipline

The evidence and review bar rises with semantic impact:

1. Reference or link maintenance
2. Practice changes
3. Goal changes
4. Rationale changes
5. Principle wording changes
6. Principle additions, removals, or scope changes
7. Taxonomy changes, especially changes affecting explicit human priorities

Treat principle-level and taxonomy-level changes as high-impact.

Prefer the smallest change that correctly satisfies the request while preserving established meaning.

## Validation

Before completing a change:

1. Validate file structure and frontmatter.
2. Validate domain manifests, stable IDs, and taxonomy membership.
3. Validate reference definitions and destinations.
4. Validate required claim-level citations.
5. Check citation entailment for changed claims.
6. Check source authority, quality, currency, and fitness.
7. Review for duplicate, conflicting, overbroad, unsupported, or misplaced content.
8. Run repository tests and evals applicable to the change.
9. Report unresolved uncertainty explicitly rather than guessing.

If required validation tooling has not yet been implemented, follow [the bootstrap workflow](docs/workflows/bootstrap.md) before bulk-generating corpus content.

## Scope control

Do not create a domain or subdomain merely because a topic exists. Follow the [taxonomy standard](docs/standards/taxonomy.md).

Do not fill files to arbitrary target counts. Include only principles, practices, rationales, and goals that earn their place.

Do not silently resolve disagreements between credible sources. Preserve the nuance, narrow the claim, or surface the judgment for review.

Do not duplicate content solely for structural symmetry. Duplicate or specialize content only when its meaning, application, evidence, or importance materially changes within the target domain.

## Repository improvement

Treat agent failures as feedback about the system.

When a failure reveals a missing rule, ambiguous instruction, weak schema, absent test, or unenforced invariant, prefer improving the repository's documentation, configuration, validation, or evals so future agents are less likely to repeat it.

Do not patch recurring failures only at the prompt level when the repository itself can encode the solution.
