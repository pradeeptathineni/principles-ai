# Principles

An AI-maintained, evidence-grounded knowledge system for durable principles, actionable practices, and personal-growth goals across professional and technical domains.

The repository is designed to serve four purposes at once:

1. A human learning and reflection resource.
2. A curated source of truth for standards and judgment.
3. A structured context source for AI-assisted work.
4. A continuously improvable corpus maintained through research, validation, and review.

> The repository is currently in its foundation/bootstrap stage. Domain content is generated only after the research, source, citation, and validation systems are established.

## Repository model

```text
principles/
├── AGENTS.md                  # Agent entry point and context map
├── domains/                   # Canonical corpus + per-domain taxonomy manifests
├── docs/                      # Human-readable project policy and workflows
├── config/                    # Machine-readable policy and templates
├── prompts/                   # Reusable task prompts, when needed
├── scripts/                   # Parsers, validators, context builders, maintenance tools
├── tests/                     # Deterministic tests for repository tooling
├── evals/                     # AI-quality evaluation fixtures and harnesses
├── generated/                 # Disposable derived indexes/aggregates/context
└── .github/                   # CI and pull-request automation
```

## Canonical sources of truth

| Layer                   | Purpose                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `domains/**/*.md`       | Human-readable principles, practices, goals, and citations           |
| `domains/*/domain.yaml` | Accepted taxonomy and stable codes for each domain                   |
| `docs/`                 | Project philosophy, standards, architecture, and workflows           |
| `config/`               | Machine-readable policy and templates                                |
| `AGENTS.md`             | Short map telling agents where to find applicable rules              |
| `generated/`            | Disposable outputs derived from canonical sources; never hand-edited |

`config/taxonomy-policy.yaml` governs how taxonomy is created and changed. It intentionally does not hardcode every domain or subdomain.

A generated repository-wide taxonomy may be built from `domains/*/domain.yaml` when tooling needs one.

## Human intent and AI taxonomy

A user can ask for a domain in natural language and explicitly name subdomains that matter to them. Those explicit priorities are preserved in the domain manifest. The agent then researches the discipline, identifies other major subdomains, checks overlap with the existing corpus, and proposes or builds the accepted taxonomy according to repository standards.

This allows the taxonomy to evolve without requiring users to maintain YAML by hand and without allowing automation to silently discard personally important scopes.

## Start here

Before generating domain content, read:

- [`docs/project.md`](docs/project.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/standards/content.md`](docs/standards/content.md)
- [`docs/standards/research.md`](docs/standards/research.md)
- [`docs/standards/sources.md`](docs/standards/sources.md)
- [`docs/standards/citations.md`](docs/standards/citations.md)
- [`docs/standards/writing.md`](docs/standards/writing.md)
- [`docs/standards/taxonomy.md`](docs/standards/taxonomy.md)
- [`docs/standards/ai-contributions.md`](docs/standards/ai-contributions.md)
- [`docs/standards/prompting.md`](docs/standards/prompting.md)
- [`docs/standards/context.md`](docs/standards/context.md)
- [`docs/standards/evaluation.md`](docs/standards/evaluation.md)

For the initial implementation sequence, follow [`docs/workflows/bootstrap.md`](docs/workflows/bootstrap.md).

## Core philosophy

Research before synthesis. Cite evidence, not topics. Prefer primary and authoritative sources. Read the source itself. Preserve nuance and disagreement. Never manufacture a principle and search afterward for something that appears to support it.

A principle earns its place through importance, durability, evidence, and applicability—not because content exists to fill a file.
