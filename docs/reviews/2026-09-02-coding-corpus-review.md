# Independent Coding Corpus Quality Audit

I reviewed the 14 coding corpus files, 47 principles, 191 cited claim blocks, 25 referenced sources, all 11 required evidence sidecars, the coding taxonomy, adjacent scope context, and the applicable content, writing, research, source, evidence, and taxonomy standards.

No files were modified during the audit.

## BLOCKER

None.

The corpus is usable, structurally valid, and does not contain a defect that invalidates the domain as a whole.

## IMPORTANT

1. **SOURCE/EVIDENCE — A heavily used canonical source URL is broken.**

   [`SRC-000014`](../../sources/SRC-000014.yaml) returns HTTP 404 as of 2026-09-02. It accounts for 36 citation occurrences across five coding files. NIST still publishes SP 800-218 v1.1 through its [official publication page](https://csrc.nist.gov/pubs/sp/800/218/final); version 1.2 remains a draft according to the [SSDF publications page](https://csrc.nist.gov/Projects/ssdf/publications). This is a source-record URL/lifecycle defect, not an evidence-content failure.

2. **SOURCE/EVIDENCE — Source quality is generally high, but concentration is excessive for a foundational domain.**

   Of 308 source attributions:

   - IEEE Computer Society: 85, or 27.6%.
   - Google: 83, or 26.9%.
   - NIST: 36, or 11.7%.
   - ISTQB: 27, or 8.8%.

   Two publishers supply 54.5% of all attributions; four supply 75%. `code-review.md` uses five pages from one Google guide, while testing, debugging, and performance each rely on only two sources. These are credible sources, but broad synthesized principles need more independence than project or institutional practice alone. This concentration is already contributing to overgeneralization.

3. **SOURCE/EVIDENCE — Several active claims have only partial entailment.**

   The clearest cases are:

   - [`PRN-000034`](../../domains/coding/security.md) combines input validation, authorization, trust-boundary placement, safe downstream representation, allowlisting, and context-specific injection defenses under one NIST citation. SP 800-218 directly supports high-level input validation and output encoding, but not every stronger implementation detail in the principle and practices. The principle is good; the evidence coverage is incomplete.
   - [`PRN-000029`](../../domains/coding/debugging.md) cites ISTQB for “correct the defect at the boundary that owns it.” ISTQB directly supports confirmation and regression testing, but not ownership-boundary placement or the causal claim about symptom suppression. The verification half is strong; the repair-placement half lacks direct support.
   - [`PRN-000039`](../../domains/coding/performance.md) is supported topically rather than exactly. The [SRE SLO chapter](https://sre.google/sre-book/service-level-objectives/) supports explicit, user-relevant measurement, and SWEBOK supports profiling and locating hot spots, but the cited sources do not clearly establish the full inventory of complexity costs, rollback rule, or simple-path recommendation.
   - [`PRN-000045` practice 2](../../domains/coding/version-control.md) generalizes the Git project’s own “oldest relevant integration branch” workflow to all version-control practice. The [Git documentation](https://git-scm.com/docs/SubmittingPatches) supports that direction for Git’s maintenance model, not universally; many projects fix forward and backport selectively.
   - [`PRN-000031` practice 2](../../domains/coding/error-handling.md) prescribes failure injection at every meaningful step, including cleanup and reporting. The cited CERT and OWASP material supports rollback, valid state, cleanup, and safe reporting, but not this complete testing prescription.
   - [`PRN-000021` practice 1](../../domains/coding/maintainability.md) adds change history, defect recurrence, review difficulty, and test friction as hotspot measures under a single broad SWEBOK citation. SWEBOK supports technical-debt and complexity measurement, but not the full operational heuristic as written.

4. **EVIDENCE — Some pilot sidecars overstate “strong” outcomes.**

   The personal-growth sidecars are structurally valid, but several semantic judgments should be reopened:

   - [`PRN-000014` practice 2](../../evidence/claims/PRN-000014.yaml) marks the “record recurring mistakes, then retire an item” procedure strong from deliberate-practice research that supports tailored feedback and reassessment, not that exact tracking workflow.
   - [`PRN-000015`](../../evidence/claims/PRN-000015.yaml) treats a Google review-comment guide and SWEBOK teamwork material as strong evidence that reviewing other people’s code tests the reviewer’s understanding. That is a reasonable inference, but the cited sections do not directly establish the learning effect.
   - [`PRN-000016` practice 2](../../evidence/claims/PRN-000016.yaml) cites SWEBOK sections on construction verification and quality rather than the later section that actually discusses reviewing generated code. The source contains relevant material, but the retained locator does not identify it.

   The deliberate-practice source also carefully distinguishes coached deliberate practice from self-directed purposeful practice and notes limits on generalization. That nuance is largely absent from `PRN-000014`. See the [source discussion](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2019.02396/full).

5. **CORPUS — Small/coherent-change guidance is triplicated with too little contextual differentiation.**

   These entries substantially repeat the same statement, rationale, practices, and sources:

   - [`PRN-000012`](../../domains/coding/principles.md): small, self-contained, reversible changes.
   - [`PRN-000043`](../../domains/coding/version-control.md): small, coherent commits; separate behavior and refactoring.
   - [`PRN-000048`](../../domains/coding/code-review.md): small, self-contained review units.

   Commit structure, review-unit sizing, and general change strategy are distinguishable concerns, but the current versions do not exploit those differences enough. This is a corpus duplication defect, not evidence that the version-control or code-review subdomains themselves should be merged.

6. **CORPUS — `principles.md` only partly succeeds as highest-order guidance.**

   [`PRN-000010`](../../domains/coding/principles.md) and `PRN-000011` are genuinely cross-cutting and high-order.

   `PRN-000012` largely summarizes version-control and review guidance. `PRN-000013` bundles security, failure behavior, resource limits, and unspecified “other safety constraints” into a broad umbrella whose practices are chiefly a summary of security and verification files.

   The file is not merely a table-of-contents summary, but half of its selection needs sharper evidence of why it belongs above, rather than beside, the subdomains.

7. **CORPUS COVERAGE — Generic concurrency and asynchronous-state reasoning are materially undercovered.**

   Concurrency appears only as something to document, test, or notice during review. The corpus has no durable guidance about ownership of shared state, ordering, cancellation, synchronization, atomicity, liveness, or making concurrent behavior reproducible enough to reason about.

   This matters across coding contexts, not only backend systems. It is a real coverage gap, but the correct taxonomy placement is not established by this audit: it could be added within design, error handling, or testing or, after evidence mapping, justify a distinct scope.

## MINOR

- **CORPUS — Secondary duplication remains:** testing’s `PRN-000026` and debugging’s `PRN-000029` share most of their verification content; maintainability impact analysis overlaps code-review system context; safe diagnostic separation overlaps security failure handling. These pairs have legitimate contextual distinctions, but ownership should be made more explicit.
- **CORPUS — API evolution is thinly covered.** Stable interfaces and contract documentation are present, but compatibility, deprecation, semantic versioning, and migration-safe evolution receive little direct guidance.
- **STYLE — All 47 entries use exactly one Why paragraph and exactly two Practices.** The prose is concise, but this perfect regularity creates a conspicuously generated rhythm and encourages coverage to be compressed into compound bullets.
- **STYLE/CORPUS — Personal-growth Goals look symmetry-driven.** The goal under `PRN-000015` mostly repeats code-review’s evidence-versus-preference rule rather than the learning outcome of explanation. “Adopt new tools quickly” under `PRN-000016` adds an unnecessary speed imperative.
- **NUANCE — Applicability is underused.** Performance optimization, Git integration direction, “fail closed,” and deliberate or purposeful practice all have meaningful exceptions or context that would benefit from explicit calibration.
- **STYLE — Repeated vocabulary is noticeable:** “explicit,” “relevant,” “meaningful,” “according/proportional to risk,” “boundary,” and “coherent” recur heavily. Most uses are accurate, but more concrete wording would improve memorability.

## OPTIONAL

- Retain claim-review sidecars selectively for the high-impact or currently weak claims identified above. The existing policy already supports this; universal sidecars are not necessary.
- Consider a second independent source family for code review and empirical support for reviewer learning, review size, and review latency.
- Tags are correctly absent. Adding them now would be filler without a demonstrated retrieval vocabulary.

## Positive assessment

The majority of the corpus is strong:

- Design, readability, and maintainability have clear conceptual boundaries.
- Testing and debugging are mostly well separated until the final repair-verification step.
- Dependencies is especially coherent and practically useful.
- Documentation and code review are immediately usable by practitioners.
- Principles are concise, durable, and largely free from tool churn.
- Why paragraphs generally add consequences instead of simply restating statements.
- Practices are concrete and seldom padded.
- Cross-file terminology is consistent, with no material contradictions.
- `personal-growth.md` is meaningfully distinct from the technical-practice files: it selects for capability development, feedback loops, peer learning, and professional currency. Its problem is evidence calibration and goal quality, not its existence or basic scope.

## Validation and tooling

- `npm run validate` completed with 0 errors and 0 warnings.
- Identity, source, taxonomy, and corpus transitions were reported `not_evaluated` because no trusted baseline was supplied. I do not score the ongoing architecture migration or the `modularity` lifecycle transition on that basis.
- The isolated external-link checker correctly detected the NIST failure. This is evidence that the operational/semantic separation is working, not an architecture defect.
- No architecture or validator change is justified by the corpus findings alone.

## Scaling risks

The patterns most likely to multiply badly across future furnished domains are:

- using one broad synthesis and one institutional house guide as the default evidence backbone;
- allowing project-specific workflow advice to become universal guidance;
- repeating universal principles inside subdomains without adding materially different decisions;
- filling every entry to an identical structural shape;
- assigning AI-reviewed `strong` outcomes where the evidence supports only a reasonable inference;
- retaining exact locators only for pilot files while broad, high-impact claims elsewhere rely on whole-document citations;
- letting one broken source record affect many files because source health is checked only after activation.

## Conclusion

**CODING CORPUS NEEDS TARGETED REFINEMENT**

## Implementation disposition

**Status:** Accepted findings implemented as reviewed drafts; exact activation pending human approval

The findings were rechecked against the current repository and the cited source sections. The original review body and conclusion remain the historical assessment of the previously active corpus.

### Source and evidence corrections

- `SRC-000014` was not moved or replaced. Direct GET retrieval of the registered NIST PDF succeeds with HTTP 200 and captured content; the former 404 was a HEAD-only false positive. The operational checker now falls back to GET for non-reachable HEAD results and always uses GET for content capture.
- `PRN-000034` now states only the NIST-supported input-validation and output-encoding guidance. Unsupported authorization, allowlist, trust-boundary placement, and sink-specific prescriptions were removed.
- `PRN-000029` now owns causal diagnosis and confirmation of the original failure; `PRN-000026` owns durable regression coverage and impact-based test selection.
- `PRN-000039`, `PRN-000045` practice 2, `PRN-000031` practice 2, and `PRN-000021` practice 1 were narrowed to the exact objectives, project-specific conditions, representative failures, and complexity evidence established by their sources.
- The `PRN-000014` and `PRN-000015` sidecars were rebuilt against narrowed wording. `PRN-000014` now distinguishes self-directed purposeful practice from coached deliberate practice and records its applicability limits. `PRN-000015` gained independent empirical code-review evidence for knowledge transfer, team awareness, code understanding, and alternative solutions. The `PRN-000016` generated-code locator now points to SWEBOK Software Construction section 5.1, page 4-30.

### Corpus refinements and coverage

- `PRN-000012` now governs isolation of independent engineering decisions, `PRN-000043` governs the historical commit unit, and `PRN-000048` governs reviewer attention and feedback delay. Their practices no longer repeat one generic small-change rule.
- `PRN-000012` and `PRN-000013` were sharpened as highest-order guidance: decision isolation and correctness under adverse constraints. Their required evidence records were recomputed and semantically reviewed.
- `PRN-000046` now makes independent review ownership explicit and cites an empirical source outside the Google practice guide. The debugging/testing overlap was separated as described above; maintainability keeps impact planning while code review independently challenges the author's stated impact.
- New `PRN-000053` adds shared-state ownership, invariants, synchronization, ordering, progress, wake-up, and cancellation reasoning within accepted `design` scope. New `PRN-000054` adds source, wire, and semantic compatibility plus versioned deprecation/migration behavior in the same scope. Both have complete claim-review records and were supported by three newly registered source families for concurrency and API evolution.
- Practice counts now vary where one or three behaviors are warranted. Applicability was added for decision sizing, purposeful versus deliberate practice, fail-closed behavior, performance complexity, Git's project-specific integration direction, and interface stability.

### Dispositions not encoded as quotas or filler

Publisher concentration remains a review signal, not an executable quota. The implementation added independent evidence where a specific weak or new claim required it and narrowed claims that had overgeneralized institutional practice. It did not add weak citations merely to change percentages. Further source diversification remains claim-driven during future maintenance.

Universal evidence sidecars and tags remain rejected; current policy already supports selective high-impact records, and no controlled retrieval vocabulary justifies tags. A separate research-ledger or deterministic duplicate verdict was not added for the reasons recorded in the production-postmortem disposition.

### Verification and activation state

- build passed;
- full deterministic suite passed: 89 tests;
- trusted-baseline validation passed with 0 errors and 0 warnings;
- all changed claim records match current wording and source order with publishable outcomes; and
- exact activation packaging succeeded for 11 changed coding files.

The 11 files remain `draft` with null activation metadata. This is intentional: the repository requires human approval of the exact semantic hashes before the transactional activator may mark them active. Until that decision, the previously active corpus has been replaced in the worktree by valid reviewed drafts, not silently re-approved content.

## Activation follow-up disposition

The human owner subsequently approved all 11 packaged semantic hashes without alteration. The transactional activator rechecked each hash and activated all 11 files atomically on 2026-09-02. The resulting coding corpus contains 14 active files, no drafts, and no absent furnishing targets; the workflow reports `outcome-satisfied` with no pending human gate for this outcome.

Post-activation verification passed the build, all 89 tests, trusted-baseline validation with 0 errors and 0 warnings, and whitespace checks. This follow-up records the later disposition without changing the review's historical findings or its description of the pre-approval state.
