# Update Taxonomy Workflow

Use this workflow to change the taxonomy of an existing domain.

Examples:

- Add a subdomain.
- Rename a subdomain.
- Merge or split subdomains.
- Deprecate or remove a subdomain.
- Change a domain boundary.
- Change a stable code.

## 1. Read current intent

Read `domains/<domain>/domain.yaml` first.

Identify whether the proposed change affects `required_subdomains`.

If it does, the change requires explicit human approval. An agent may propose such a change but must not autonomously apply it.

## 2. Establish the trigger

Determine whether the change is driven by:

- Explicit user request.
- New domain research.
- Persistent content overlap.
- A missing major practice area.
- A source/framework evolution.
- Context-retrieval problems.
- Naming clarity.
- A prior taxonomy mistake.

## 3. Research and compare

For semantic taxonomy changes:

1. Re-evaluate the domain boundary.
2. Inspect neighboring manifests.
3. Research authoritative domain structures where useful.
4. Compare the proposed scope with existing subdomains.
5. Preserve explicit human priorities.

## 4. Prefer the smallest coherent change

Do not restructure a domain merely because a different taxonomy is also plausible.

A change should improve one or more of:

- Scope clarity.
- Distinctness.
- Evidence alignment.
- Human navigation.
- AI context retrieval.
- Intent preservation.

## 5. Update manifest first

Change `domain.yaml` before moving or generating corpus files.

Stable codes should normally remain unchanged for semantic continuity.

Changing a stable code is high-impact because it can affect entry IDs and downstream references.

## 6. Migrate corpus deliberately

If files move, split, merge, or become deprecated:

- Preserve principle semantic identity when practical.
- Update cross-references and generated indexes.
- Avoid silent ID reuse.
- Do not delete useful content merely because the taxonomy changed.

## 7. Validate

Run manifest, code, path, registration, corpus, and applicable semantic checks.

Rebuild the generated taxonomy aggregate when supported.

## 8. Report

Summarize:

- What changed.
- Why.
- Whether human-required scopes were affected.
- Research/evidence used.
- Content/ID migrations.
- Remaining uncertainty.
