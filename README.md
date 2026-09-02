# Principles

An AI-assisted, evidence-grounded knowledge system for durable principles, actionable practices, rationales, and optional personal-growth goals across professional and technical domains.

It is a human learning resource, a curated source of considered guidance, structured context for AI-assisted work, and a maintainable corpus improved through research and review.

> The deterministic harness is implemented. Natural-language outcomes such as `Create domains/coding/design.md` and `Fully furnish the coding domain.` are sufficient; the repository owns prerequisite orchestration and stops only for genuine judgment.

## Deterministic tooling

The offline harness uses Node.js 24 and an exact npm lockfile:

```text
npm ci --ignore-scripts
npm run build
npm test
npm run validate
```

Use `node bin/principles.js --help` for taxonomy generation, normalized parsing, optional explicit-selection context export, trusted-merge-base validation, JSON diagnostics, and isolated operational link checks. External network checks never run as part of ordinary validation.

Tooling does not accept principles or prove semantic quality. Users request outcomes; agents orchestrate prerequisites. An unchanged registered target named by the user needs no separate taxonomy ceremony; new or materially changed taxonomy and exact principle activation remain human-governed.

## Repository model

```text
principles/
├── AGENTS.md                  # repository router and universal invariants
├── domains/                   # canonical taxonomy state and corpus
├── sources/                   # canonical source identity and lifecycle records
├── evidence/                  # optional compact provenance; required only for configured paths
├── docs/                      # semantic policy, architecture, standards, workflows, reviews
├── config/                    # executable schemas and deterministic configuration
├── prompts/                   # lean reusable task prompts, when justified
├── scripts/                   # deterministic build tooling and CLI documentation
├── tests/                     # deterministic tooling fixtures and tests
├── evals/                     # semantic fixtures, rubrics, calibration, evaluator setup
├── generated/                 # disposable derived outputs; not committed by default
└── .github/                   # deterministic and isolated operational CI
```

## Canonical authority

`docs/` owns semantic meaning and workflow; `config/` owns executable syntax and deterministic constraints. Domain manifests own taxonomy state and protected intent; domain Markdown, source records, retained evidence records, and eval assets are canonical in their respective directories. `generated/` contains only reproducible derived outputs and is never canonical.

See [Architecture](docs/architecture.md), [Taxonomy](docs/standards/taxonomy.md), [Sources](docs/standards/sources.md), and [Claim-review evidence](docs/standards/evidence.md) for the complete authority, lifecycle, identity, and provenance contracts. Exact structural rules belong in executable configuration rather than duplicated prose.

## Start here

- [Project](docs/project.md)
- [Architecture](docs/architecture.md)
- [Routine content workflow](docs/workflows/create-content.md)
- [Domain furnishing workflow](docs/workflows/furnish-domain.md)
- [Schema and policy versions](docs/schema-versions.md)
- [Bootstrap workflow](docs/workflows/bootstrap.md)
- [Outcome orchestration workflow](docs/workflows/orchestrate-outcome.md)
- [Historical architecture review](docs/reviews/2026-09-01-architecture-audit.md)

The review is historical input, not canonical policy. Accepted decisions are authoritative only where encoded in current `docs/`, `config/`, manifests, templates, and workflows.
