# Principle Discovery and Selection Architecture Review

**Date:** 2026-09-02  
**Status:** Historical, noncanonical architecture review  
**Scope:** Targeted correction to principle discovery, coverage analysis, candidate comparison, and final selection; no Coding or DevOps corpus content changes

This review responds to repeated low-count convergence observed during Coding and DevOps production. Current canonical architecture, standards, workflows, templates, prompts, evaluation assets, and tests were the system of record. Prior production reviews supplied historical evidence about observed behavior but were not treated as current policy.

## Review boundary and context

The routed workset covered `AGENTS.md`, the architecture-review workflow, architecture, research, content, writing, prompting, and evaluation standards, create/update/review/furnishing workflows, all corpus scaffolds, reusable prompts, semantic fixtures and rubric, the pull-request review surface, and their tests.

Trusted-baseline classification against `HEAD` reports the complete shared proposed architecture workset: 64 architecture-relevant files totaling 462,784 UTF-8 bytes. That workset includes earlier uncommitted architecture and tooling changes outside this correction. The task-focused canonical correction directly affects 22 files totaling 117,526 UTF-8 bytes after implementation. Historical reviews remain excluded from architecture-change classification.

The current DevOps corpus provides the clearest production signal: 21 of 24 files contain exactly two principles and the remaining three contain three. Low count does not establish a defect in any one file, but this degree of convergence across broad, materially different professional scopes warrants review of the selection process.

## Findings

### 1. Evidence discovery flowed directly into selection and drafting

The Research standard distinguished source discovery from synthesis and included a coverage map, but “discover candidates” referred to sources, not candidate principle themes. The Content workflow moved from mapping claims and evidence directly to “Select and write principles.” Nothing required a broad theme set, a candidate-set coverage analysis, or comparison before the first strong themes became the draft.

The stopping criteria were correspondingly permissive: “central themes” could be interpreted as whichever themes had already been found. A structurally sound, cited file with one or two strong principles could therefore terminate without testing whether other major dimensions had strong available evidence.

### 2. Count neutrality prevented quotas but did not prevent premature convergence

The Content standard correctly rejected target counts, and the architecture correctly assigned semantic sufficiency to AI or human review. Those protections prevented a minimum-principle validator but did not establish a positive exploration obligation. Guidance that one strong principle could be enough was true in isolation yet easy to apply before breadth had been investigated.

The missing rule was procedural rather than cardinal: explore plausible themes broadly, evaluate subject coverage, compare and consolidate candidates, and only then select the final set.

### 3. Review inspected final shape more than selection process

The review workflow could flag generation-shaped counts, duplication, weak evidence, and missing nuance after drafting. It did not ask whether the candidate set itself was broad enough, whether the first themes caused early stopping, whether important dimensions were omitted despite strong evidence, or whether consolidation hid distinct concerns merely to keep a file small.

This made repeated low counts visible but did not provide a direct repair path. Conversely, it also lacked an explicit defense for a genuinely narrow scope whose two selected principles remained sufficient after adequate exploration.

### 4. The residual scaffold still supplied a stopping shape

The earlier subject-shaped architecture correction had already removed stronger cardinality anchors: all three templates no longer demonstrated exactly two Practices and two sources, and preset-specific optional sections were removed. The remaining scaffolds still repeated one entry, one Why block, one Practice placeholder, and one source mapping. Architecture described this as minimum grammar, but the Content workflow allowed scaffolding too close to synthesis, so the lower bound could become the completed draft shape.

No reusable content prompt existed beyond `prompts/README.md`. Evaluation included generation-shaped versus subject-shaped structure, but no fixtures directly distinguished premature convergence, justified narrowness, count-driven inflation, and a justified larger set.

## Architecture disposition before implementation

**TARGETED SEMANTIC ARCHITECTURE CORRECTION REQUIRED**

The grammar, identity model, canonical content shape, and deterministic validation boundary are not defective. Candidate and principle counts cannot establish semantic coverage. The smallest coherent correction is to make discovery, coverage, comparison, and selection explicit in semantic authorities and advisory evaluation while keeping working candidate dispositions lightweight.

## Implementation disposition

**Status:** Implemented under the requested architecture outcome; corpus refinement remains separate

### Discovery, coverage, comparison, and selection

- [Research](../standards/research.md), [Content](../standards/content.md), and [Architecture](../architecture.md) now define four distinct stages: candidate-theme discovery, candidate coverage analysis, candidate comparison and consolidation, and final selection.
- The [Content workflow](../workflows/create-content.md) gives each stage its own transition before drafting or identity allocation. The one-entry scaffold cannot be treated as a draft until selection is complete.
- For substantive scopes that reasonably support breadth, approximately ten plausible candidate themes is a defeasible exploration heuristic. It is not a minimum candidate count, a publication target, or a reason to invent weak themes.
- Final selection includes every candidate that meaningfully clears importance, durability, distinctiveness, evidence-fitness, practical-consequence, human-usefulness, and scope-placement criteria. No final count is preferred.
- Candidate themes may be combined or rejected when they are redundant, narrow, practice-level, weakly supported, temporary, unimportant, or better owned elsewhere. Consolidation must not hide distinct consequences, evidence, applicability, or ownership.
- Working candidate notes remain disposable. Canonical corpus files contain selected principles, while agents retain enough working analysis to explain major dispositions when asked.

### Creation, maintenance, furnishing, and review

- Substantive content updates repeat the four stages against existing and newly researched themes; localized source or claim maintenance does not reopen unrelated selection work.
- Domain furnishing builds one shared candidate landscape but still requires target-level discovery and coverage. Its cross-file pass now tests recurring low counts, unjustified compression, and candidate inflation without treating count as a verdict.
- Content review now asks whether exploration was broad enough, whether work converged on the first strong themes, whether important dimensions are missing, whether a small or large set reflects the subject, and whether consolidation reflected true redundancy.
- Writing guidance rejects compound principles that compress materially distinct durable decisions merely to keep a file small.

### Cardinality anchors and prompts

- All three scaffolds now label their one displayed entry as the grammar's lower bound and instruct authors to replace or repeat the whole block for the selected set before materialization.
- Scaffold introductions, principle placeholders, and reference placeholders no longer use repeated “one” wording as an authoring default. Practice and source placeholders remain open-ended and subject-shaped.
- `prompts/README.md` now forbids reusable prompts from encoding preferred candidate, principle, practice, goal, citation, or source counts and requires the four semantic stages to remain distinct.
- Exact-count examples retained in grammar and parser tests describe executable syntax, not semantic completeness. The adversarial “exactly two” fixture remains intentionally negative rather than a generation example.

### Semantic fixtures

Four advisory `principle-selection` fixtures and expected classifications were added:

- broad available coverage plus an unexplored two-principle draft — `premature-convergence`;
- adequately researched narrow scope with two durable principles — `justified-narrow-selection`;
- weak themes retained to reach a count — `reject-candidate-inflation`;
- a larger set justified by distinct evidence-backed concerns — `justified-broad-selection`.

Manual application of the version-1 rubric to the four cases matches those expected classifications. Fixture calibration remains pending and non-blocking.

### Deterministic boundary and composed behavior

No schema, executable policy, validator, generator algorithm, CLI behavior, deterministic cardinality check, policy version, or corpus record changed for this correction. `tests/evals.test.js` only asserts that the four required semantic cases remain present and paired with expected classifications.

The representative composed paths remain terminal and retain current ownership:

1. Content creation proceeds from target and evidence research through discovery, coverage, comparison, selection, writing, semantic review, the existing exact-content activation decision, and `outcome-satisfied`.
2. Substantive content refinement repeats selection analysis, while localized maintenance takes the narrower branch and returns to the same review and activation path.
3. Domain furnishing supplies shared research context, invokes all four stages per target, performs a cross-file pass, and reaches the existing batched activation and terminal state.
4. Independent review can return a draft for more discovery, reject inflated candidates, accept justified narrowness or breadth, or prepare the existing activation decision without creating a new gate or persistent workflow state.

## Verification

- build passed;
- full deterministic suite passed: 95 tests;
- all three updated templates instantiated under the executable schema and GFM grammar;
- semantic fixture/expectation coverage passed, including the four selection cases;
- offline validation completed with 0 errors and 0 warnings and correctly reported trusted-baseline transitions as `not_evaluated` when no baseline was supplied;
- trusted-baseline validation against `HEAD` completed with 0 errors and 0 warnings and transition comparison `evaluated`;
- architecture review remained correctly required for the shared proposed worktree;
- whitespace checks passed; and
- operational source checks were not applicable because this correction changed no source identity, URL, evidence, or corpus claim.

Trusted-baseline validation also reports human gates arising from the complete shared worktree, including earlier policy/schema, taxonomy, protected-intent, and corpus changes. Those classifications are outside this correction and passing validation does not authenticate their semantic approval.

## Readiness conclusion

**READY FOR ANOTHER TARGETED DEVOPS REFINEMENT PASS**

The next DevOps pass can use the existing content and taxonomy workflows with a corrected selection architecture: explore broadly, curate aggressively, and let each subject determine its final shape. It should not add principles merely because a file currently contains two. It should reopen each substantive scope's evidence landscape, build and test a plausible candidate set, repair genuine coverage gaps or unjustified compression, reject weak candidates, and preserve justified narrow files. Existing DevOps taxonomy, evidence, principle-change, and activation gates remain unchanged.
