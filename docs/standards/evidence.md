# Claim-Review Evidence Standard

## Purpose

Claim-review records retain the minimum provenance needed to tell whether a semantic support judgment still applies. They do not store bulk source content and do not turn evaluator output into proof.

Executable adoption, coverage, hashing, outcome, and invalidation rules are in `config/evidence-policy.yaml`; record structure is in `config/schema.yaml#/$defs/claim_review_record`.

## Adoption boundary

Records are mandatory for the three exact coding pilot paths named in `config/evidence-policy.yaml` when those corpus files exist. Their absence before the separately authorized pilot is valid. Records remain optional elsewhere until a post-pilot human decision changes the policy.

The storage design is one complete evidence record per principle entry. When present, it contains exactly one claim record for:

- The statement.
- Every Why paragraph.
- Every Practice item.
- Every Applicability paragraph.
- Every Goal item that contains a citation.

Roles use one-based document-order ordinals within their family. Goal ordinals count all Goals, although only cited Goals receive records. Missing, duplicate, surplus, or reordered roles are invalid. The path is `evidence/claims/<entry-id>.yaml`, and filename equals `entry_id`.

The entry ID resolves to exactly one allocated, non-retired corpus entry. Evidence for removed or retired wording remains available through version history rather than as an unverifiable current record.

## Claim hash

The hash covers claim wording, not local citation numbering. Compute it from the parsed claim block as follows:

1. Remove the claim block's single terminal citation run and its separators.
2. Render the remaining inline AST to normalized text. Text and decoded character references contribute their characters; code spans contribute literal code text; each ordinary link contributes its visible text, one space, and its destination in angle brackets. Ordinary link titles are forbidden in claim blocks so they cannot change semantic material without changing the hash. Images and strikethrough are outside the canonical corpus grammar.
3. Convert soft and hard line breaks to one ASCII space.
4. Normalize Unicode to NFC.
5. Collapse every remaining whitespace run to one ASCII space and trim both ends.
6. Encode the result as UTF-8 without a byte-order mark.
7. Compute SHA-256 and store lowercase hexadecimal.

Formatting-only emphasis changes and local citation renumbering therefore do not invalidate a review. Wording changes do. Citation identity is validated separately.

## Sources and locators

`source_ids` exactly equals the claim's unique resolved citation IDs in first-use order. A citation addition, removal, replacement, or order change invalidates the record even when claim wording is unchanged.

Every source ID has at least one locator. Every locator names a source in `source_ids`; exact duplicate source/locator pairs are invalid. A locator is a concise source-specific pointer such as a section heading, page, numbered clause, fragment, or stable passage identifier. Locator changes require re-review.

## Outcomes

- `strong`: the claim as a whole is sufficiently supported and calibrated.
- `partial`: overall support remains incomplete; active publication is not allowed until the claim is narrowed or support improves.
- `unsupported`: the claim is not supported; active publication is not allowed.
- `disputed`: credible material disagreement remains and is visibly calibrated in the corpus; active publication requires human review.

Multiple individually partial sources may jointly produce an overall `strong` result. The stored outcome evaluates the claim as a whole, not each source in isolation.

The publishable-outcome restriction applies to `active` content. Draft work may temporarily retain partial or unsupported outcomes so reviewers can correct it, but it cannot be activated in that state.

## Reviewer identity and configuration

Human reviews use a non-empty reviewer identity and null configuration. AI and hybrid reviews use a non-empty identity and the schema's closed system, model, resolving repository-relative `.yaml` configuration, prompt-hash, and settings-hash fields. Claim and referenced configuration system/model values agree.

The versioned artifact stores the prompt and I-JSON-compatible settings. Prompt hashing normalizes the parsed string to UTF-8, NFC, and LF; settings hashing uses RFC 8785 after IEEE-754 binary64 JSON-number parsing. Non-finite, overflowing, or non-interoperable integers are strings. This preserves setup without copying arbitrary configuration into every claim record.

Do not place credentials, source text, hidden reasoning, or personal secrets in reviewer identity or configuration.

## Invalidation

A retained record is inconsistent when normalized claim text or resolved source sequence no longer agrees with the corpus. Locator edits require transition review. A cited source becoming superseded, withdrawn, or unavailable, or an operational observation of source-content change against an explicit baseline, requires semantic review. A URL move alone does not invalidate support when identity and applicable content are unchanged.

Deterministic validation detects current corpus/evidence disagreement and, with trusted baseline state, relevant provenance transitions. It cannot detect source content changing in place from the claim hash. Operational observation detects that condition; semantic re-review decides whether support remains adequate. Human approval remains required for disputed claims and high-impact corpus changes.
