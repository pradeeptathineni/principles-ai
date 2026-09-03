# Furnished-Domain Refinement Routing Architecture Review

**Date:** 2026-09-02  
**Status:** Historical, noncanonical architecture review  
**Scope:** Domain-wide renewed candidate discovery and principle selection for already active corpora; no corpus, taxonomy, source, or evidence changes

## Finding

The completed Coding and DevOps refinement runs repaired findings in their existing selected sets but did not exercise the later broad candidate-discovery and selection stages for every existing subdomain. Coding changed 11 of 14 files and added two identified Design principles. DevOps changed 13 of 24 files, added the three coverage concerns already identified by its audit, and left 11 subdomain files untouched. The resulting 51-principle DevOps corpus became an input to the later principle-discovery architecture correction, whose readiness conclusion called for another pass.

The current per-file Update content workflow correctly requires substantive scope-level refinement to repeat candidate discovery, coverage analysis, comparison and consolidation, and final selection. The routing layer did not provide the corresponding domain-wide outcome. Ordinary furnishing treated active files as completed inputs, invoked content work only for missing or draft targets, and therefore returned `outcome-satisfied` for an already active corpus. Active status established prior review identity, not renewed coverage under a later process contract.

This did not prove that any two-principle file was semantically incomplete. It meant that sufficient coverage had not been established by the new process and that a domain-wide request could collapse to a furnishing no-op before testing the question.

## Architecture disposition

**EXPLICIT FURNISHED-DOMAIN REFINEMENT ROUTE REQUIRED**

The smallest coherent correction is an invocation-scoped outcome that reuses the existing domain coordinator and Update content workflow, includes every active accepted target, preserves ordinary furnishing idempotence, and retains only lightweight derived candidate dispositions. No principle-count threshold, persistent candidate ledger, schema change, or deterministic semantic judgment is warranted.

## Implementation disposition

**Status:** Implemented with human approval

- `AGENTS.md` and Outcome orchestration route natural-language domain coverage reassessment to `refine-domain-content`.
- Domain furnishing now has a separate refinement branch that sends every universal and accepted-subdomain target through substantive Update content semantics. Reviewing only known findings or final-file consistency does not satisfy the branch.
- Unchanged targets remain active only after a target-specific sufficiency disposition. Changed targets retain the existing draft, semantic-review, meaningful activation-package, and human-decision path.
- Validation policy version 12 registers the new outcome, agent action, and advisory candidate-selection checks. The CLI exposes `workflow --outcome refine-domain-content --domain <domain>` without treating its report as semantic proof.
- One advisory architecture fixture covers the former active-domain no-op, and workflow/CLI tests distinguish ordinary furnishing from explicit refinement.

No corpus, taxonomy, source, evidence, identity, schema, or human-gate semantics changed. The user explicitly approved this architecture and policy correction on 2026-09-02.

## Verification

- the build passed;
- the full deterministic suite passed: 97 tests;
- trusted-baseline validation against `HEAD` completed with transition comparison evaluated, zero errors, and zero warnings;
- ordinary DevOps furnishing still reported 24 active targets and `outcome-satisfied`;
- explicit DevOps refinement reported the same 24 targets, declared that active status does not prove coverage, and selected `run-substantive-update-content-for-all-domain-targets` before the domain consistency pass; and
- whitespace checks passed.

Historical Coding and DevOps content was not modified or re-approved by this architecture change. Wider human gates reported against the shared worktree remain attributable to earlier taxonomy, corpus, policy, schema, and governance changes; deterministic validation does not authenticate those decisions.
