# Claim-Review Evidence Standard

## Purpose and adoption

Claim-review records retain enough provenance to determine whether a support judgment still applies. They store no bulk source content and never turn evaluator output into proof. `config/evidence-policy.yaml` owns executable adoption, coverage, hashing, outcomes, and invalidation; the schema owns record shape.

Records are required for configured pilot paths and optional elsewhere, where impact, dispute, novelty, or weak evidence should justify them. One compact record covers one principle entry: review metadata is stored once, followed by exactly one item for the statement, every Why paragraph, every Practice item, every Applicability paragraph, and each cited Goal. Roles use document-order ordinals. Missing, duplicate, surplus, or reordered roles are invalid.

The filename and `entry_id` agree and resolve to one allocated non-retired corpus entry. Version history retains evidence for removed or retired wording.

## Claims, sources, and outcomes

A claim hash covers normalized semantic wording, not terminal citation labels or emphasis. It includes ordinary link destinations and changes when wording changes; exact AST normalization is executable policy. Formatting-only emphasis and citation renumbering do not invalidate review.

Each claim's ordered unique `sources` exactly matches resolved citations in first-use order. Adding, removing, replacing, or reordering sources invalidates the record even when wording stays fixed. Every source has a concise source-specific locator such as a section, page, clause, fragment, or stable passage ID; locator changes require review.

Outcomes evaluate the whole claim:

- `strong`: adequately supported and calibrated.
- `partial`: incomplete support; not publishable as active.
- `unsupported`: not supported; not publishable as active.
- `disputed`: credible disagreement remains, visibly calibrated; activation requires human review.

Multiple individually partial sources may jointly yield an overall strong outcome. Drafts may retain nonpublishable outcomes while being repaired.

## Reviewer binding and invalidation

Human reviews use a named identity and no evaluator configuration. AI/hybrid reviews use a named identity plus a resolving versioned YAML configuration and its exact SHA-256; that artifact carries system, model, prompt, and interoperable settings without duplication in each claim.

Never store credentials, hidden reasoning, personal secrets, or source text in reviewer identity/configuration.

A record is inconsistent when normalized text or source sequence differs. Locator changes, relevant source supersession/withdrawal/unavailability, and observed content changes against an operational baseline require semantic review. URL moves alone do not invalidate support when identity and applicable content are unchanged. Claim hashes cannot detect content changing in place.

Deterministic validation detects corpus/evidence disagreement and trusted-baseline provenance transitions; operational observation detects in-place source changes; semantic review decides continued support. Humans retain disputed and high-impact decisions.

The scaffolder derives roles, hashes, and source order. It preserves locators/outcomes only when wording and source order are unchanged; otherwise it marks review required and emits no judgment. A scaffold remains derived preparation until a reviewer supplies valid locators, outcomes, identity, and configuration.
