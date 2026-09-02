# Evaluation Standard

## Purpose

Agent and corpus quality must be evaluated, not assumed. Keep deterministic validation, operational checks, semantic evaluation, and human approval distinct.

## Deterministic validation

Software validates exact structure, versions, identity and lifecycle, trusted-base transitions, scoped uniqueness, path and AST contracts, citations and source mapping, configured links, evidence consistency, outcomes, and reproducibility according to `config/`.

When trusted baseline state is unavailable, transition checks are `not_evaluated`; snapshot validity must not be reported as proof of all-time non-reuse, a valid move, or append-only history.

Deterministic citation presence never proves entailment. A source-review due date never proves semantic staleness.

## Operational checks

Network-dependent checks observe URL reachability, redirects, source-content changes relative to an explicit operational baseline, and review-due state. They are time-dependent, can be indeterminate, and do not belong in ordinary offline validation. Claim hashes do not detect source content changing in place.

## Semantic evaluation

Curated fixtures, AI evaluators, and humans judge entailment, source fitness, calibration, durability, distinctness, taxonomy fit, disagreement, scope, hidden unsupported claims, and readability.

## Human approval

Humans approve protected intent, taxonomy acceptance, principle addition/removal/merge/rescoping, policy/schema/governance changes, evidence-policy changes, and unresolved material disagreement.

Human approval is required only for the actual judgment. Research, review preparation, source registration, draft creation under accepted taxonomy, validation, repair, and workflow resumption are agent-owned. An explicit approval of an exact already-presented package satisfies its gate; tooling classifies approval-required transitions but cannot authenticate the human decision.

## Core measures

- Structural citation presence.
- Claim-level entailment.
- Source fitness.
- Unsupported-claim rate.
- Principle distinctness and durability.
- Scope calibration.
- Taxonomy fit.
- Disagreement preservation.
- Human readability and usefulness.
- Context coverage and efficiency.
- Protected-intent preservation.

Targets such as zero unsupported claims apply to overall semantic support, not to citation count. Multiple individually partial sources may jointly support a claim when the review records that conclusion.

Review source selection as a process as well as claim entailment: confirm that research mapped the relevant evidence kinds before principle selection and that any weaker source substituting for a stronger available fit has an explicit reason. A polished set of citations cannot demonstrate that omitted stronger evidence was considered.

## Fixtures

Maintain positive and negative fixtures across structural, transition, source, citation, evidence, semantic, security, and protected-intent contracts. The concrete families belong in `tests/` and `evals/` and must include unavailable-baseline reporting, disagreement, prompt injection, policy weakening, optional-section filler, and hidden claims.

## Evaluator governance

Version fixtures, rubrics, evaluator prompts, model/configuration, expected classifications, and human calibration records. Track false positives, false negatives, and failure categories.

Hosted-model semantic judgments are traceable and repeatable in setup, not guaranteed bit-for-bit reproducible. A newer model or longer prompt is not assumed better; compare representative results.

## Pilot evidence records

Claim-review records are required for configured pilot paths and optional elsewhere. The first production run did not justify universal adoption. Exact adoption and validation rules are in `config/evidence-policy.yaml` and [Claim-review evidence](evidence.md).

## CI

Deterministic validation blocks pull requests once implemented; operational checks run separately. Semantic evals remain non-blocking until calibrated, and completion is not semantic correctness. Human approval remains necessary for high-impact changes.

Validators enable Draft 2020-12 format assertion and reject unsupported versions, unknown policy keys, and implicit migration. First-use citation numbering is a warning; unused bibliography entries or definitions are errors.
