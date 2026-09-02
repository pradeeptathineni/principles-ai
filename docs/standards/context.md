# Context Standard

## Principle

Give an AI the smallest complete context needed to make the current decision correctly. More context is not automatically better.

## Layers

1. `AGENTS.md` router and universal invariants.
2. Applicable standards and workflow.
3. Relevant executable configuration.
4. Target domain manifest and taxonomy review state.
5. Target corpus and neighboring content needed for scope.
6. Referenced source records and claim-review records where relevant.
7. Task evidence, diffs, diagnostics, tests, or eval results.

Do not automatically load the entire corpus or all standards.

## Interactive and programmatic use

Interactive agents read repository-local context directly. Future automation must assemble the same canonical sources rather than maintain a divergent policy copy.

## Context selection

Prefer explicit stable file and principle IDs when scope is known. Principle IDs are location-independent. Source IDs and review provenance should travel with selected claims when the profile requires verification.

Initial derived profiles may include:

- `minimal`: ID, title, statement, source IDs.
- `standard`: statement, all rationale, all practices, applicability, source IDs.
- `learning`: full selected entries and used references.
- `verification`: claim blocks, source records, locators, and review outcomes.

Deterministic tooling must not guess which rationale is “essential” or which practice is “relevant.” Include complete blocks for the selected profile.

## Traceability and reproducibility

Derived context records file IDs, principle IDs, source IDs, claim hashes, input hashes, profile, filters, and explicit source revision. Timestamps are injected explicitly rather than read implicitly by pure generators.

Document-local citation labels must be namespaced or rewritten safely when multiple files are combined.

## Retrieval

Semantic retrieval may later supplement explicit selection, but it must not silently omit known mandatory principles. Embeddings and semantic search are deferred until the pilot establishes need.

## Evaluation

Measure mandatory coverage, relevance, unnecessary-token rate, preservation of scope and disagreement, provenance, and downstream quality. Do not optimize token count at the expense of correct judgment.
