# Semantic Recurrence and Subject-Shaped Corpus Architecture Review

**Date:** 2026-09-02  
**Status:** Historical, noncanonical architecture review  
**Scope:** Targeted architecture correction derived from the completed Coding and DevOps production runs; no Coding or DevOps corpus content changes

This review evaluates whether the repository architecture correctly distinguishes meaningful semantic recurrence from harmful duplication and whether its authoring and review system lets evidence and subject matter determine corpus structure. The [Coding corpus review](2026-09-02-coding-corpus-review.md), [Coding production postmortem](2026-09-02-coding-domain-production-postmortem.md), [DevOps production postmortem](2026-09-02-devops-domain-production-postmortem.md), and current canonical repository state supplied empirical evidence. Historical reviews were not treated as policy.

## Review boundary and context

The routed review covered `AGENTS.md`, the architecture-review workflow, architecture, schema-version history, content, writing, research, source, taxonomy, and evaluation standards, content and taxonomy workflows, corpus templates, semantic rubric and fixtures, and the tests that bind templates and fixture expectations.

The trusted-baseline architecture classifier reports the complete current proposed repository workset, including earlier work already present in the shared worktree: 64 architecture-relevant files totaling 444,161 UTF-8 bytes. The task-focused canonical correction described here directly affects 21 files totaling 109,606 UTF-8 bytes after implementation. Historical review files are excluded from architecture-change classification.

## Findings

### 1. Recurrence was permitted but not governed precisely enough

The architecture already allowed contextual overlap, but its guidance did not consistently distinguish:

- accidental semantic duplication within one scope;
- unnecessary duplication among neighboring subdomains;
- a subdomain materially developing a universal principle;
- meaningful recurrence across domains;
- similar wording with different domain meaning; and
- a true corpus-level duplicate that contributes no domain-specific information.

This ambiguity could cause a reviewer either to preserve repetitive content indiscriminately or to optimize the corpus toward DRYness and erase useful domain-specific provenance. Location-independent principle identity also lacked an explicit statement that related principles in different domains may retain separate identities and later be grouped by derived analysis.

### 2. Authoring guidance encoded learned structural baselines

Canonical content guidance said not to write to a target count, but the writing standard preferred one Why paragraph and two or three Practices. The content workflow separately preferred one rationale and framed additional Practices relative to two. All three templates demonstrated one principle, one Why paragraph, exactly two Practices, and exactly two sources; the subdomain template always demonstrated Applicability, while the personal-growth template always demonstrated Goals and Tags.

The Coding and DevOps runs reproduced enough of this shape to show that the examples and prose were functioning as hidden defaults. The problem was not insufficient variation. It was architecture teaching a preferred shape despite claiming that structure should follow the subject.

### 3. Optional-section guidance was too easy to interpret as an all-or-none default

The standards correctly called Applicability, Goals, and Tags optional, but they did not require explicit consideration of the contextual factors most likely to make Applicability necessary. Combined with inconsistent templates, this allowed both mechanical inclusion and universal omission.

Applicability needs to be considered when scale, risk, organizational maturity, architecture, regulatory constraints, operating model, workload characteristics, lifecycle stage, reversibility, statefulness, or human operational burden materially changes correct use. It should remain absent when the statement and rationale already supply adequate calibration.

### 4. Taxonomy descriptions had a structural contract but an underspecified quality bar

The taxonomy standard required canonical descriptions, yet it did not say enough about what makes a description useful. The DevOps manifest demonstrated the failure mode: valid descriptions could repeat a generic title-substitution formula without defining ownership or neighboring boundaries.

A useful definition needs sufficient boundary information for future taxonomy, generation, and review decisions. Depending on the scope, that may include the semantic center, inclusions, exclusions, neighboring distinctions, intentional overlap, or the domain-specific interpretation. Requiring every definition to repeat the same checklist would recreate the same problem in a more elaborate form.

### 5. Publisher concentration needed an epistemic rule, not a numerical target

The source standard already rejected citation-count inflation, and the DevOps postmortem correctly treated concentration as a signal. The content and review paths did not consistently carry that distinction forward.

Concentration should prompt a reviewer to ask whether a broad or portable principle has been generalized from one organization's operating model and whether credible independent evidence could materially test or qualify it. It is not automatically a defect, and a concentrated source set should remain when those sources are the strongest claim-specific fit. Publisher quotas would weaken the evidence model.

### 6. Generation-shaped writing was observable but not an explicit semantic-evaluation dimension

The review workflow covered readability, economy, and duplication but did not directly ask whether repeated counts, sentence forms, rationale or practice lengths, favored qualifiers, taxonomy formulas, or all-or-none optional sections reflected a learned template. Without a counterexample, an evaluator could also overcorrect by rewarding cosmetic wording or arbitrary count variation.

These patterns are semantic review signals. They are unsuitable for deterministic thresholds because legitimate parallel subject matter can produce similar structures.

## Architecture disposition before implementation

**TARGETED ARCHITECTURE CORRECTION REQUIRED**

The deterministic grammar, identity model, and validation boundaries were not defective. The smallest coherent correction was to align semantic standards, workflows, templates, and advisory fixtures. No schema, policy version, corpus migration, similarity detector, publisher quota, or deterministic duplicate verdict was justified.

## Implementation disposition

**Status:** Implemented under the requested architecture outcome; corpus refinement remains separate

### Recurrence and duplication

- [Content](../standards/content.md), [Taxonomy](../standards/taxonomy.md), [Research](../standards/research.md), the [Content workflow](../workflows/create-content.md), [Update Content](../workflows/update-content.md), [Update Taxonomy](../workflows/update-taxonomy.md), the [domain furnishing workflow](../workflows/furnish-domain.md), and the [review workflow](../workflows/review-content.md) now distinguish harmful duplication from meaningful recurrence by the domain-specific meaning contributed.
- Recurrence between universal and subdomain guidance is retained when the subdomain materially develops the principle. Cross-domain recurrence is retained when interpretation, rationale, practices, applicability, importance, evidence, or provenance changes.
- [Architecture](../architecture.md) now states that related domain-authored principles retain separate identities and may later be grouped into derived higher-order themes without erasing provenance.

### Subject-shaped structure and optional sections

- [Writing](../standards/writing.md) and the Content workflow no longer prefer one rationale or two-to-three Practices. They explicitly reject preset counts and artificial variation.
- The three corpus templates now demonstrate only the required minimum grammar: one principle placeholder, one required Why block, one required Practice placeholder, and one source mapping. Optional sections are not silently included by file type.
- Content, writing, generation, maintenance, and review guidance now requires Applicability to be considered against material contextual factors while remaining optional. Goals and Tags follow the same earned-inclusion rule.
- Advisory word-economy limits remain unchanged. The writing standard clarifies that they identify possible verbosity rather than establish desired claim lengths.

### Taxonomy definitions

- The taxonomy standard and taxonomy workflows now require sufficient semantic boundary information and explicitly reject generic title-substitution descriptions.
- Semantic center, inclusions, exclusions, neighboring distinctions, intentional overlap, and domain-specific interpretation are available review considerations, not mandatory fields or a fixed prose template.

### Source concentration

- Source, research, content-generation, domain-review, and evaluation guidance now treat publisher concentration as a claim-specific review signal rather than an automatic defect.
- Independent evidence is sought when it can materially test a portable generalization. Weaker sources are not added to satisfy a diversity count.

### Generation-shaped review and semantic fixtures

- The [Evaluation standard](../standards/evaluation.md), [Architecture review workflow](../workflows/review-architecture.md), content-review workflow, and [semantic rubric](../../evals/rubrics/v1.md) now identify generation-shaped uniformity while rejecting superficial heterogeneity as a goal.
- Seven advisory fixtures and expected classifications were added across recurrence versus duplication, generation-shaped versus subject-shaped structure, and source-concentration interpretation. The fixture set now contains 23 cases.
- Manual review of the seven new cases matches their recorded classifications. They remain non-blocking and pending human calibration under the existing evaluation boundary.

### Deterministic tooling and versions

No executable schema, policy version, validator, generator algorithm, CLI behavior, or deterministic check changed. This is deliberate: recurrence, source fitness, taxonomy-definition adequacy, and generation-shaped writing require semantic judgment. The templates changed only as authoring examples and continue to instantiate under the existing grammar.

No schema-version entry or migration was needed because no canonical record shape or executable policy contract changed.

### Verification

- build passed;
- full deterministic suite passed: 95 tests;
- all three corpus templates instantiated successfully under the executable schema and GFM grammar;
- semantic fixture-to-expectation coverage passed;
- offline validation completed with 0 errors and 0 warnings, with transition checks correctly reported `not_evaluated` without a baseline;
- trusted-baseline validation against `HEAD` completed with 0 errors and 0 warnings and transition comparison `evaluated`;
- architecture review remained correctly required for the current proposed worktree; and
- whitespace checks passed.

The trusted-baseline report also lists broader architecture, governance, policy/schema, taxonomy, protected-intent, and corpus gates arising from the complete shared worktree. Those classifications include earlier changes outside this targeted correction and are not semantic approval by the validator.

### Remaining human decisions

- The DevOps corpus review findings remain unimplemented. Exact taxonomy definition changes, neighboring-scope reframes or deprecations, principle semantic changes, and activation still require their existing human decisions.
- Semantic evaluator calibration remains pending; the new fixtures are advisory.
- No decision is needed to add deterministic similarity thresholds, publisher quotas, forced structural variation, shared cross-domain principle identities, or universal evidence sidecars; those approaches were reviewed and rejected as responsibility inversions or count optimization.

## Readiness conclusion

**READY FOR TARGETED DEVOPS REFINEMENT AND CONTINUED DOMAIN-SCALE GENERATION**

The architecture now preserves analytically useful recurrence, detects harmful duplication and generation-shaped writing semantically, keeps optional structure conditional, requires meaningful taxonomy boundaries, and evaluates source concentration epistemically. Targeted DevOps refinement can proceed through the existing taxonomy, content-review, evidence, and human-activation gates without changing Coding or DevOps content as part of this architecture correction.
