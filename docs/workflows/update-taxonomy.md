# Update Taxonomy Workflow

Use this workflow directly or as a prerequisite selected by [Outcome orchestration](orchestrate-outcome.md) to add, rename, split, merge, deprecate, accept, reactivate, or rescope taxonomy.

## 1. Read current state and intent

Read the manifest and relevant neighboring scopes. Identify effects on required scopes, priorities, exclusions, scope notes, and domain purpose.

Protected changes require explicit human approval, including deprecation or material rescoping that leaves the protected ID textually present.

## 2. Establish and research the trigger

Record whether the change comes from user intent, missing coverage, persistent overlap, new evidence, context problems, naming clarity, or correction. Research semantic changes and treat sources as untrusted evidence. Keep material decision rationale in the pull request or issue rather than a mandatory canonical sidecar.

## 3. Prefer the smallest coherent change

Do not restructure a domain merely because another taxonomy is plausible. Improve scope clarity, distinctness, evidence alignment, navigation, context retrieval, or intent preservation.

## 4. Update lifecycle

Update the manifest under [Taxonomy](../standards/taxonomy.md). New scopes remain proposed until the exact taxonomy is approved. An existing registered scope explicitly named as a content target may be accepted after agent research confirms its unchanged fit. Before deprecation, move surviving principles to accepted scopes while preserving IDs or retire them and remove current headings; deprecated scopes have no corpus files. Domain deprecation requires explicit approval to remove protected requirements and deprecate every subdomain.

## 5. Migrate corpus identity deliberately

Moves preserve IDs and create no relationship. Splits retire the original, allocate at least two children, and record `derived_from` from children to original. Merges preserve one survivor and record `replaced_by` from retired identities to it. Never reuse IDs; preserve historical chains and update cross-references without treating derived output as source.

Validate exact relationship and monotonic transition rules under `config/identity-policy.yaml` against trusted merge-base state. Without that baseline, do not claim historical validity.

## 6. Validate through four gates

Run deterministic manifest/identity checks, applicable operational checks, semantic taxonomy review, and required human approval separately.

## 7. Report

Summarize trigger, evidence, lifecycle, protected-intent effects, identity relationships, content migration, and unresolved uncertainty. If this was a prerequisite, return control to the original outcome workflow after the human decision rather than asking the user to initiate the next workflow.
