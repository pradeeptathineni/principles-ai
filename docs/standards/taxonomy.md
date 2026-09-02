# Taxonomy Standard

## Purpose

Taxonomy creates useful entry points into bodies of practice. It is not a perfect ontology or a mandate to create a file for every topic.

## Canonical model

- `config/taxonomy-policy.yaml` defines executable universal rules.
- `domains/<domain>/domain.yaml` records canonical local taxonomy state and protected intent.
- An optional repository-wide aggregate is derived, disposable, and not committed by default.

## Lifecycle

- `proposed`: preserved candidate taxonomy not yet independently accepted.
- `accepted`: reviewed and human-approved for use.
- `deprecated`: retained historical taxonomy no longer active.

Origin describes how a scope entered the taxonomy; it does not prove evidence, quality, or acceptance. Content coverage is derived from validated files and is independent of taxonomy lifecycle.

Lifecycle combinations are deliberately constrained. A proposed domain has an empty review and no accepted subdomains. An accepted domain has a complete resolving review, every required subdomain accepted, and may retain other proposed or deprecated candidates. Accepted subdomains require an accepted parent. A deprecated domain has only deprecated subdomains and no remaining required subdomains; removing those requirements and deprecating the domain require prior human approval.

Deprecated scopes have no current corpus file. Before deprecation, move surviving principles to accepted scopes while preserving IDs or retire them and remove their current headings; version history retains the former wording.

## Human intent

Manifests record required subdomains, priorities, exclusions, and scope notes. The manifest `description` field is the protected domain-purpose field; required scopes are protected as well.

An agent must not silently remove, deprecate, rename, merge, or materially rescope protected intent. It may identify problems and propose a reviewed change. Required scopes must not be deprecated while they remain required.

## Current provisional state

Existing domains and subdomains are preserved. Where research origin lacks an auditable review record, the taxonomy remains proposed. Do not invent retrospective research provenance. Coding is the first domain scheduled for independent review before pilot content.

## Admission test

A subdomain should have distinct decisions or behaviors, distinct evidence emphasis, enough durable content, a clear boundary, and meaningful value for humans or context retrieval. Do not create scopes for symmetry.

## Overlap

Overlap is permitted when context materially changes meaning, practices, goals, evidence, scope, or importance. Flat sibling domains remain acceptable. A centralized ontology is not required.

## Naming and codes

Directories and files use lowercase kebab-case. Domain and subdomain codes are stable taxonomy metadata. They do not determine principle identity.

Domain IDs and domain codes are unique repository-wide. Subdomain IDs and subdomain codes are unique within their containing domain; reuse across domains is allowed because the manifest provides the namespace.

Principles use repository-wide location-independent IDs governed by `config/content-policy.yaml`, `config/identity-policy.yaml`, and `config/identity-ledger.yaml`.

## Moving, splitting, and merging principles

- Moves preserve the principle ID.
- Splits allocate new IDs and record `derived_from` relationships.
- Merges preserve one surviving ID and record replaced IDs with `replaced_by` relationships.
- Retired IDs are never reused.

The ledger retains numerically ordered, contiguous all-time allocations; retirement never removes an allocation. Splits retire the original and relate at least two new children to it with `derived_from`; merges retire non-survivors and relate each to the survivor with `replaced_by`; moves create no relationship. Relationships use allocated endpoints and reject duplicates, self-relations, and cycles.

Trusted-base transitions are monotonic and preserve prior relationships; split children are new in that transition, while a merge survivor pre-exists and remains active. Without the baseline, transition validation is `not_evaluated`. `config/identity-ledger.yaml` and `config/identity-policy.yaml` are authoritative for exact executable invariants.

## Taxonomy review record

An accepted domain must have a concise `taxonomy-review.md` describing domain boundary, evidence families, important inclusions/exclusions, overlaps, protected intent, and unresolved ambiguity. Its manifest records the exact filename, review date, and at least one resolving stable source ID. Proposed domains keep all three review fields empty. Deprecated domains retain either a complete historical review or an entirely empty review; partial review metadata is invalid.

## Validation and approval

Deterministic validation checks schema, lifecycle combinations, review-state completeness and resolution, uniqueness at the defined scopes, required-scope presence/status, registration, and path agreement. Semantic evaluation judges boundary quality, distinctness, and duplication. Human approval accepts taxonomy and any protected-intent change; approval is a governance gate, not a manifest field that software pretends to prove.
