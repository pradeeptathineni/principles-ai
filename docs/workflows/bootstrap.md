# Bootstrap Workflow

## Goal

Implement the repository harness before bulk-generating the principles corpus.

## Order

### 1. Materialize the repository structure

Create the approved directories from `README.md`.

Treat existing `domains/*/domain.yaml` files as accepted taxonomy state.

Do not populate domain content beyond small fixtures until validation exists.

### 2. Implement domain-manifest parsing and taxonomy aggregation

Requirements:

- Discover `domains/*/domain.yaml`.
- Validate manifests against `config/schema.yaml` and `config/taxonomy-policy.yaml`.
- Detect duplicate domain IDs/codes.
- Detect duplicate subdomain IDs/codes within domains.
- Verify every `required_subdomains` entry exists in `subdomains`.
- Validate subdomain provenance/status values.
- Build `generated/taxonomy.yaml` deterministically from manifests.
- Treat the generated aggregate as disposable.

Do not use a hand-maintained central taxonomy enumeration.

### 3. Implement Markdown parsing

Requirements:

- Parse YAML frontmatter.
- Parse CommonMark/GFM structure using a real Markdown parser.
- Extract file metadata.
- Extract principle entries.
- Extract rationale paragraphs.
- Extract practice and goal lists.
- Extract tags.
- Resolve numeric reference-style links.
- Preserve source locations where practical for useful errors.

Do not build the parser from regexes alone.

### 4. Implement deterministic validation

Implement checks from:

- `config/schema.yaml`
- `config/content-policy.yaml`
- `config/taxonomy-policy.yaml`
- `config/validation.yaml`
- target `domain.yaml` manifests

The validator should produce actionable errors with file, domain, and entry context.

Existing corpus files must be registered by the corresponding domain manifest. Registered subdomains need not all have Markdown files yet during incremental construction.

### 5. Implement code and ID tooling

At minimum:

- Validate stable domain/subdomain codes.
- Generate or validate entry ID prefixes from manifests/policy.
- Detect collisions.
- Never renumber accepted IDs automatically.

A scaffold command may propose codes for new domains/subdomains, but the accepted manifest remains canonical.

### 6. Implement reference tooling

At minimum:

- Resolve references.
- Detect duplicate definitions.
- Detect undefined references.
- Detect unused references.
- Validate URL syntax.
- Provide a link-check command.

Network link checks must distinguish temporary network failure from definitive broken links.

### 7. Implement citation-presence checks

Determine which claims require citations according to `docs/standards/citations.md`.

Flag missing citations deterministically where structure allows.

Do not pretend deterministic checks prove entailment.

### 8. Implement tests

Create fixtures for:

- Valid domain manifest.
- Duplicate domain/subdomain code.
- Missing required subdomain.
- Unregistered corpus file.
- Valid principles file.
- Valid personal-growth file.
- Valid subdomain file.
- Missing citations.
- Broken references.
- Invalid IDs.
- Heading-order errors.
- Duplicate IDs.
- Leftover placeholders.

### 9. Implement eval harness skeleton

Create contracts needed to evaluate:

- Citation entailment.
- Source quality.
- Scope calibration.
- Taxonomy fit.
- Readability.

### 10. Add CI

CI should run deterministic validation and tests on every pull request.

Expensive semantic evals may initially run selectively.

### 11. Validate templates

Run all three templates through the parser and validator using fixture substitutions.

### 12. Generate a pilot

Only after the harness passes, generate three pilot files:

- `domains/coding/principles.md`
- `domains/coding/personal-growth.md`
- `domains/coding/design.md`

Review them deeply before expanding.

### 13. Improve the harness from pilot failures

Any repeated ambiguity or failure should become better documentation, configuration, validation, tests, evals, or workflow guidance.

### 14. Expand gradually

Generate content domain by domain. New domains follow `docs/workflows/create-domain.md` rather than editing a central taxonomy list.

## Completion criteria

Bootstrap is complete when:

- Domain manifests are validated.
- Repository-wide taxonomy can be generated deterministically from manifests.
- Templates are parseable.
- Deterministic validation is enforced in CI.
- Corpus structure can be converted to a structured representation.
- Reference links resolve correctly.
- Required citation presence is enforceable.
- Representative semantic eval fixtures exist.
- The three coding pilot files pass human review.
