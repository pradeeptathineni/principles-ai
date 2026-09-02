# Architecture

## Design principle

The repository should carry the durable intelligence required to maintain itself while keeping different kinds of authority explicit.

- Humans own intent and governance.
- `docs/` owns semantic policy and workflow.
- `config/` owns executable structure and deterministic constraints.
- Canonical content, taxonomy, source identity, and retained review provenance remain separate from derived outputs.

## Layers

```text
Human intent and governance
        │
        ▼
AGENTS.md router
        │
        ├──► docs/                 semantics, standards, workflows, security
        ├──► config/               executable schemas, deterministic rules, ledgers
        ├──► domains/              taxonomy state and canonical corpus
        ├──► sources/              stable source identity and lifecycle
        ├──► evidence/             optional claim-review provenance
        └──► evals/                versioned semantic fixtures and evaluator setup
                 │
                 ▼
        Agent and tooling workflow
                 │
                 ├── deterministic validation
                 ├── operational checks
                 ├── semantic evaluation
                 └── human approval
                 │
                 ▼
        generated/                 disposable derived artifacts
```

## Policy precedence

`config/` is authoritative for executable syntax, required fields, types, enums, patterns, and deterministic configuration. `docs/` is authoritative for semantic meaning, rationale, workflow, research judgment, and governance.

Prose should link to executable rules instead of duplicating exact patterns or enum lists. If prose and executable configuration conflict, stop and correct both; do not silently choose one.

Schemas use JSON Schema Draft 2020-12 with asserted formats and reject unknown fields unless explicitly extensible. Schema and policy versions are compatibility boundaries: unsupported versions, unknown policy fields, silent coercion, and implicit migration fail. Version changes require explicit lossless migration and human approval. See [Schema and policy versions](schema-versions.md).

Permanent identity, source, and policy-history rules include transition properties. Pull-request validation compares proposed state with trusted merge-base state. Without that baseline, snapshot validation may run, but transition checks are `not_evaluated` and must not be reported as proof of historical non-reuse, valid moves, or append-only history.

## Canonical data

- `AGENTS.md` — routing and universal invariants.
- `docs/` and `config/` — semantic policy and executable contracts, respectively.
- `domains/*/domain.yaml` and `domains/**/*.md` — taxonomy/protected intent and corpus content.
- `sources/*.yaml` and `evidence/claims/*.yaml` — stable source records and retained claim-review provenance.
- `evals/` — versioned semantic fixtures, calibration, and evaluator configurations.
- `config/identity-ledger.yaml` — all-time identity allocation, retirement, and relationships.

Historical reviews under `docs/reviews/` are not canonical policy.

## Derived data

Examples include aggregated taxonomy, parsed JSON, search indexes, embeddings, context packs, citation graphs, freshness reports, and quality reports.

Derived outputs are disposable, reproducible from canonical inputs, and not committed by default. A concrete consumer may justify publication with explicit source revision, input hashes, and injected generation metadata. Pure generators do not read implicit wall-clock state. File discovery is deterministic; manual inventories are not architectural state.

## Taxonomy architecture

`config/taxonomy-policy.yaml` governs executable rules; each domain manifest records local lifecycle, state, and protected intent. Lifecycle distinguishes unaccepted `proposed` candidates, human-approved `accepted` taxonomy, and retained inactive `deprecated` state. Origin records provenance, not quality or acceptance. Content coverage is derived independently from validated files.

Domain purpose, required subdomains, priorities, exclusions, and scope notes are protected. They cannot be silently removed, deprecated, or materially redefined. Accepted state requires complete review metadata and human approval; protected required scopes of an accepted domain are accepted. Existing undocumented research-origin taxonomy remains proposed, and coding is reviewed before the pilot. The complete lifecycle and review combinations are in [Taxonomy](standards/taxonomy.md).

## Corpus architecture

Corpus files combine YAML frontmatter with a GFM body; all authoring presets share one closed parser grammar. Each entry has an immutable repository-wide identity, one cited statement, cited top-level rationale and practice claim blocks, cited top-level Applicability paragraphs when present, and optional Goals and Tags. Introductions are editorial scope and cannot evade citation rules. Raw HTML is forbidden until a concrete need is reviewed.

`config/content-policy.yaml` owns the exact AST, ordering, bibliography, and path/frontmatter/title projections; templates add no grammar. [Content](standards/content.md), [Citations](standards/citations.md), and [Writing](standards/writing.md) define the human-readable semantics.

## Principle identity

Principle IDs such as `PRN-000001` are location-independent and never reused. Moves preserve IDs; splits retire the original, allocate at least two children, and record `derived_from` from child to original; merges preserve one survivor and record `replaced_by` from each retired identity to it. Domain and subdomain codes are taxonomy metadata, not identity.

The ledger retains contiguous all-time allocations, including retired IDs. Relationships remain traceable, allocated, directed, unique, and acyclic. Trusted-base transitions are monotonic and append-only; split children are new in that transition and a merge survivor pre-exists and remains active. Corrective history rewrites require explicit versioned migration and human approval. Source allocations follow the same all-time rules, with retirement limited to unused cancelled or erroneous allocations. Exact invariants are in `config/identity-policy.yaml`; semantic use is in [Taxonomy](standards/taxonomy.md) and [Sources](standards/sources.md).

## Source identity and citations

Sources use repository-wide IDs such as `SRC-000001`; identity survives URL moves, aliases, title corrections, and lifecycle changes. Canonical URLs and aliases use only the bounded normalization in `config/source-policy.yaml`, are repository-wide unique under that normalization, and are not fuzzily rewritten. A move preserves the ID and record, makes the current destination canonical, and retains prior URLs as aliases. Supersession is acyclic and points to another registered, non-retired source.

Corpus citations use document-local numeric reference links:

```markdown
A supported claim. [1]

A claim supported by two sources. [1], [2]
```

Adjacent `[1][2]` is forbidden because GFM parses it as one full reference link. The visible bibliography maps each local label to a stable source ID:

```markdown
1. [Source title][1] — `SRC-000001`

[1]: https://example.com/current-url
```

Used labels, visible bibliography entries, and numeric definitions form an exact one-to-one catalog under `config/content-policy.yaml`. Deterministic tooling proves syntax, resolution, and mapping, not entailment, authority, or fitness. See [Sources](standards/sources.md) and [Citations](standards/citations.md).

## Claim-review provenance

Claim-review provenance uses one complete record per entry, covering every citation-required claim block and cited goal with normalized claim hashes, exact resolved source order, locators, outcomes, dates, and reviewer configuration. Records are required only for the three configured pilot paths when they exist and remain optional elsewhere until post-pilot human review. Their absence before the authorized pilot is valid.

Text or source-sequence disagreement is deterministic; locator changes, relevant source lifecycle changes, and observed source-content changes require the applicable transition, operational, and semantic review. Claim hashes do not detect source content changing in place. Do not retain bulk source content. See [Claim-review evidence](standards/evidence.md) and `config/evidence-policy.yaml`.

## Interaction and context

Natural language remains primary for intent and judgment; scripts handle deterministic work. Automation assembles the same canonical policy and target context rather than copying it into prompts. Context loads progressively from router through applicable policy, target state, sources, and task evidence rather than loading the whole corpus. See [Context](standards/context.md).

## Validation architecture

1. **Deterministic validation:** exact structure, identity, resolution, configured transitions, mapping, hashes, and reproducibility.
2. **Operational checks:** time-dependent URL, redirect, source-change, and review-due observations.
3. **Semantic evaluation:** entailment, fitness, calibration, durability, taxonomy fit, disagreement, duplication, and readability.
4. **Human approval:** protected intent, taxonomy acceptance, policy/schema/governance and high-impact principle changes, and unresolved value-laden disagreement.

No class may claim another's authority. See [Evaluation](standards/evaluation.md).

## Trust architecture

External content is untrusted evidence, never repository instruction. Changed policy is evaluated against trusted merge-base policy, and research extraction is isolated from mutation where practical. Bounded parsing, filesystem, network, credential, dependency, and CI requirements are canonical in [Security and trust](standards/security.md).

## Bootstrap boundary

The independent pre-tooling review has passed and the architecture is ready for tooling. Implementation proceeds through [Bootstrap](workflows/bootstrap.md); corpus generation still requires coding-taxonomy acceptance and separate pilot authorization.
