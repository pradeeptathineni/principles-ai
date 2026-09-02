# First Production Run Review

## Scope

This review uses the actual `domains/coding/design.md` production run as evidence. It is an architectural critique, not a compliance attestation. The run created one accepted scope, four principles, six source records, four claim-review records, and one evaluator configuration; it exercised deterministic, operational, semantic, and human gates. The overhaul removed the unused NIST record that existed only to support the retired taxonomy-review artifact and permanently retired its allocated ID.

## What the run exposed

The user named an existing registered target, yet the system required a full-domain taxonomy sidecar and an approval stop before drafting. That stop did not resolve a new boundary or protected-intent choice. It duplicated state across a manifest, review file, hashes, workflow, schema, policy, validator, template, and tests.

The exact content-activation stop did add value: the user had not seen the four principles or their wording. It remains the normal human gate.

The format encouraged every entry to expand. Four principles produced 28 separately cited blocks, including repeated Why paragraphs, three Practices each, and Applicability sections whether or not the additional structure earned its cost. The revised draft has 19 claim blocks and 596 words while preserving all four identities and decisions.

The evidence records caught claim drift and retained useful locators, but repeated reviewer date, identity, system, model, configuration path, prompt hash, and settings hash for every claim. Review metadata now appears once per principle record and one exact file hash binds the evaluator configuration.

The A–E authority field collapsed unlike evidentiary roles. SWEBOK, NIST SSDF, a Parnas paper, a Dijkstra essay, and an SEI report all received `A`, making the field look precise while hiding the relevant differences. Records now identify evidence kind without implying a universal rank.

The deterministic harness found real structural errors and reproduced derived taxonomy reliably. Stable identities, local citations, source lifecycle, semantic activation hashes, trusted-baseline transitions, operational link isolation, and claim hashes earned their cost. The optional context exporter did not participate in creation; it remains a downstream tool, not required agent context.

## Decisions

| Mechanism | Decision | Empirical reason |
| --- | --- | --- |
| Taxonomy lifecycle and protected intent | Keep | Prevents accidental scope drift and supports incremental coverage. |
| Mandatory taxonomy review state/sidecar/hash | Remove | Added a ceremonial stop and broad review artifact for one unchanged named scope. |
| Stable PRN identity and relationship ledger | Keep | Makes moves, splits, merges, and historical references durable at scale. |
| Stable SRC registry and local citations | Keep | Separates human-readable files from URL/lifecycle maintenance and prevents duplicate identities. |
| Scalar source authority class | Replace | Confused normativity, primacy, institutional experience, and individual argument. |
| Evidence claim hashes and locators | Keep selectively | Detect wording/source drift and make re-review focused. |
| Repeated per-claim evaluator metadata | Remove | Multiplied storage without changing the review setup. |
| Universal evidence sidecars | Do not adopt | The first file did not justify one record per principle across the future corpus. |
| Exact active-content semantic hash | Keep | Binds approval to the wording humans reviewed. |
| Deterministic validators and schemas | Keep, reduce | They caught concrete inconsistencies; checks tied only to retired machinery were removed. |
| Context exporter | Keep optional | Potential downstream value, but no role in the routine authoring path was demonstrated. |

No committed hand-maintained corpus catalog was added. The Markdown remains the primary human view; a catalog should be generated from validated manifests and files only when corpus volume demonstrates the need.

## Scale projection

At hundreds of files, the previous path would multiply approval fatigue, full-domain review work, repeated evaluator metadata, and prose shaped by available headings. The revised path loads one routine guide, accepts an unchanged explicitly requested registered target after fit research, maps the source landscape before synthesis, warns about word economy, uses evidence sidecars selectively, and stops once for exact activation.

## Readiness criterion

The second production file should be attempted only after the revised `coding/design.md` wording receives its exact activation decision and all deterministic, operational, semantic, and transition-relevant checks pass. That run should test whether the one-guide, one-normal-gate path works without special prompting.
