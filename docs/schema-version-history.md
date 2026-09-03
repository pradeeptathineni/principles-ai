# Schema and Policy Version History

This retained record explains completed migrations. It is not current executable policy; load it only when reviewing a prior transition or compatibility decision. The live migration contract is [Schema and policy versions](schema-versions.md).

## Current pre-tooling migration

The 2026-09-01 contract correction made validation stricter before tooling or corpus generation:

- Domain manifests: version 2 to 3. All 15 manifests were migrated mechanically; their proposed taxonomy meaning did not change.
- Corpus frontmatter: version 2 to 3. No canonical corpus files existed, so only templates changed.
- Source records: version 1 to 2. No source records existed.
- Claim-review records: version 1 to 2. No claim-review records existed.
- Identity ledger: version 1 to 2. The empty ledger was migrated without allocations or relationships.
- Evaluator configuration records begin at version 1. None exist before the eval-harness phase.
- Content, source, taxonomy, validation, and evidence policies advanced to their then-current versions; the new identity policy began at version 1.

The migration adds lifecycle conditionals, closed reviewer configuration, Applicability review roles, exact draft/active status and date behavior, and stronger deterministic cross-file contracts. Deprecated corpus-file status was removed before content existed; taxonomy lifecycle, identity retirement, and version history cover deprecation without a contradictory third file state. The migration does not accept taxonomy, create content, allocate identities, or fabricate review history.

The independent acceptance follow-up then closed the remaining deterministic ambiguities before tooling:

- Schema document ID: version 2 to 3.
- Domain manifests remain version 3; all 15 still validate and their proposed meaning is unchanged.
- Corpus frontmatter: version 3 to 4. No canonical corpus files existed, so only templates changed. Version 4 makes file-title text single-line and control-free and gives decoded heading/title equality an exact projection.
- Source records: version 2 to 3. No source records existed. Version 3 makes bibliography-facing source titles single-line and control-free.
- Claim-review records: version 2 to 3. No claim-review records existed. Version 3 restricts evaluator configuration references to YAML; claim hashing policy separately forbids ordinary link titles in claim blocks.
- Evaluator configuration records: version 1 to 2. None existed. Version 2 adopts the RFC 8785 I-JSON input contract and IEEE-754 binary64 JSON-number parsing rules.
- Identity ledger remains version 2 and empty. Identity policy version 2 adds trusted-merge-base monotonic transition rules without changing ledger shape.
- Content policy advances to version 4, evidence policy to version 3, source policy initially to version 4, taxonomy policy to version 4, and validation policy to version 4.

Because no affected corpus, source, claim-review, or evaluator records existed, these migrations are lossless no-data migrations. They do not create fixtures, provenance, identities, taxonomy acceptance, or corpus content.

The deterministic tooling adversarial review then identified that operational `review_due_report` had no executable threshold and source-content observations had no explicit snapshot contract. Source policy version 5 adds a 365-day review-due threshold and a SHA-256, hash-only operational observation contract requiring an explicit baseline. No source records or corpus files existed, so this is another lossless no-data migration; it creates no review result or source provenance.

## Process-orchestration migration

The process-architecture correction advances the schema document ID from version 3 to 4 and separates review progress from human lifecycle decisions before corpus generation:

- Domain manifests: version 3 to 4. All 15 proposed manifests migrate mechanically to `taxonomy_review.state: not-started` with a null review hash; their taxonomy meaning is unchanged.
- Taxonomy review records begin at version 1. None existed at migration time.
- Corpus frontmatter: version 4 to 5. No canonical corpus files existed. Version 5 binds active content to `reviewed_content_sha256`; drafts store null.
- Content policy: version 4 to 5.
- Taxonomy policy: version 4 to 5.
- Validation policy: version 4 to 5.

The migration permits complete taxonomy research to remain proposed while awaiting acceptance, adds trusted-baseline taxonomy/protected-intent/corpus transition classification, and makes natural-language outcome orchestration canonical. It does not accept taxonomy, create corpus content, allocate identities, register sources, fabricate reviews, or record human approval.

## First-production-run simplification

The 2026-09-01 `coding/design.md` run exposed process and storage costs that the pre-production design could not validate empirically:

- Schema document ID advances from version 4 to 5.
- All 15 domain manifests advance from version 4 to 5 and remove `taxonomy_review`. Coding keeps its accepted lifecycle; every other domain keeps its proposed lifecycle. The coding review sidecar is removed because its useful decision history belongs in version control or a pull request, not mirrored canonical state.
- Source records advance from version 3 to 4. Five retained records replace free-text `source_type` plus misleading scalar `authority_class` with a single explicit `evidence_kind`; the unused sixth record, created only for the removed taxonomy review, is deleted and its allocation is permanently retired. Superseded metadata remains recoverable from version history.
- Claim-review records advance from version 3 to 4. Four records move review metadata to entry scope, bind the exact evaluator configuration file once, and combine each source with its locators. Claim hashes and outcomes are preserved or recomputed against compressed wording.
- Content policy advances to version 6 with advisory word-economy warnings. Source and taxonomy policies advance to version 6; evidence policy advances to version 4; validation advances to version 6.

The migration deliberately retires deterministic checks for the removed taxonomy-review machinery. Versioned policy migrations may add, replace, or retire checks; same-version weakening remains invalid. No principle or source identity is retired or reused.

## Taxonomy scope-definition migration

The taxonomy-logic correction advances the schema document ID from version 5 to 6 and domain manifests from version 5 to 6. Every registered subdomain gains one required canonical `description` so its semantic boundary can be reviewed independently from its display title and stable ID. The migration preserves every domain ID, subdomain ID, code, lifecycle state, origin, protected requirement, priority, exclusion, and scope note; it creates no corpus content or identity relationship. The disposable aggregate taxonomy advances from version 2 to 3, and read-only workflow reports advance from version 1 to 2, because both now expose scope definitions and refined authorization or lifecycle fields.

Taxonomy policy advances from version 6 to 7 and validation policy from version 6 to 7. The policies distinguish addition, acceptance, definition change, deprecation, and reactivation; forbid deprecated-to-proposed regression; bind taxonomy review to independent research and source-fitness standards; and retain contextual cross-domain overlap. Existing proposed-to-accepted transitions are outcome-authorizable only for an explicitly requested unchanged registered target after fit research. The initial canonical descriptions are reviewable migration definitions and definition changes against the trusted version-5 baseline remain human-visible.

## Architecture self-review migration

The self-review correction advances taxonomy policy from version 7 to 8 and validation policy from version 7 to 8 without changing canonical record schemas. Read-only workflow reports advance from version 2 to 3. Validation version 8 adds one executable workflow/action/gate contract, architecture-change classification, route reachability, callable check ownership with positive and negative test surfaces, and deterministic context-workset measurements. Gate identifiers are normalized to canonical kebab-case and categorized by deterministic, semantic, or manual-only emission.

Taxonomy version 8 preserves proposed as the working state for a new scope but permits the final trusted diff to contain an accepted addition after the exact human decision. This removes the otherwise mandatory intermediate merge that prevented a new-domain or new-subdomain outcome from resuming cleanly. Deterministic tooling continues to report `taxonomy-addition` and does not claim that approval occurred.

No corpus, source, evidence, identity, or domain-manifest schema migrates. Historical review files remain noncanonical and excluded from architecture-change triggers; ordinary corpus-only changes do not acquire a new review gate.

## Deterministic offloading migration

Validation policy advances from version 8 to 9 without changing a canonical record schema. Version 9 registers and traces the deterministic support added after the coding production run: domain preparation worksets, validated repository transactions, atomic principle allocation and source registration, content shells and materialization, citation/bibliography synchronization, evidence invalidation scaffolds, hash-bound activation packages and activation, scoped operational source checks, and HEAD-to-GET reachability fallback.

The migration does not add canonical run receipts, research ledgers, semantic duplicate decisions, source quotas, universal evidence sidecars, or model-authored approval. Worksets and activation packages are derived outputs. Transactional commands consume reviewed plans or selected source identities; validation and rollback prove structural consistency only. Source fitness, entailment, source independence, taxonomy ownership, corpus wording, and exact activation remain semantic or human-governed as defined elsewhere.

## Approval-package binding migration

Validation policy advances from version 9 to 10 without changing a canonical record schema or any substantive human gate. Version 10 replaces path/semantic-hash approval lists with meaningful activation packages that expose affected artifacts, before/after semantic content, and relevant taxonomy, source, and evidence effects. Agents add semantic findings, limitations, disagreement, and the actual activation question when presenting the package. Humans decide whether to activate the described content; they do not interpret, transcribe, or individually approve hashes.

The version-2 activation manifest uses reviewed-state fingerprints only as internal bindings. Each fingerprint covers the artifact's semantic content and its relevant taxonomy context, source metadata, and retained evidence records. A later change to any bound state invalidates the approval before mutation. Semantic hashes remain in diagnostics and active frontmatter, preserving exact content review identity without making the fingerprint itself a governance decision.

## Domain-scale deterministic orchestration migration

Validation policy advances from version 10 to 11 without changing a canonical record schema or a substantive human gate. The second production domain demonstrated that the version-9 single-record mutation commands still caused repeated plan-file handling and repository validation, and that semantic coordination, task-versus-repository gate attribution, source-usage accounting, and activation-manifest transcription remained agent burdens.

Version 11 adds version-2 batch plans for reviewed source metadata and content, domain-scoped citation synchronization, fail-fast canonical-writer serialization, descriptive source-usage reports, path-attributed transition gates with task/repository/unrelated preparation groups, disposable hash-bound run checkpoints, compact human activation-review projections, and manifest derivation from approved package paths. Version-1 single-record plans remain supported. Run checkpoints and review projections are derived outputs; they do not prove research, semantic review, source fitness, independence, entailment, taxonomy quality, or approval.

The migration does not add source quotas, universal evidence records, deterministic duplicate or taxonomy verdicts, model-authored approval, or persistent canonical workflow state. Human approval continues to apply to exact principle activation and the existing taxonomy, protected-intent, architecture, policy, schema, and governance decisions.

## Furnished-domain refinement routing migration

Validation policy advances from version 11 to 12 without changing a canonical record schema or adding a substantive human gate. Version 12 adds the `refine-domain-content` outcome and its agent-owned domain-refinement action. The outcome reuses the domain furnishing coordinator and existing Update content workflow, but its target set includes every active universal and accepted-subdomain file so active status cannot silently substitute for renewed candidate discovery, coverage analysis, comparison and consolidation, and final selection.

Ordinary `fully-furnish-domain` semantics remain idempotent: valid active files are complete unless canonical state is incomplete or inconsistent. The new refinement outcome is explicit and invocation-scoped. Its concise per-target candidate dispositions remain disposable semantic-review material rather than canonical evidence or deterministic proof; changed principles still require the existing meaningful activation decision, while unchanged files remain active after an explicit subject-based sufficiency disposition. The migration adds advisory semantic-check identifiers and workflow/CLI regression coverage, but no count threshold, candidate ledger, corpus migration, source change, or automated semantic verdict.
