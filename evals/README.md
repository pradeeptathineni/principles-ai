# Evals

Versioned semantic fixtures, rubrics, expected judgments, evaluator configurations, and human calibration state live here. The initial calibration remains explicitly pending.

Versioned AI/hybrid evaluator configurations live under `evals/configurations/` and follow the resolution and hash contract in `docs/standards/evidence.md`. Do not store credentials or hidden reasoning.

The current fixtures cover adversarial trust, entailment, disagreement, independent taxonomy research, material reframing, intentional cross-domain overlap, harmful duplication versus meaningful recurrence, generation-shaped versus subject-shaped structure, principle candidate discovery and selection, source-concentration interpretation, and architecture composition. Principle-selection cases distinguish premature convergence, justified narrowness, count-driven candidate inflation, and a justified broader set. Architecture cases cover prerequisites and resumption, excessive and missing gates, authority and implementation gaps, responsibility inversion, context bloat, natural-language outcome resolution, active-domain refinement that would otherwise collapse to a furnishing no-op, and state ownership. Additional named families are added only when corresponding fixtures exist.

Semantic evals remain distinct from deterministic validation and non-blocking until calibrated. Version prompts, model/configuration, fixtures, expected results, and human calibration; completion is not proof.
