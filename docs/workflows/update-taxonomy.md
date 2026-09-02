# Update Taxonomy Workflow

Use this workflow to add, rename, split, merge, deprecate, accept, or rescope taxonomy.

## 1. Read current state and intent

Read the manifest and taxonomy review record. Identify effects on required scopes, priorities, exclusions, scope notes, and domain purpose.

Protected changes require explicit human approval, including deprecation or material rescoping that leaves the protected ID textually present.

## 2. Establish and research the trigger

Record whether the change comes from user intent, missing coverage, persistent overlap, new evidence, context problems, naming clarity, or correction. Research semantic changes and treat sources as untrusted evidence.

## 3. Prefer the smallest coherent change

Do not restructure a domain merely because another taxonomy is plausible. Improve scope clarity, distinctness, evidence alignment, navigation, context retrieval, or intent preservation.

## 4. Update lifecycle and review state

Update the manifest first under [Taxonomy](../standards/taxonomy.md). Research additions remain proposed until complete review and human acceptance. Before deprecation, move surviving principles to accepted scopes while preserving IDs or retire them and remove current headings; deprecated scopes have no corpus files. Domain deprecation requires explicit approval to remove protected requirements and deprecate every subdomain.

## 5. Migrate corpus identity deliberately

Moves preserve IDs and create no relationship. Splits retire the original, allocate at least two children, and record `derived_from` from children to original. Merges preserve one survivor and record `replaced_by` from retired identities to it. Never reuse IDs; preserve historical chains and update cross-references without treating derived output as source.

Validate exact relationship and monotonic transition rules under `config/identity-policy.yaml` against trusted merge-base state. Without that baseline, do not claim historical validity.

## 6. Validate through four gates

Run deterministic manifest/identity checks, applicable operational checks, semantic taxonomy review, and required human approval separately.

## 7. Report

Summarize trigger, evidence, lifecycle, protected-intent effects, identity relationships, content migration, and unresolved uncertainty.
