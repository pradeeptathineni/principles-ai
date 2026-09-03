# Bootstrap and Harness Workflow

## Scope

Use this supporting route to build or materially change the deterministic repository harness. Do not generate or refine corpus content as part of tooling work. The accepted architecture, standards, and `config/` are the contract; reopen them only for a concrete defect through [Architecture self-review](review-architecture.md).

## Required capabilities

Maintain these boundaries together:

1. **Runtime and policy loading:** supported runtime/lockfile; bounded canonical UTF-8/YAML/frontmatter loading; Draft 2020-12 format assertion; closed fields and versions; no implicit coercion or migration; safe discovery and diagnostics.
2. **Trusted transitions:** compare policy, identity, source, taxonomy, protected intent, evidence, and corpus state with the trusted merge base. Report unavailable history as `not_evaluated`, never full transition success.
3. **Taxonomy, identity, and sources:** validate lifecycle, scope definitions, protected intent, uniqueness, all-time allocation, relationships, URL/alias identity, source lifecycle, and moves under their executable policies. Aggregated taxonomy remains derived.
4. **Corpus and citations:** parse frontmatter separately from GFM, enforce the configured closed AST/path/title contract, and validate structural citations plus exact bibliography/source mapping without claiming entailment.
5. **Claim-review provenance:** validate configured complete entry records, hashes, source order, locators, outcomes, and invalidation. Surface source/locator/lifecycle/content-change triggers without claiming hash-based freshness.
6. **Links and networks:** validate internal links offline. Keep external checks isolated, bounded, credential-free, and protected against unsafe destinations/redirects under [Security and trust](../standards/security.md).
7. **Context and coordination:** explicit file/principle selection, complete profile blocks, citation namespacing, input hashes, and injected revision/time metadata. Worksets and checkpoints remain derived and do not prove research or approval.
8. **Mutation and activation:** reviewed plans may drive atomic allocation, registration, materialization, citation projection, evidence scaffolds, and already-approved activation. Use preconditions, one writer lock, full validation, and rollback; tooling selects no evidence or principle meaning and authenticates no approval.
9. **Evaluation and CI:** version fixtures, rubrics, configurations, and calibration. Deterministic checks block CI; operational checks remain separate; semantic evals remain advisory until calibrated; CI uses minimal permissions, pinned dependencies/actions, and no privileged secrets in untrusted jobs.

Do not add a model SDK, embeddings, database, daemon, service, or programmatic multi-agent orchestration without demonstrated need and architecture approval.

## Corpus boundary and completion

An explicit natural-language content outcome—not harness readiness—authorizes corpus work. It authorizes ordinary prerequisites and drafting after taxonomy acceptance, but exact new taxonomy and activation of new or changed principles retain their human gates.

Harness work is complete when canonical state validates, transition limitations are explicit, parsing/citation/identity contracts have positive and negative tests, generated output is reproducible, route ownership and terminal states agree, internal links resolve, CI passes, and semantic fixtures exist. Passing that boundary proves deterministic readiness, not corpus quality, evidence fitness, or approval.
