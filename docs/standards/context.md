# Context Standard

## Principle

Give an AI the smallest complete context needed to make the current decision correctly. More context is not automatically better.

## Layers

1. `AGENTS.md` router and universal invariants.
2. One applicable outcome workflow; load detailed standards only for relevant ambiguity or uncommon cases.
3. Relevant executable configuration.
4. Target domain manifest and lifecycle state.
5. Target corpus and neighboring content needed for scope.
6. Referenced source records and claim-review records where relevant.
7. Task evidence, diffs, diagnostics, tests, or eval results.

Do not automatically load the entire corpus or all standards.

## Interactive and programmatic use

Interactive agents read repository-local context directly. The deterministic context exporter is optional downstream tooling and is not required for authoring. Future automation must assemble the same canonical sources rather than maintain a divergent policy copy.

For a long domain-authoring run or context handoff, a disposable run checkpoint may bind explicit coordination declarations to the current task workset. It can reduce repeated reconstruction, but it is not canonical state, evidence that a source was interpreted correctly, proof that semantic review occurred, or human approval. Changed bound inputs invalidate it.

## Context selection

Prefer explicit stable file and principle IDs when scope is known. Principle IDs are location-independent. Source IDs and review provenance should travel with selected claims when the profile requires verification.

Derived context export version 2 includes these profiles:

- `minimal`: ID, title, statement, source IDs and bindings. This lossy profile is `reference-only`: fetch the same bound selection at a fuller profile before operational use.
- `standard`: statement, all rationale, all practices, applicability, source IDs.
- `learning`: full selected entries and used references.
- `verification`: claim blocks, source records, locators, and review outcomes.

Every profile carries the exact corpus file `status`, `last_reviewed`, and `reviewed_content_sha256` for each selected entry, plus namespaced references and `source_inputs` (stable source ID, native status, path, and input hash). Native corpus status is `draft` or `active`; taxonomy `deprecated` is not a corpus status and deprecated taxonomy cannot contain corpus content. Native source statuses remain `active`, `moved`, `superseded`, `withdrawn`, or `unavailable`. Unsupported statuses, unresolved citations, missing sources, and absent input hashes fail explicitly rather than acquiring authority.

Selection and default profile behavior are unchanged: files or explicit principle IDs can select drafts, and the CLI defaults to `standard`. Selection never activates content. `usage: qualified-guidance` means the profile retains the complete rationale, practices, and applicability, including all authored conditions and material exceptions; it grants no approval or source fitness. Exceptions remain in their canonical applicability paragraphs, not a machine-inferred summary. `omitted_sections` declares profile limits, including full source records and evidence outside `verification`. Verification includes full source records and existing review evidence; absent evidence remains `null`, never a successful review.

Deterministic tooling must not guess which rationale is “essential” or which practice is “relevant.” Include complete blocks for the selected profile.

## Traceability and reproducibility

Derived context records file IDs, principle IDs, source IDs, claim hashes, input hashes, profile, filters, and explicit source revision. Timestamps are injected explicitly rather than read implicitly by pure generators.

Document-local citation labels are namespaced by stable file ID in both claim text and references, so local label `1` in two files cannot collide.

All profiles bind selected corpus, cited source records, and any existing evidence and referenced evaluator configuration inputs, even when the profile omits their bodies. The top-level `input_sha256` is SHA-256 of UTF-8 `JSON.stringify({ source_revision, inputs, selection })`, with those keys in that order, `inputs` sorted by path as `{ path, sha256 }`, and `selection` sorted by principle ID as `{ id, file_id }`. This digest excludes profile, selector spelling, and generation time, allowing a minimal reference to fetch the same selection at verification depth. It changes when any bound bytes, selected identities, or declared revision change.

Pass `expectedInputSha256` to `buildContext` or `--expected-input-sha256 SHA256` to `context` for a bound refetch. A mismatch fails before output is written. Consumers must reject unsupported versions and reference-only input for operational delivery, compare the expected binding, and apply their own lifecycle/source-use policy. A digest binds declared local inputs; it does not authenticate a Git revision or detect a remote source change without updated source observations. Actual Context consumer qualification is separate from producer fixture acceptance.

## Retrieval

Semantic retrieval may later supplement explicit selection, but it must not silently omit known mandatory principles. Embeddings and semantic search are deferred until the pilot establishes need.

## Evaluation

Measure mandatory coverage, relevance, unnecessary-token rate, preservation of scope and disagreement, provenance, and downstream quality. Do not optimize token count at the expense of correct judgment.

Architecture review records the minimum routed workset, changed architecture files, and a deterministic UTF-8 byte estimate. These measurements expose growth and duplicated loading but do not determine whether the selected context is semantically sufficient. A change that expands mandatory agent context requires architecture review even when validation remains structurally correct.
