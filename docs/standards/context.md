# Context Standard

## Principle

Give an AI the smallest complete context needed to make the current decision correctly.

More context is not automatically better. Irrelevant context competes with the task, evidence, and applicable rules.

## Context layers

### Layer 1 — Stable repository map

`AGENTS.md`

Contains mission-level orientation, core invariants, policy pointers, and validation expectations.

### Layer 2 — Applicable standards and workflow

Load only documents relevant to the task.

Examples:

- New domain: taxonomy, research, prompting, AI-contribution standards, and create-domain workflow.
- New corpus file: content, research, sources, citations, writing, taxonomy, and create-content workflow.
- Parser bug: architecture, schema, validation, and bootstrap guidance.

### Layer 3 — Machine policy

Load relevant portions of:

- `config/schema.yaml`
- `config/content-policy.yaml`
- `config/source-policy.yaml`
- `config/taxonomy-policy.yaml`
- `config/validation.yaml`

### Layer 4 — Taxonomy state

For existing domain work, load:

```text
domains/<domain>/domain.yaml
```

For a new domain, inspect only neighboring or overlapping manifests needed to reason about boundaries.

A generated repository-wide taxonomy may be used for discovery, but canonical decisions come from individual manifests.

### Layer 5 — Target corpus

Load:

- The file being changed.
- Neighboring files required to understand boundaries or duplication.
- Parent domain `principles.md` when relevant.
- Directly referenced principles required for consistency.

Do not automatically load the entire corpus.

### Layer 6 — Task evidence

Load source passages, retrieved documentation, diffs, test output, or eval results needed for the current judgment.

## Interactive versus programmatic execution

### Interactive Codex

When Codex operates inside the repository, it should read repository-local context directly through `AGENTS.md` and task-relevant files. The user need not paste the context into every prompt.

### Programmatic automation

Future model-driven automation should use a context builder that assembles the same applicable policy, target manifest, corpus files, and evidence.

Do not create a second, divergent copy of project policy inside application code.

## Context assembly for downstream projects

Future tooling should build context from selected stable IDs or scopes.

Example:

```yaml
include:
  files:
    - coding.principles
    - coding.design
    - devops.infrastructure-as-code
  principles:
    - COD-PRI-001
    - COD-DES-003
```

The context builder should:

1. Resolve requested IDs through domain manifests and corpus metadata.
2. Include the principle statement.
3. Include practices relevant to the downstream task.
4. Include rationale when needed for correct judgment.
5. Preserve provenance.
6. Avoid unrelated entries.
7. Record canonical IDs and revisions used.

## Context profiles

Future implementation may support profiles such as:

- `minimal`: principle statements and IDs.
- `standard`: principles, practices, and essential rationale.
- `learning`: full entries plus references.
- `verification`: claims plus source metadata/evidence needed for checking.

Profiles are derived artifacts. The Markdown corpus remains canonical.

## Retrieval

Prefer explicit file or stable-ID selection when scope is known.

Semantic retrieval may supplement explicit selection for broad tasks, but should not silently omit known mandatory principles.

## Traceability

Generated context should record:

- Generation timestamp.
- Source commit when available.
- Domain manifest revisions or hashes when available.
- Canonical file IDs.
- Principle IDs.
- Context profile.
- Filters applied.

## Context evaluation

Measure relevance, mandatory coverage, unnecessary-token rate, preservation of nuance, preservation of provenance, and downstream task quality.

Do not optimize token count at the expense of necessary reasoning context.
