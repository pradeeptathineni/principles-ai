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

Curated fixtures, AI evaluators, and humans judge entailment, source fitness, calibration, durability, distinctness, taxonomy fit, disagreement, scope, candidate-discovery breadth, coverage analysis, comparison and consolidation quality, subject-determined final selection, hidden unsupported claims, harmful duplication versus meaningful recurrence, generation-shaped uniformity, and readability. Similarity alone is not a defect: evaluation asks whether recurrence adds domain-specific meaning, decisions, practices, applicability, importance, evidence, or provenance.

Architecture fixtures additionally judge prerequisite sufficiency, composed-workflow behavior, gate necessity, ownership clarity, authority duplication, prose-to-implementation agreement, deterministic/semantic boundary placement, context efficiency, and natural-language outcome resolution. They remain advisory under the same calibration rules as other semantic evals.

## Human approval

Humans approve protected intent, taxonomy additions, definition changes, deprecations, reactivations, acceptance without explicit unchanged-target authorization, principle addition/removal/merge/rescoping, policy/schema/governance changes, evidence-policy changes, and unresolved material disagreement.

Human approval is required only for the actual judgment. Present a decision-ready package with the affected artifacts, meaningful semantic changes, relevant taxonomy/source/evidence effects, material limitations or disagreement, and the exact decision requested. Deterministic hashes bind the approval to that reviewed state and remain available for diagnostics or audit; they are not substantive choices and humans must not be asked to interpret, transcribe, or individually approve them. A changed binding invalidates the prior approval without creating a separate hash-approval gate.

Research, review preparation, source registration, draft creation under accepted taxonomy, validation, repair, and workflow resumption are agent-owned. An explicit approval of an exact already-presented meaningful package satisfies its gate; tooling classifies approval-required transitions and verifies unchanged bindings but cannot authenticate the human decision.

## Core measures

- Structural citation presence.
- Claim-level entailment.
- Source fitness.
- Unsupported-claim rate.
- Principle distinctness and durability.
- Candidate discovery breadth and subject-dimension coverage before selection.
- Justified candidate consolidation, rejection, placement, and final selection.
- Harmful duplication versus meaningful recurrence.
- Scope calibration.
- Taxonomy fit.
- Disagreement preservation.
- Human readability and usefulness.
- Subject-shaped structure rather than generation-shaped uniformity.
- Context coverage and efficiency.
- Protected-intent preservation.

Targets such as zero unsupported claims apply to overall semantic support, not to citation count. Multiple individually partial sources may jointly support a claim when the review records that conclusion.

Review source selection as a process as well as claim entailment: confirm that research mapped the relevant evidence kinds before principle selection and that any weaker source substituting for a stronger available fit has an explicit reason. A polished set of citations cannot demonstrate that omitted stronger evidence was considered. Publisher concentration is descriptive evidence for this review, not a numeric quality verdict or diversity quota; investigate whether one operating model has been generalized where independent evidence could materially test it.

Review repeated form as a semantic signal, not a deterministic error. Potential generation-shaped patterns include identical principle counts across unrelated files, recurring sentence templates, mechanically uniform rationale or practice lengths, repeated favored qualifiers, generic taxonomy descriptions, and optional sections that are universally present or absent without subject-matter reason. Do not reward thesaurus rewriting, arbitrary count variation, or superficial heterogeneity; legitimate structural similarity may follow genuinely similar material.

Review principle selection as a process, not only as a polished final artifact. Ask whether discovery extended beyond the first strong themes, whether the candidate set covered the major dimensions revealed by the subject and evidence, whether consolidation reflected true redundancy, and whether every included candidate cleared the selection bar. Approximately ten plausible themes is a default exploration heuristic for a substantive scope that supports such breadth; it is not a minimum candidate count or a final-count target. A recurring one- or two-principle result across broad scopes is a review signal, while a well-researched narrow two-principle result may be complete. A larger result is justified only when its concerns are distinct, important, useful, appropriately placed, and evidence-backed.

## Fixtures

Maintain positive and negative fixtures across structural, transition, source, citation, evidence, semantic, security, and protected-intent contracts. The concrete families belong in `tests/` and `evals/` and must include unavailable-baseline reporting, disagreement, prompt injection, policy weakening, optional-section filler, hidden claims, harmful duplication, meaningful recurrence, source-concentration interpretation, generation-shaped versus subject-shaped structure, premature convergence despite broad coverage, justified narrow selection, candidate inflation, and justified broader selection.

## Evaluator governance

Version fixtures, rubrics, evaluator prompts, model/configuration, expected classifications, and human calibration records. Track false positives, false negatives, and failure categories.

Hosted-model semantic judgments are traceable and repeatable in setup, not guaranteed bit-for-bit reproducible. A newer model or longer prompt is not assumed better; compare representative results.

## Pilot evidence records

Claim-review records are required for configured pilot paths and optional elsewhere. The first production run did not justify universal adoption. Exact adoption and validation rules are in `config/evidence-policy.yaml` and [Claim-review evidence](evidence.md).

## CI

Deterministic validation blocks pull requests once implemented; operational checks run separately. Semantic evals remain non-blocking until calibrated, and completion is not semantic correctness. Human approval remains necessary for high-impact changes.

Validators enable Draft 2020-12 format assertion and reject unsupported versions, unknown policy keys, and implicit migration. First-use citation numbering is a warning; unused bibliography entries or definitions are errors.
