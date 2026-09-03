# Domain Furnishing and Refinement Workflow

This coordinator has two explicit outcomes:

- Ordinary furnishing completes missing or draft universal and accepted-subdomain targets; a fully active domain is an idempotent no-op.
- Domain refinement renews evidence discovery and principle selection for every such target, including active files that remain unchanged.

Do not infer refinement from a furnishing rerun or localized maintenance request. Load [Content](create-content.md), [Update content](update-content.md), or [Update taxonomy](update-taxonomy.md) only when the stage below delegates to it.

## 1. Inventory and resolve prerequisites

Read the manifest and use the workflow/prepare helpers when useful to inventory universal files, subdomain definitions, absent/draft/active content, proposed candidates, and deprecated scopes. Helper worksets, counts, hashes, and gates are disposable coordination support; they do not prove research, review, or approval.

The target set is both universal files plus every accepted subdomain. Ordinary furnishing skips valid active files, resumes drafts, and creates missing targets. Refinement treats all target files as semantic inputs but leaves an unchanged active file active. Never recreate content, identities, sources, or evidence.

Evaluate proposed registered scopes independently under the taxonomy workflow. The domain request may accept an unchanged candidate whose fit is confirmed. Leave it proposed only while acceptance is genuinely unresolved; a stable negative conclusion requires an exact human-approved deprecation. Skip deprecated scopes unless reactivation is requested. Additions, definition changes, rename/reframe, merge/split/replacement, deprecation, reactivation, protected-intent change, and unresolved boundaries remain human decisions. Rerun the inventory after every taxonomy transition and resume automatically.

## 2. Share research without sharing conclusions

Build one domain map of boundaries, evidence families, existing principles and sources, cross-file overlap, and likely candidate themes. Give each target only this shared map, its state, neighboring material needed for placement, and incremental evidence gaps. Reuse settled research without repeatedly loading the full domain.

For each missing or draft target, run the Content workflow. A shared map seeds but never replaces that target's own broad discovery, coverage analysis, candidate comparison/consolidation, and subject-determined selection.

For refinement, run the substantive branch of Update content for every target. Each target must:

1. reopen evidence far enough to discover plausible new themes rather than only inspect existing entries;
2. test coverage of the dimensions revealed by that subject and evidence;
3. compare existing and new candidates, consolidating only genuine redundancy; and
4. select every candidate that clears the inclusion bar, whether the set is preserved, expanded, reduced, or restructured.

Retain a concise disposable disposition per refined target: major themes considered, dimensions checked, consequential inclusion/consolidation/rejection/placement decisions, and why a narrow result is sufficient where relevant. Completing known gaps or checking consistency without renewed discovery does not satisfy refinement.

For long runs, a hash-bound run checkpoint may retain source/target mappings, evidence gaps, reviewed artifacts, domain-pass state, and activation-package binding. Regenerate it when inputs change. It proves only that declared coordination still matches those inputs—not reading, fitness, entailment, review, or approval.

Reuse source identity without assuming claim fitness. Each target still checks stronger evidence, independence, disagreement, scope, and entailment, and applies the configured evidence-record boundary. After semantic review, version-2 source/content plans and domain citation synchronization may batch deterministic mutation. Per-target review remains unchanged.

## 3. Review the domain as a system

After target-level review, inspect all universal and accepted-subdomain files together for:

- coverage of protected intent and accepted scopes, with no content for proposed/deprecated scopes;
- ownership, conflict, and true duplication, while preserving recurrence that adds context-specific meaning, practice, applicability, importance, evidence, or provenance;
- terminology, normative strength, applicability, exceptions, goals, and material disagreement;
- principle/source identity, claim-specific source reuse, required evidence, stronger-source omissions, durability, usefulness, and readability;
- target-level discovery and coverage, especially repeated narrow results across broad scopes or consolidation that hid distinct concerns;
- candidate inflation and generation-shaped uniformity in counts, prose, vocabulary, definitions, or optional sections, without demanding cosmetic variation.

Repair through the affected content route, repeat its review, and rerun the domain pass. Keep deterministic, operational, semantic, and approval results separate.

## 4. Validate, decide, and finish

Run offline validation and relevant tests against a trusted merge base when available; run operational source checks only when current state matters. Generate one complete activation package and compact human projection with file-level semantic results, cross-file findings, source limitations, disagreement, and transition status. Batching does not weaken the approval standard or prevent partial approval.

After the meaningful human decision, derive the selected manifest from the package and apply it transactionally. Do not ask anyone to interpret or transcribe fingerprints. Regenerate and re-present any artifact whose bound content, taxonomy, source metadata, or evidence changed. Rerun validation and the domain pass.

Furnishing is complete when every target is valid and active, no candidate decision or material cross-file conflict remains, and required decisions are recorded. Refinement is complete when every invocation-scoped target completed all four selection stages, dispositions and the domain pass reveal no unresolved coverage defect, changed artifacts are active after approval, and unchanged targets have a subject-based sufficiency disposition. Because that semantic completion is not canonical state, a later explicit refinement begins a new assessment.
