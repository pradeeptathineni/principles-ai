# Taxonomy Standard

## Purpose

The taxonomy creates useful entry points into bodies of practice. It is not intended to model a perfect ontology of human knowledge or freeze a forever-complete list of domains.

Taxonomy is expected to evolve through human intent, AI-assisted research, validation, and review.

## Canonical model

Taxonomy policy and taxonomy state are separate.

### Policy

`config/taxonomy-policy.yaml` defines universal rules such as:

- Required files shared by every domain.
- Naming conventions.
- Stable-code constraints.
- Allowed manifest fields and origins.
- Protection of explicit human requirements.
- Aggregation rules.

It must not enumerate every domain and subdomain.

### Accepted domain taxonomy

Each domain owns:

```text
domains/<domain>/domain.yaml
```

This manifest is the canonical accepted taxonomy for that domain.

### Repository-wide taxonomy

A repository-wide aggregate may be generated from all domain manifests:

```text
generated/taxonomy.yaml
```

The aggregate is derived and disposable. Do not hand-edit it.

## Root

All corpus domains live under:

```text
domains/
```

This keeps the knowledge corpus and its taxonomy state separate from repository machinery.

## Universal files

Every domain supports:

```text
principles.md
personal-growth.md
```

Their stable file codes are defined in `config/taxonomy-policy.yaml`.

### `principles.md`

The domain's highest-order guidance.

### `personal-growth.md`

How to continuously improve within that domain.

## Domain manifests

A domain manifest records:

- Domain ID, title, stable code, status, and scope description.
- Explicitly required subdomains supplied by a human, when any.
- Accepted subdomains.
- Stable subdomain codes.
- Provenance of each subdomain's inclusion.

A manifest may register a subdomain before its Markdown file is created. Incremental corpus generation is expected.

## Human-required subdomains

A user may explicitly identify subdomains that matter to them.

Example:

> Build a teaching domain. Tutoring, students, teachers, parents, classroom, and virtual teaching are especially important to me.

Those scopes belong in `required_subdomains` and must also appear in `subdomains`.

`required_subdomains` represents protected human intent:

- An agent must not silently remove, merge, rename, or deprecate one.
- An agent may identify overlap or recommend a better structure.
- Applying a change that alters protected intent requires explicit human approval.

User-required does not mean exempt from quality standards. The agent still researches how the requested scope should be defined and what evidence belongs within it.

## AI-discovered subdomains

When creating or expanding a domain, the agent should research the discipline rather than treating the user's initial list as exhaustive.

The agent should:

1. Define the domain boundary.
2. Inspect neighboring domain manifests for overlap.
3. Identify authoritative frameworks, standards, roadmaps, curricula, bodies of knowledge, and mature practice that reveal major dimensions of the domain.
4. Build a coverage map of candidate subdomains.
5. Preserve all user-required subdomains.
6. Add only materially distinct, durable, useful scopes.
7. Avoid files created merely for symmetry.
8. Record the accepted result in `domain.yaml` before bulk content generation.

## Subdomain admission test

Create a subdomain only when the topic represents a materially distinct dimension of excellent practice.

A useful subdomain usually has:

- Distinct decisions or behaviors.
- Distinct authoritative references or evidence emphasis.
- Enough durable content to justify separate navigation.
- A clear boundary from neighboring files.
- Meaningful value for human learning or AI context retrieval.

A topic should remain within another file when separation would create thin, duplicative, or artificial structure.

## Overlap

Overlap across domains is allowed when context materially changes:

- Meaning.
- Practices.
- Goals.
- Evidence.
- Scope.

For example:

```text
engineering/security.md
coding/security.md
devops/security.md
cloud/security.md
ai/security-privacy.md
```

can all be useful without violating the repository model.

Avoid duplication that adds no contextual value.

## Flat domain navigation

Domains remain siblings even when one can theoretically be nested under another.

For example, keep:

```text
domains/cloud/
domains/aws-cloud/
domains/gcp-cloud/
domains/azure-cloud/
```

rather than nesting vendor domains beneath `cloud/`.

The goal is discoverability and task-oriented context retrieval, not taxonomic purity.

## Naming

### Directories and files

Use lowercase kebab-case.

### Stable file IDs

Corpus frontmatter file IDs use dot notation:

```text
coding.principles
coding.personal-growth
coding.design
```

### Codes

Each domain manifest registers a stable domain code and a stable code for each subdomain.

Universal file codes are defined by policy.

Entry IDs use:

```text
<DOMAIN-CODE>-<FILE-CODE>-<NNN>
```

Examples:

```text
COD-PRI-001
COD-GRO-002
COD-DES-003
DEV-IAC-004
AWS-IAM-001
TEA-TUT-002
```

Codes and IDs are stable identities. Do not renumber existing entries merely because display order changes. Do not reuse retired IDs for unrelated principles.

Tooling should generate or validate IDs from registered codes rather than asking an agent to improvise identifiers repeatedly.

## Subdomain provenance

Manifest entries may record:

- `user`: explicitly requested by a human.
- `research`: introduced through domain research.
- `mixed`: explicitly requested and independently supported during research.
- `policy`: introduced by repository-wide policy.

Provenance does not rank quality. It records why the scope exists and helps protect human intent.

## Adding a domain

Follow `docs/workflows/create-domain.md`.

A new domain request may be natural language and may include zero or more explicit subdomains.

The agent should not force the user to supply YAML, IDs, or a complete taxonomy.

## Updating a domain taxonomy

Follow `docs/workflows/update-taxonomy.md` for:

- Adding a subdomain.
- Renaming or merging subdomains.
- Deprecating or removing subdomains.
- Revising domain scope.
- Revising stable codes.
- Revising protected human requirements.

Taxonomy changes are high-impact and should be reviewed before bulk content moves or generation.

## Moving content

When moving an existing principle to a more appropriate file:

- Preserve semantic identity when practical.
- Update cross-references.
- Record intentional ID changes when codes must change.
- Avoid duplicate active copies unless contexts genuinely differ.

## Validation

At minimum, tooling should verify:

- One manifest per accepted domain directory.
- Unique domain IDs and codes.
- Unique subdomain IDs and codes within a domain.
- All `required_subdomains` exist in `subdomains`.
- Existing Markdown subdomain files are registered in the manifest.
- Existing Markdown files use IDs/codes consistent with the manifest.
- Universal files use policy-defined codes.
- Manifest naming and status values are valid.

The validator need not require every registered subdomain file to exist during incremental corpus construction.
