# Domain Furnishing Workflow

A prompt such as `Fully furnish the coding domain.` requests complete coverage of one existing registered domain. This workflow coordinates [Outcome orchestration](orchestrate-outcome.md), [Update taxonomy](update-taxonomy.md), and the existing [Content workflow](create-content.md); it does not replace their rules.

## 1. Inventory and resume

Read the target manifest and inventory its universal files, subdomain files, current drafts, and active files. The furnishing set consists of both universal files and every accepted subdomain. It may expand to an unchanged registered proposed scope only after the taxonomy workflow confirms that the scope passes the admission test and can be accepted under the explicit domain outcome. Skip deprecated scopes. Leave a proposed candidate proposed, with no corpus file, when it does not safely qualify; stop only if completion instead requires a new scope, material rescope, protected-intent change, or unresolved boundary decision.

Treat active files as completed inputs, resume drafts, and create only missing targets. Never recreate a completed file, identity, source record, or evidence record. Rerun the inventory after every taxonomy transition so newly accepted scopes enter the furnishing set and unchanged completed work drops out.

The read-only helper `node bin/principles.js workflow --domain <domain> --json` reports this inventory and the next agent-owned stage. It is planning evidence, not semantic review or approval.

## 2. Resolve prerequisites

Use the taxonomy workflow for any lifecycle prerequisite. The domain outcome authorizes research and acceptance of the unchanged registered domain and unchanged registered candidate scopes whose fit is confirmed. Required subdomains follow the existing domain-acceptance rule. Do not create content until its exact scope is accepted.

If research exposes overlap that can be handled by selecting fewer candidates or clarifying drafts within existing scope, do so without inventing a taxonomy change. Present a human decision only for the cases reserved by current taxonomy and governance policy, then resume this workflow automatically.

## 3. Build one research map, then furnish targets

Map the domain's evidence families, boundaries, existing principles, canonical sources, and likely cross-file overlap once. For each incomplete target, invoke the Content workflow. Give it only the shared map, target state, neighboring material needed for placement, and incremental evidence gaps; do not repeatedly load the full domain or redo settled research.

Reuse a canonical `SRC-......` record when it is the same source. Reuse never substitutes for claim-specific evidence selection: each file still considers stronger available evidence, independence, disagreement, scope, and exact entailment. Apply the configured evidence-record boundary independently to each target. Allocate identities only when materializing new records.

When the Content workflow reaches a reviewed draft, return it to this coordinator instead of interrupting the domain run with a separate activation request for every file. Existing active files remain active unless the review finds a substantive change that must go through draft and approval.

## 4. Review the furnished domain

After all targets are present and individually reviewed, perform one domain-level semantic and consistency pass across the universal and accepted-subdomain files. Check:

- coverage of protected intent and accepted scopes, with no file for proposed or deprecated scopes;
- duplicate or conflicting principle meaning, including differently worded duplicates;
- ownership and scope conflicts between universal guidance and subdomains, and among subdomains;
- consistent terminology, strength, applicability, exceptions, goals, and treatment of material disagreement;
- stable principle and source identity, justified cross-file source reuse, and required evidence consistency;
- source-family coverage, stronger-source omissions, durability, usefulness, and readability across the domain.

Repair findings through the affected Content workflow and rerun both affected-file review and the domain pass. Keep deterministic validation, operational observations, semantic findings, and approval status separate.

## 5. Validate, decide once, and finish

Run offline repository validation and relevant tests against a trusted merge-base when available. Run operational source checks only when current source state matters. Present one exact domain activation package containing every new or substantively changed draft, file-by-file semantic results, cross-file findings, source limitations, disagreements, and transition status. This batching changes neither the content approval standard nor the user's ability to approve a subset.

After the required human decision, activate only the approved exact semantic hashes, rerun validation and the final domain consistency pass, and report skipped proposed scopes and any remaining uncertainty. The outcome is satisfied when both universal files and every accepted subdomain file are valid and active, no unresolved material cross-file conflict remains, and all required decisions have been recorded through the existing workflow. A later rerun verifies this state and performs no content creation unless canonical state has become incomplete or inconsistent.
