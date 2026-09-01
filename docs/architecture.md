# Architecture

## Design principle

The repository should carry most of the durable intelligence required to maintain itself.

Task prompts stay lean. Stable policy belongs in versioned repository context; accepted taxonomy belongs with the domain it governs; mechanical rules should be enforced by tooling where practical.

## Layers

```text
Human intent
    │
    ▼
AGENTS.md
    │
    ├──► docs/                       human-readable policy and workflows
    ├──► config/                     machine-readable policy and templates
    ├──► domains/<domain>/domain.yaml accepted domain taxonomy
    │
    ▼
Agent workflow
    │
    ├── interpret intent
    ├── scope / taxonomy research
    ├── source research
    ├── evidence extraction
    ├── synthesis
    ├── verification
    ├── validation
    └── review
    │
    ▼
domains/**/*.md                     canonical corpus
    │
    ├──► generated taxonomy/indexes
    ├──► generated context
    ├──► parsed JSON
    ├──► eval inputs
    └──► downstream AI projects
```

## Canonical versus derived data

### Canonical

- `domains/**/*.md` for corpus content.
- `domains/*/domain.yaml` for accepted domain taxonomy and stable codes.
- `docs/` for human-readable policy.
- `config/` for machine-readable policy.
- `AGENTS.md` for routing.

### Derived

Examples:

- `generated/taxonomy.yaml`, assembled from domain manifests.
- Parsed JSON representations.
- Search indexes.
- Embeddings.
- Compiled AI context packs.
- Citation graphs.
- Source freshness reports.
- Quality reports.

Derived artifacts must be reproducible from canonical inputs and must not be hand-edited.

## Taxonomy architecture

Taxonomy policy and taxonomy state are deliberately separated.

```text
config/taxonomy-policy.yaml
        │
        │ governs
        ▼
domains/*/domain.yaml
        │
        │ aggregate
        ▼
generated/taxonomy.yaml
```

`config/taxonomy-policy.yaml` defines universal rules such as naming, required domain files, code constraints, and protection of explicitly user-required subdomains.

Each `domain.yaml` records the currently accepted taxonomy for one domain. This keeps domain growth local, reviewable, and extensible instead of treating one central file as a closed ontology.

A repository-wide taxonomy is a derived convenience artifact, not a canonical input.

## Interaction architecture

Interactive domain creation should normally begin with natural language rather than a rigid input script.

Example:

> Add a teaching domain. Tutoring, students, teachers, parents, classroom, and virtual teaching are especially important to me. Research the other major subdomains and build the domain according to repository policy.

The agent interprets that request, records explicit subdomains as protected intent, researches the rest of the domain structure, and materializes a validated manifest.

Scripts should enforce invariants and perform deterministic transformations; they should not replace the agent's judgment about domain boundaries or user intent.

Programmatic model orchestration may be added later. When it is, context builders should assemble the same repository-local policy and target-domain context that an interactive Codex session reads directly.

## Context architecture

Context uses progressive disclosure:

1. `AGENTS.md` supplies the stable map and invariants.
2. The task determines which standards/workflows apply.
3. Machine rules are read from `config/`.
4. Taxonomy work reads the relevant `domain.yaml` or, for a new domain, neighboring manifests.
5. Content work reads only relevant corpus files and evidence.
6. Generated context omits unrelated repository material.

## Corpus data model

A corpus file is structured Markdown with YAML frontmatter.

A principle entry contains:

- Stable ID and memorable title.
- Normative principle statement.
- Rationale.
- Actionable practices.
- Developmental goals.
- Tags.
- Claim-level reference links.

The parser should use a Markdown parser/AST rather than line-oriented regular expressions.

## Stable IDs

Domain and subdomain codes are registered in `domain.yaml`. Universal file codes are defined by `config/taxonomy-policy.yaml`.

Entry IDs are generated and validated from those registered codes:

```text
<DOMAIN-CODE>-<FILE-CODE>-<NNN>
```

Once accepted, codes and entry IDs are stable. Tooling may propose or scaffold codes, but it must validate uniqueness and must not silently renumber existing identities.

## Reference model

Reference labels are local to a file:

```markdown
A supported claim. [1]

[1]: https://example.com/source
```

The parser resolves local labels to URLs. Repository-wide source identity can later be derived from normalized canonical URLs and source metadata.

## Research evidence

Agents should inspect exact source language during research to verify meaning and entailment. Exact passages are working evidence, not the canonical corpus.

Do not store bulk source text merely to make future verification convenient.

## Automation boundary

Use deterministic code for deterministic jobs:

- Manifest/schema validation.
- Code and ID validation.
- Taxonomy aggregation.
- File-registration checks.
- Parsing.
- Reference resolution.
- Link checking.
- Citation-presence checks.
- Context assembly.

Use AI judgment for tasks such as:

- Interpreting user priorities.
- Researching domain coverage.
- Determining whether a candidate subdomain is materially distinct.
- Source fitness.
- Principle synthesis.
- Citation entailment.
- Nuance and disagreement.
- Readability review.

Rule of thumb: **AI exercises judgment; code enforces invariants.**
