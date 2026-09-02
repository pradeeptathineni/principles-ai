# Schema and Policy Versions

## Contract

Schema and policy versions are compatibility boundaries. Tooling supports only versions explicitly implemented and rejects unknown versions and unknown policy fields. It must not silently coerce, reinterpret, or rewrite canonical data.

A version change requires:

1. A documented reason and compatibility impact.
2. An explicit deterministic migration for every affected canonical record, with rationale and human approval for any intentional information loss.
3. Updated templates, fixtures, policies, and workflows.
4. Validation of the fully migrated repository before the old version is removed from support.
5. Human approval as a policy/schema change.

When no records of a type exist, record that fact rather than inventing migration fixtures or provenance.

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

## Format assertion

Repository validation treats JSON Schema Draft 2020-12 `format` as an assertion. Implementations must enable validation for formats used by the canonical schema, including `date` and `uri`; annotation-only handling is nonconforming.

## First-production-run simplification

The 2026-09-01 `coding/design.md` run exposed process and storage costs that the pre-production design could not validate empirically:

- Schema document ID advances from version 4 to 5.
- All 15 domain manifests advance from version 4 to 5 and remove `taxonomy_review`. Coding keeps its accepted lifecycle; every other domain keeps its proposed lifecycle. The coding review sidecar is removed because its useful decision history belongs in version control or a pull request, not mirrored canonical state.
- Source records advance from version 3 to 4. Five retained records replace free-text `source_type` plus misleading scalar `authority_class` with a single explicit `evidence_kind`; the unused sixth record, created only for the removed taxonomy review, is deleted and its allocation is permanently retired. Superseded metadata remains recoverable from version history.
- Claim-review records advance from version 3 to 4. Four records move review metadata to entry scope, bind the exact evaluator configuration file once, and combine each source with its locators. Claim hashes and outcomes are preserved or recomputed against compressed wording.
- Content policy advances to version 6 with advisory word-economy warnings. Source and taxonomy policies advance to version 6; evidence policy advances to version 4; validation advances to version 6.

The migration deliberately retires deterministic checks for the removed taxonomy-review machinery. Versioned policy migrations may add, replace, or retire checks; same-version weakening remains invalid. No principle or source identity is retired or reused.
