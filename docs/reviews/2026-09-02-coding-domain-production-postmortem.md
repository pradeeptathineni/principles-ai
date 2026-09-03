# Coding Domain Production Postmortem

Date: 2026-09-02  
Status: Historical review snapshot; noncanonical  
Scope: End-to-end coding-domain furnishing process, tooling friction, semantic boundaries, and human gates  
Disposition: Historical input only; the tooling recommendations in this review were not implemented by the review  

## Evidence boundary

This postmortem reviews the completed coding-domain furnishing run as a real production case. It uses the resulting corpus state, the repository operations performed during the run, and the agent's experience coordinating research, drafting, review, activation, and taxonomy cleanup. It is a process and tooling review, not a new semantic quality attestation for the corpus. The separate [Independent Coding Corpus Quality Audit](2026-09-02-coding-corpus-review.md) evaluates corpus quality in greater depth.

The furnishing result comprised 14 corpus files, 47 principles, 191 citation-required claim blocks, 51 file-local bibliography entries referring to 25 unique sources, and 11 retained evidence records containing 47 claim-review rows. The run allocated 43 new principle IDs and 20 new source IDs, then activated 14 exact semantic hashes. The later `modularity` decision deprecated one redundant proposed subdomain without a corpus or principle migration.

The committed furnishing result at `69a837e` and the identifiable `modularity` transition formed the review baseline. Concurrent, unrelated worktree changes were not attributed to the furnishing run. No repository changes were made as part of the review that produced these findings.

## Production friction observed

### Workflow and state handling

The read-only workflow helper was useful for inventory, but it was invoked repeatedly because it could not retain a run's semantic progress. It reported canonical target state and generic next actions, but it could not represent that the domain-level semantic pass had been completed. Proposed-candidate handling also remained recurring work until `modularity` received an explicit lifecycle disposition.

The workflow model should continue to avoid presenting stored state as proof of semantic review. A disposable run receipt or a clearer separation between canonical completeness and current-run work could reduce repeated reasoning without creating a new canonical review sidecar.

### Context discovery

The run repeatedly used broad `sed`, `rg`, status, diff, and workflow calls to reconstruct target files, principle titles, source reuse, evidence requirements, and neighboring scopes. Several files and workflow documents were reopened after their structural facts were already known. The optional context exporter did not participate because it serves downstream selected-content use rather than a domain-authoring workset.

A compact derived furnishing package could have supplied structural state without replacing the source reading and cross-file semantic review that required full context.

### Research bookkeeping and source registration

The shared research map lived primarily in model context. The agent manually tracked which sources had been opened, which claims or files they supported, which canonical source identities already existed, and which evidence gaps remained.

Twenty new source records repeated the same registry shape and ledger operations. Operational checking later revealed redirects that led to three manual canonical-URL corrections. The link checker also scanned unrelated repository sources and returned unrelated DOI indeterminacy in the coding-domain report.

Deterministic tooling could manage retrieval status, exact and normalized URL matches, redirect preflight, record scaffolding, ledger mutation, and scoped operational reports. Evidence-kind selection, same-source judgment across meaningfully different URLs, source fitness, and source-content interpretation remain semantic work.

### Identity allocation

The run manually appended 43 principle IDs and 20 source IDs to the all-time ledger while synchronizing `next_sequence`, records, headings, and references. The validator correctly checked the result, but requiring AI to produce the repetitive mutation created avoidable typo and collision risk.

Contiguous allocation and atomic ledger updates are deterministic operations. The decision that a principle or source merits a new identity is not.

### Citations and evidence records

The 191 cited claim blocks and 51 local bibliography entries required repeated label assignment, first-use ordering, URL definitions, source-ID mappings, and repairs after source additions. A large multi-file patch failed once because its expected text no longer matched the files, requiring another read-and-patch cycle.

For the configured pilot paths, 47 evidence rows repeated deterministically derivable claim roles, normalized claim hashes, resolved source order, evaluator configuration references, and configuration hashes. AI judgment was needed for locators and outcomes, not for constructing the surrounding record shape.

### Generation and activation

Thirteen missing files repeated predictable frontmatter, title projections, headings, bibliography structure, and draft review metadata. Their principles and prose required synthesis, but their shells did not.

Activation required manually copying 14 semantic hashes into a human approval package and then updating three frontmatter fields per file: status, review date, and exact reviewed hash. Those 42 edits were mechanical and consequential only because they needed to match the approved package exactly.

### Validation and tests

The run executed the complete test suite five times. Activation caused two CLI assertions tied to the former draft state to fail; the subsequent taxonomy deprecation caused another assertion tied to the proposed state to fail. All were expected canonical-state transitions rather than product defects, but they required test edits and additional full runs.

Initial validation did not use the available trusted merge base, and repeated successful test runs returned the full list of 67 passing cases to the agent. Operational link checking first failed at the environment network boundary and then produced an all-repository report substantially larger than the coding scope.

The final furnishing state passed all 67 tests and trusted-baseline validation with zero errors and zero warnings. The friction was in orchestration and output volume, not in the deterministic checks themselves.

### Reporting and shared-worktree isolation

The activation report manually combined file paths, principle ranges, hashes, semantic findings, source limitations, operational status, and transition status. Most of its inventory was already derivable from canonical state.

The run also took place around a broad shared worktree. Scoping diffs and distinguishing task-owned changes from concurrent or pre-existing changes consumed reasoning and created attribution risk. A derived task-scope snapshot could warn when in-scope files change unexpectedly without claiming ownership of unrelated edits.

## Prioritized tooling opportunities

The ordering below weighs AI and context load removed first, then observed frequency, reliability gain, implementation complexity, and semantic risk. Lower semantic risk is preferable.

| Priority | Opportunity | Production evidence | AI/context removal | Reliability gain | Complexity | Semantic risk |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Citation and bibliography synchronizer | 191 claim blocks and 51 bibliography entries required label, ordering, mapping, and repair work | Very high | Very high | Medium | Low |
| 2 | Compact domain furnishing workset and disposable run state | Repeated workflow, search, file reads, inventories, and inability to represent completed semantic review | Very high | High | Medium | Low if noncanonical |
| 3 | Atomic identity allocation and source registration | 63 new IDs, manual ledger edits, 20 source records, and three redirect repairs | High | Very high | Medium | Low to medium |
| 4 | Evidence-record scaffolder and synchronizer | 47 rows contained mechanically derivable roles, hashes, source order, and evaluator metadata | High | Very high | Low to medium | Low |
| 5 | Activation-package generator and transactional activator | Fourteen hashes were copied into the decision package and 42 metadata fields | High | Very high | Low | Low |
| 6 | Accepted-target file scaffolder | Thirteen files repeated deterministic document structure and frontmatter | Medium | High | Low | Low |
| 7 | Scoped validation orchestrator | Five full test runs, initially omitted baseline selection, verbose successful output, and unrelated link results | Medium to high | High | Low to medium | Low |
| 8 | Fixture-isolated CLI state tests | Expected lifecycle changes broke three assertions across two phases | Medium | High | Low | Low |
| 9 | Derived research ledger | Source coverage, opened-source state, target mapping, and evidence gaps lived mostly in model context | High | Medium | Medium | Low when limited to bookkeeping |
| 10 | Duplicate-candidate triage | `modularity` required cross-file comparison and a later lifecycle decision | Medium | Medium | Medium | Medium; advisory only |

## Recommended deterministic boundaries

### Citation and bibliography synchronization

Given source IDs selected by the author, tooling could assign local labels by first use, rewrite terminal citation runs, generate the visible bibliography and URL definitions from registered sources, remove unused entries, and identify source-order changes before evidence review. It must not select sources or claim that a citation entails a statement.

### Domain preparation and work tracking

A domain preparation command could emit accepted, proposed, and deprecated scopes; absent, draft, and active targets; semantic hashes and principle titles; used source IDs; evidence requirements; next identity sequences; trusted-baseline status; and relevant policy versions. A disposable run receipt could track declared progress inside one production run while remaining noncanonical and non-evidentiary.

### Atomic registries and allocation

Commands could reserve contiguous ID blocks and update the ledger, source records, and file scaffolds transactionally. Source registration could perform normalized-URL duplicate checks, redirect preflight, and canonical field scaffolding. AI would still verify intellectual identity, bibliographic meaning, and evidence kind.

### Evidence scaffolding

The parser already exposes normalized claim roles, hashes, and resolved source order. A scaffolder could create or synchronize that structure and leave locators and outcomes explicitly unresolved for semantic review. It should refuse to make active content publishable merely by generating a valid record.

### Activation and reporting

Tooling could generate the mechanical activation package from draft files, then accept an explicitly approved file-and-hash manifest. Before mutation it would verify unchanged hashes; afterward it would update status, date, and reviewed hash atomically and rerun validation. Semantic findings, source limitations, disagreement, and the approval itself would remain outside deterministic inference.

### Scaffolding, validation, and test isolation

A file scaffolder could create missing accepted targets from templates without inventing principles. A finishing command could discover the trusted merge base, run focused checks during iteration, run the complete suite once at the final boundary, retain detailed logs, and return a concise summary. External checks could support domain, source, and changed-only scope.

CLI behavior tests should use fixture repositories for fixed lifecycle expectations. A separate repository smoke test can assert dynamic invariants without hard-coding that a real corpus target is proposed, draft, active, or deprecated.

### Research and duplication support

A disposable research ledger could track URLs opened in full, source IDs, candidate claims, target files, evidence gaps, and retrieval state without storing model summaries as evidence or retaining bulk source content. Deterministic lexical similarity could surface possible duplicates, but any conclusion about contextual distinctness or taxonomy lifecycle would remain advisory.

## Semantic work retained for AI judgment

- Map the evidence landscape and read source content.
- Select important, durable principles rather than fill a template mechanically.
- Judge claim-specific source fitness, entailment, evidence kind, scope, and strength.
- Write statements, rationales, practices, applicability, goals, and source limitations.
- Distinguish useful contextual recurrence from semantic duplication.
- Resolve ownership between universal guidance and subdomains and among siblings.
- Identify disagreement, exceptions, overgeneralization, and missing coverage.
- Perform per-file adversarial review and the final domain-level consistency and readability pass.

Tooling may expose candidates and inconsistencies but must not deterministically assert that a claim is `strong`, a principle is distinct, or semantic review has passed.

## Consequential decisions retained for human governance

- Accept, deprecate, merge, rename, reactivate, or materially rescope taxonomy.
- Change protected intent.
- Approve exact new or substantively changed principles for activation.
- Resolve material disagreement or value-laden tradeoffs.
- Approve schema, policy, governance, or intentionally lossy migrations.
- Authorize exceptional identity or lifecycle repair.

The exact 14-file activation and the later `modularity` deprecation were consequential decisions and appropriately remained human-governed.

## Suggested implementation sequence

1. Add evidence scaffolding and citation/bibliography synchronization.
2. Generate exact activation packages and apply approved activation transactionally.
3. Add atomic ID allocation and source registration.
4. Produce a compact domain workset and scoped validation summaries.
5. Isolate CLI lifecycle tests from mutable canonical corpus state and add accepted-target scaffolding.
6. Add research bookkeeping and duplicate-candidate triage only after the lower-risk mechanical path is established.

## Conclusion

The coding-domain run demonstrated that the repository's deterministic validation, stable identities, source registry, citation grammar, evidence hashes, and exact activation gate provide real value. The principal inefficiency is that the system validates many mechanical relationships only after AI has manually constructed them. The next tooling investment should make those same contracts safe to mutate and report without moving source interpretation, semantic synthesis, taxonomy judgment, or approval into deterministic code.

## Implementation disposition

**Status:** Accepted recommendations implemented with narrowed and deferred items

The recommendations were reconciled with the later architecture self-review and the independent corpus audit before implementation. Validation policy version 9 now traces the implemented deterministic boundary, and the architecture documentation identifies worksets and activation packages as disposable rather than canonical run state.

### Implemented and combined

- Citation renumbering and bibliography projection now operate from author-selected source IDs and registered source metadata. Evidence scaffolding uses the same parsed claim model, invalidates changed hashes or source order, and never supplies semantic outcomes.
- Domain preparation combines lifecycle inventory, content hashes and titles, source/evidence use, next identities, policy versions, trusted-baseline results, gates, and a hash-bound task workset in one derived report. Scoped operational checks can limit network work to a domain or explicit source IDs without weakening final repository validation.
- Principle allocation, source registration, and new-file identity materialization use contiguous allocation and validated transactions. Source metadata and intellectual identity must be reviewed before the command runs; redirects remain operational observations outside the transaction.
- Accepted-target scaffolding emits structure and `PRN-AUTO` placeholders without generating corpus meaning. Materialization allocates identities only when the reviewed content plan is written.
- Activation-package generation and the activator are hash-bound. The activator accepts an explicit approval manifest, verifies unchanged draft hashes, updates review metadata atomically, reruns validation, and rolls back on failure. It does not infer approval.
- CLI lifecycle tests now use isolated fixture repositories. The external checker treats HEAD as an optimization and uses GET as authoritative for content capture or a non-reachable HEAD result.

### Narrowed, reordered, deferred, or rejected

- The low-risk transaction primitive and evidence/citation hash model were implemented before using the commands on the coding refinements; source and principle allocation, worksets, scoped operations, and activation packaging followed. This preserved the intended safety order even though the public commands are delivered together.
- A persistent run receipt was rejected. The preparation workset removes repeated structural discovery without storing non-evidentiary semantic progress.
- Redirect preflight was narrowed to the isolated operational checker; a network result cannot silently rewrite a canonical URL or choose source identity.
- A derived research ledger remains deferred until another production domain demonstrates recurring bookkeeping that the compact workset does not remove. Model summaries or bulk source text will not become evidence.
- Deterministic duplicate classification was rejected. Lexical candidates would be advisory at most, and the current implementation leaves contextual distinctness and taxonomy disposition to semantic and human review.
- Source-family quotas and universal evidence sidecars were rejected because they would optimize counts rather than claim-specific fitness. Selective evidence records remain available for high-impact, novel, disputed, or weak claims.

### Concurrency and branch isolation

The code/test streams for transaction and mutation commands, operational HEAD/GET behavior, and fixture-isolated CLI tests were safe to develop concurrently only in isolated branches or worktrees because their write sets were distinct. Canonical policy registration, shared CLI dispatch, documentation, corpus refinements, identity/source allocation, and final activation packaging required ordered integration on one branch. No concurrent writer should allocate identities or mutate the same ledger, source record, corpus file, evidence record, or activation manifest.

### Verification

- build passed;
- full deterministic suite passed: 89 tests;
- trusted-baseline validation passed with 0 errors and 0 warnings;
- the compact coding workset reported 14 corpus files with exact input hashes;
- the NIST source check returned GET 200 and a content hash after the prior method-specific false positive; and
- diff whitespace validation passed.

Architecture, governance/CI, and policy/schema approval gates remain reported by deterministic validation. Exact activation of the coding drafts remains a separate human decision.

## Activation follow-up disposition

The human owner subsequently approved all 11 exact semantic hashes in the generated activation package. The transactional activator verified that every draft remained byte-for-byte bound to its approved semantic hash, activated the complete package atomically, and preserved those hashes in the activation metadata. This exercises the offloading path on the real coding production output rather than only on fixtures.

Post-activation verification passed the build, all 89 tests, trusted-baseline validation with 0 errors and 0 warnings, and whitespace checks. The coding furnishing workflow now reports 14 active files, no absent or draft targets, no pending gates for the requested outcome, and `outcome-satisfied`. The disposable approval manifest was removed after application; approval authority remains human-governed and is not inferred by tooling.
