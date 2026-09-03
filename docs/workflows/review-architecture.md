# Architecture Self-Review Workflow

## Trigger and boundary

Use this route for changes to architecture, workflow/process composition, ownership, validation classes, governance, or context routing; for trusted-baseline changes classified by `config/validation.yaml`; after recurring production friction; and before semantic automation becomes blocking. Ordinary corpus/source/evidence/taxonomy maintenance needs it only when an architecture contract changes or a recurring process defect appears.

Compare with a trusted merge base when available. Historical `docs/reviews/` records prior observations, never current policy. Start with `AGENTS.md`, this workflow, [Architecture](../architecture.md), `config/validation.yaml`, classified changed files, and their tests. Load other standards or implementation only when the changed surface or a finding requires them.

Record the deterministic routed workset and UTF-8 byte estimate, then judge semantic sufficiency separately: size proves neither relevance nor completeness.

## Deterministic support

Run offline validation and relevant tests. Inspect change classification, workflow/action/gate registries, route reachability, terminal states, implementation owners, positive/negative test surfaces, internal links, version migrations, and generated-output reproducibility.

These checks establish structure and declared correspondence. They cannot prove useful workflow semantics, justified gates, context sufficiency, or agreement between prose and implementation.

## Composed review

For each representative outcome:

1. Resolve the request to supported outcome classes and inspect canonical state.
2. Identify prerequisites and confirm each owner, allowed transition, applicable checks, and resumption edge.
3. Follow relevant absent/proposed/accepted/deprecated, draft/active, repair, approval, no-op, and blocked paths.
4. Confirm every path reaches `outcome-satisfied` or a genuine named human decision/external blocker, and repeated completed requests do not recreate work or seek ceremonial confirmation.
5. Trace each changed capability through its semantic owner, executable contract, implementation, tests/evals, and CI entry point.

Flag missing or competing authorities, prose-only capabilities, unused implementation, and checks whose tests omit failure behavior.

## Semantic and governance review

Judge whether prerequisites are sufficient; workflows compose; state and ownership are clear; gates are missing or excessive; deterministic work remains out of AI context; semantic judgment has not become mechanical truth; and each route is complete without unrelated loading.

Check that presets, examples, prompts, workflows, rubrics, fixtures, and validators do not anchor counts or form, enable first-plausible synthesis, reward concise incompleteness, mistake meaningful recurrence for duplication, turn source concentration into a quota, or accept generic taxonomy boundaries. These are semantic judgments: do not encode candidate/principle quotas, similarity thresholds, or cosmetic-variation rules. Architecture fixtures remain advisory until calibrated.

Humans decide consequential architecture/governance changes, meaningful gate/authority changes, promotion of semantic automation to blocking, and unresolved material tradeoffs. Tooling classifies gates but never authenticates approval.

## Completion and record

Report deterministic facts, transition status, semantic findings and uncertainty, context costs, exact remaining decisions, smallest canonical corrections, and representative terminal paths. Promote accepted conclusions into canonical docs/config/code/tests/CI as applicable.

Save a dated `docs/reviews/` record only for a consequential audit, readiness review, checkpoint, or postmortem. Preserve historical review bodies and append implementation dispositions under [Reviews](../reviews/README.md) rather than rewriting conclusions.

The review is complete when changed architecture has one coherent authority path, identifiers agree, workflows resume and terminate, validation/semantic/governance boundaries remain distinct, required decisions are explicit, ordinary corpus changes do not gain architecture gates, and passing artifact checks hide no material defect.
