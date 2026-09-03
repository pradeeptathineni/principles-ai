# Self-Review Architecture Review

Date: 2026-09-02  
Status: Historical review snapshot; noncanonical  
Scope: Repository self-review and architecture-review capabilities  
Disposition: Accepted and implemented; see the post-review disposition below.  

The repository has strong review components, but not yet a clear, reusable architecture self-review capability. Its present controls validate artifacts well; they do not systematically validate the repository's process architecture as a composed system.

## 1. Existing self-review capability

- A comprehensive pre-implementation architecture audit exists, including authority boundaries, validation classes, tooling layers, and a final checklist. It is explicitly historical and noncanonical, so it cannot govern future reviews by itself. See [Architecture audit](2026-09-01-architecture-audit.md) and [Reviews policy](README.md).
- The first production-run review demonstrates a useful empirical feedback loop: it detected a ceremonial taxonomy gate, duplicated state, excessive review metadata, and context cost, then simplified the architecture. See [First production-run review](2026-09-01-first-production-run.md).
- Canonical architecture cleanly separates deterministic validation, operational observation, semantic evaluation, and human approval. See [Architecture](../architecture.md#validation-architecture).
- Trusted-baseline validation covers many taxonomy, identity, source, evidence, and corpus transitions. CI runs deterministic tests and validation.
- The [content-review workflow](../workflows/review-content.md) is a good reusable corpus review checklist, but its scope is content and related transitions rather than repository architecture.
- A workflow inspector models two outcomes: completing one corpus target and furnishing one registered domain.
- Semantic eval infrastructure exists, but its six current dimensions concern trust, entailment, disagreement, and taxonomy—not workflow or architecture composition—and calibration remains pending. See the [evaluation rubric](../../evals/rubrics/v1.md) and [calibration record](../../evals/calibration/v1.yaml).
- The pull-request template prompts reviewers to distinguish validation classes, impact, lifecycle, and approval.

Verification was clean: all 74 tests passed, and trusted-baseline validation against `HEAD` completed without deterministic errors.

## 2. What it fails to cover

The principal gap is that there is no canonical architecture-review route or workflow. `AGENTS.md` routes infrastructure changes through the already-completed bootstrap workflow, but does not route architecture audits, process reviews, or repository self-review. See the [repository router](../../AGENTS.md#route-by-outcome) and [bootstrap gate](../workflows/bootstrap.md#phase-0--architecture-contract-gate).

Concrete defects that current review mechanisms do not detect include:

- Workflow reachability: `create-domain.md` and `update-content.md` are not linked from any current nonhistorical route. They exist, but are effectively orphaned from outcome routing.
- Terminal-state reachability: domain furnishing always appends `run-domain-cross-file-consistency-and-quality-review`; there is no state representing its completion, so the inspector can never report a fully furnished domain as `outcome-satisfied`. The CLI test locks in that behavior.
- Gate registry divergence: configured human-gate identifiers do not match emitted identifiers. For example, config declares `policy_or_schema_change`, while the validator emits `policy-or-schema-change`; corpus transitions emit `principle-activation`, `principle-removal`, and `principle-semantic-change`, none of which are configured under those names.
- Missing gate classification: config declares governance/CI changes as human-governed, but trusted-baseline validation does not inspect changed `AGENTS.md`, governance documents, or CI files to emit that gate.
- Weak implementation traceability: the deterministic-check registry proves that two manually maintained lists agree, not that each claimed check has a callable implementation and negative test.
- No composition verification: tests exercise individual workflow snapshots, not complete sequences through prerequisites, decisions, resumption, repair, and terminal outcomes.
- No canonical process model identifies, for every transition, its prerequisite, decision owner, mutation owner, gate, resumption edge, and terminal condition.
- No systematic semantic review exists for duplicated sources of truth or for prose capabilities lacking implementation.
- Context efficiency is a declared quality measure, but there is no architecture fixture, measurement, or review step exercising route completeness versus unnecessary context.
- Natural-language outcome resolution is asserted broadly, while the helper handles only `--target` and `--domain`. There are no eval cases for new-domain, taxonomy-only, maintenance, architecture-review, ambiguous, or compound requests.

Consequently, nearly every requested defect class is covered only partially or not at all. The repository can detect many invalid data transitions, but not invalid workflow composition, missing orchestration, gate drift, routing inefficiency, or unimplemented process claims.

## 3. Review ownership

| Layer | Appropriate responsibilities |
| --- | --- |
| Deterministic | Route/link reachability; declared workflow/action/gate ID consistency; transition exhaustiveness and terminal reachability for modeled states; change-impact classification; schema/config/code registry agreement; existence of implementation and negative tests; context file/token counts; workflow report schema validation. |
| AI-reviewed | Whether prerequisites are semantically complete; whether individually valid workflows compose correctly; whether gates are necessary and sufficient; whether state ownership is understandable; semantic conflicts or duplicated authority; deterministic/semantic boundary mistakes; natural-language outcome resolution; whether loaded context is necessary and sufficient. |
| Human-reviewed | Acceptance of governance and architecture policy; adding or removing consequential gates; authority/source-of-truth choices; automation of semantic judgment; unresolved tradeoffs; approval of exact architecture-changing packages. |

Deterministic tooling should report and classify human gates, not authenticate approval. AI should prepare architecture decisions, not silently adopt them.

## 4. Minimal repository changes needed

1. Add one canonical `review-architecture.md` workflow and route architecture/process/repository-review outcomes to it from `AGENTS.md`. Derive its checklist from the historical audit and existing four-layer review model.
2. Extend the existing validation policy rather than introduce a parallel governance system:
   - Give workflow actions and gates canonical identifiers.
   - Mark each gate as deterministically emitted or explicitly manual-only.
   - Validate configured IDs against actual emitters.
   - Classify governance, routing, workflow, CI, schema, and policy diffs.
   - Require every modeled outcome to have prerequisites, an owner, resumption behavior, and a reachable terminal condition.
3. Add table-driven workflow-composition tests covering new domain, proposed/accepted/deprecated targets, taxonomy changes, draft activation, repair, furnishing, approval resumption, and no-op reruns. Add route-orphan and terminal-reachability tests.
4. Extend the existing semantic rubric with a compact architecture fixture family: missing prerequisite, composed-workflow failure, unnecessary gate, missing gate, authority duplication, unimplemented prose capability, deterministic/semantic inversion, context bloat, and unresolved natural-language outcome.
5. Add one architecture-review section to the pull-request template. Review results can remain in the pull request or a historical review snapshot; do not recreate mandatory canonical review sidecars.

## 5. Recurring triggers

Architecture review should be change-driven, not required for ordinary corpus edits. Trigger it when a change affects:

- `AGENTS.md`, outcome routing, workflow composition, state definitions, transitions, gates, or ownership;
- schemas, policies, validators, generators, CLI/output contracts, or canonical-versus-derived boundaries;
- security, trust, CI, governance, evaluator authority, or human approval rules;
- context-loading rules or new mandatory context;
- a new canonical record type, source of truth, workflow, automation boundary, or model-driven capability;
- any production failure, repeated workaround, ceremonial confirmation, or inability to resume an outcome cleanly.

Also run it before promoting semantic automation from advisory to blocking. A calendar-only review would add ceremony without targeting the changes that create architectural risk.

## Conclusion

**SELF-REVIEW ARCHITECTURE NEEDS EXPANSION**

## Disposition

**Status:** Accepted and implemented

The findings in this review were revalidated against the implementation worktree before changes were made. No finding had been superseded.

Accepted findings were promoted into canonical repository architecture, configuration, tooling, tests, evals, and routing. The review body and its original conclusion above remain a historical, noncanonical account of the repository before those changes.

### Implementation outcome

The implementation:

- added a canonical architecture self-review workflow;
- added explicit outcome routing for architecture review, domain creation, content maintenance, and other supported operations;
- established an executable process model covering routes, ownership, resumption, actions, gates, and terminal behavior;
- normalized action and gate identities across policy and implementation;
- corrected workflow composition and terminal-state behavior, including prerequisite resumption, completed reruns, domain-furnishing completion, and new-domain reachability;
- added deterministic architecture-change classification and context-workset measurement;
- strengthened deterministic-check implementation and test traceability;
- added workflow-composition, route-orphan, terminal-state, architecture-trigger, and related regression coverage;
- extended the advisory semantic-evaluation framework with architecture-review cases; and
- formalized historical review handling without making reviews canonical.

Canonical changes are represented by the current architecture workflow, validation and taxonomy policy migrations, tooling, tests, evals, and CI contracts.

### Verification

Post-implementation verification completed successfully:

- build passed;
- full test suite passed: 83 tests;
- trusted-baseline validation passed with 0 errors and 0 warnings;
- internal routing and link validation passed;
- diff and whitespace validation passed;
- architecture-impact classification behaved as expected;
- ordinary corpus-only changes remained excluded from architecture-review triggering; and
- architecture semantic fixtures matched their expected classifications.

### Deferred and human-governed items

The following remain intentionally deferred or human-governed:

- semantic evaluation still requires human calibration;
- deterministic traceability proves callable ownership and declared test surfaces, not semantic test quality;
- architecture-review, governance or CI, and policy or schema changes still require their applicable human approval gates; and
- unrelated protected-intent and taxonomy gates were not implicitly approved.

**Final implementation verdict:**  
`SELF-REVIEW ARCHITECTURE READY WITH DEFERRED IMPROVEMENTS`

## Follow-up implementation disposition

The coding-production offloading work was implemented through this architecture rather than as a parallel process system. Validation policy version 9 extends the existing check registry and change classification; canonical workflow and standards files define the deterministic/semantic/human boundaries; mutation and operational tests provide positive and negative coverage; and historical review dispositions remain noncanonical.

The follow-up retained all original deferred boundaries. Worksets and activation packages are disposable, semantic evaluation remains advisory and human-calibrated, transactions prove structural consistency rather than semantic correctness, and architecture/governance/policy plus exact corpus activation gates remain explicit. Post-follow-up verification passed the build, all 89 tests, trusted-baseline validation with 0 errors and 0 warnings, scoped NIST GET retrieval, and whitespace checks.

## Activation-path verification follow-up

The human owner subsequently approved the 11 exact semantic hashes produced for the coding refinements. The implemented activator verified the unchanged hashes, applied the complete package atomically, and left no draft or absent target in the coding furnishing set. The workflow reached `outcome-satisfied`, and post-activation verification again passed the build, all 89 tests, trusted-baseline validation with 0 errors and 0 warnings, and whitespace checks. This real run confirms the intended boundary: deterministic tooling enforces package integrity and repository consistency, while approval remains an explicit human act.
