# Bootstrap Workflow

## Goal

Implement the deterministic repository harness from the accepted architecture. Do not generate corpus content during tooling bootstrap.

## Phase 0 — Architecture contract gate

This gate has passed: [Architecture](../architecture.md), the applicable standards, and `config/` define the accepted identity, citation, claim-unit, taxonomy, protected-intent, pilot-evidence, precedence, transition, validation-class, trust, and generated-output contracts. Do not reopen architecture during implementation without a concrete contract defect and required review.

## Phase 1 — Taxonomy state and pilot boundary

Preserve existing scopes, retain undocumented research-origin taxonomy as proposed, and independently review the coding taxonomy before pilot generation. Do not perform that coding review as part of architecture correction or deterministic tooling implementation.

## Phase 2 — Runtime and schema foundation

After explicit authorization:

- Select a current supported runtime and minimal libraries.
- Add exact dependency lockfiles.
- Implement the bounded canonical-text, YAML/frontmatter, discovery, and filesystem contract in [Security and trust](../standards/security.md).
- Validate `config/schema.yaml` with Draft 2020-12 format assertion.
- Reject unsupported schema/policy versions, unknown policy fields, and implicit migrations.
- Implement repository-safe discovery and stable ranged diagnostics.
- Load trusted merge-base policy, identity, and source state for pull-request transition checks; report `not_evaluated` rather than full success when that baseline is unavailable.
- Add no model SDK, embeddings, database, daemon, service, or multi-agent orchestration.

## Phase 3 — Manifest, identity, source, and taxonomy validation

- Implement manifest, lifecycle, protected-intent, scoped-uniqueness, registration, and review-state rules from `config/taxonomy-policy.yaml` and [Taxonomy](../standards/taxonomy.md).
- Implement all-time principle/source allocation and trusted-base transition rules from `config/identity-policy.yaml`.
- Implement source registration, URL/alias normalization, persistence, moves, lifecycle, collisions, and dates from `config/source-policy.yaml` and [Sources](../standards/sources.md).
- Generate deterministic taxonomy output without committing it by default.

## Phase 4 — Markdown parser and corpus structure

- Parse the YAML preamble separately from the GFM body.
- Use a real Markdown AST with source locations.
- Normalize all authoring presets into one document model.
- Implement the path/frontmatter/title and closed AST contract in `config/content-policy.yaml`.
- Prove `[1][2]` is rejected as citation style and `[1], [2]` works.

## Phase 5 — Citations, sources, and evidence records

- Implement structural citation presence, terminal-run grammar, exact local catalog/source mapping, and canonical URL-or-alias resolution without claiming entailment.
- Implement complete per-entry claim-review validation under `config/evidence-policy.yaml` and [Claim-review evidence](../standards/evidence.md). Pilot evidence becomes mandatory only when a named corpus path exists.
- Detect claim-text and source-sequence disagreement deterministically. Surface locator and relevant source-lifecycle transitions, plus operational source-content observations, as semantic re-review triggers without claiming the claim hash detected source freshness.

## Phase 6 — Links and network isolation

- Validate configured nonhistorical internal links offline under `config/validation.yaml`, retaining its exclusions and deferred fragment boundary.
- Implement external checks as a separate operational command.
- Test networking against controlled local fixtures.
- Enforce [Security and trust](../standards/security.md).

## Phase 7 — Deterministic context builder

- Accept explicit file/principle IDs.
- Build documented profiles using complete selected blocks.
- Namespace local citations when combining files.
- Record input hashes and injected revision metadata.
- Do not add semantic retrieval.

## Phase 8 — Eval harness skeleton

- Add versioned semantic fixtures, rubrics, expected results, human calibration records, and resolving evaluator configurations under `evals/`.
- Keep semantic evals non-blocking until calibrated.
- A model API is not required if interactive or manual evaluation satisfies the initial contract.

## Phase 9 — CI and cleanup

- Run build, deterministic tests, and offline validation on pull requests.
- Run external links separately on schedule/manual request.
- Use immutable action references and minimal permissions.
- Do not expose secrets to untrusted pull-request jobs.
- Remove obsolete manual inventories and tracked platform metadata.

## Phase 10 — Three-file pilot, outcome-authorized

Only after coding taxonomy acceptance, create the requested pilot files when an explicit natural-language outcome requests them. That request is the content authorization; do not require a second pre-generation confirmation after the taxonomy gate.

- `domains/coding/principles.md`
- `domains/coding/personal-growth.md`
- `domains/coding/design.md`

The pilot must include stable source records and claim-review records. Empirical review after the first production file decides whether their value justifies broader adoption; universal adoption is not the default.

## Readiness and completion criteria

The deterministic harness is ready when schemas and canonical state validate, parsing and citation contracts are proven, identity is stable, generated output is reproducible, deterministic CI passes, and semantic fixtures exist. That readiness permits an explicitly requested pilot to proceed through taxonomy and content gates.

The pilot is complete only after its exact taxonomy and principles pass required human review. Pilot completion does not authorize bulk corpus generation; the post-pilot evidence-policy and bulk-generation decisions remain separate human gates.
