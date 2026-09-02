# Schema and Policy Versions

## Contract

Schema and policy versions are compatibility boundaries. Tooling supports only versions explicitly implemented and rejects unknown versions and unknown policy fields. It must not silently coerce, reinterpret, or rewrite canonical data.

A version change requires:

1. A documented reason and compatibility impact.
2. An explicit deterministic migration for every affected canonical record.
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

## Format assertion

Repository validation treats JSON Schema Draft 2020-12 `format` as an assertion. Implementations must enable validation for formats used by the canonical schema, including `date` and `uri`; annotation-only handling is nonconforming.
