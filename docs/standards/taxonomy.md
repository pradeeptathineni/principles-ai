# Taxonomy Standard

## Purpose and authority

Taxonomy provides useful entry points into practice; it is neither a perfect ontology nor a mandate to create a file for every topic.

`config/taxonomy-policy.yaml` owns executable universal rules. Each `domains/<domain>/domain.yaml` owns local lifecycle, scope definitions, and protected intent. Repository-wide aggregates are derived and disposable.

## Lifecycle and content

- `proposed`: a preserved candidate whose acceptance is genuinely unresolved.
- `accepted`: an active reviewed scope.
- `deprecated`: retained inactive history.

Origin explains how a scope entered the taxonomy; it proves neither evidence, quality, nor acceptance. File coverage is derived independently from lifecycle.

An accepted domain has every required subdomain accepted and may retain other proposed/deprecated candidates; accepted subdomains require an accepted parent. A deprecated domain has only deprecated subdomains and no required scopes, after explicit approval to remove requirements and deprecate it.

Domain acceptance approves its boundary and purpose, its required scopes, and only other candidates included in the decision. It does not bulk-accept every registered subdomain. Universal content requires an accepted domain; subdomain content requires that exact accepted scope.

An explicit request for an existing proposed registered target authorizes acceptance of its unchanged definition after independent fit research. Additions, definition changes, deprecations, reactivations, and protected-intent changes require exact human decisions. Rename, reframe, replace, split, and merge compose those transition classes rather than bypassing them.

A stable negative decision must not remain `proposed`. Deprecate it with human approval and keep rationale in version history, the pull request, or the issue. Deprecated scopes have no current corpus file. Before deprecation, move surviving principles to accepted scopes with IDs preserved or retire them and remove their headings; a proposal with no content needs no migration.

## Protected intent and definitions

Protected intent comprises the domain `description` (purpose), required subdomains and their definitions, priorities, exclusions, and scope notes. An agent may challenge it but may not silently remove, deprecate, rename, merge, or materially rescope it. Required scopes cannot be deprecated while still required.

Every subdomain has a canonical `description`; title is display text, while ID/code are stable metadata. A sufficient definition communicates the semantic center and, where useful, inclusions/exclusions, neighboring distinctions, intentional overlap, and domain-specific interpretation. It need not use a fixed checklist, but a title-substitution formula is insufficient. A title-only change is a rename; a material description change is a reframe and requires review even if ID/title stay fixed.

Registered and inherited taxonomy is current-state context, not admission evidence. Independently read the evidence landscape and assess source fitness, stronger alternatives, disagreement, durability, neighboring ownership, and existing corpus placement under [Research](research.md) and [Sources](sources.md).

## Admission, boundaries, and overlap

A subdomain needs materially distinct decisions or behaviors, a distinct evidence emphasis, sufficient durable content, a clear boundary, and useful human or retrieval value. Do not add scopes for symmetry.

Persistent duplication without distinct practice/evidence, absorption by a clearer scope, insufficient durable actionable content, lost retrieval value, obsolescence, or departure from domain purpose can justify deprecation. Temporary thinness, incomplete research, or ordinary topical overlap cannot. Evaluate each scope explicitly and preserve protected intent and surviving principles.

Overlap is valid when context materially changes meaning, rationale, decision, practice, applicability, goals, importance, evidence, or provenance. A universal principle may recur in a subdomain that materially develops it; cross-domain recurrence may retain separate identities and later be grouped as a derived theme. Similar wording does not prove duplication, and different wording does not prove distinctness.

Consolidate accidental same-scope duplicates. Sibling scopes need clear ownership; substantially identical guidance with no contextual development supports narrowing, merge, or deprecation. Across domains, preserve recurrence unless it adds no domain-specific information. Flat sibling domains remain valid; no centralized ontology or universal singleton principle is required.

## Operations

Stable taxonomy IDs are never silently repurposed.

- **Add:** prepare the exact definition as proposed; after exact approval, a final trusted diff may contain it accepted without a ceremonial proposed-only merge.
- **Accept:** move a reviewed proposal to accepted. This is agent-authorized only for an explicitly requested unchanged registered target after independent fit research; otherwise it is a human gate.
- **Rename:** preserve ID and description; a boundary change is a reframe.
- **Reframe:** preserve ID only while semantic identity remains and review the changed description.
- **Deprecate:** retain ID as deprecated after content migration and approval.
- **Reactivate:** move deprecated directly to accepted after approval, never back to proposed.
- **Replace:** deprecate the old ID and add a new proposed replacement.
- **Split:** deprecate the original and add at least two proposed children.
- **Merge:** preserve a suitable accepted survivor and deprecate absorbed scopes, or add a new proposal if no identity survives.

Trusted-baseline validation may receive explicit unchanged-target authorization and classify that transition accordingly, but the flag proves neither fit nor approval. It may also first observe an approved new scope as accepted while still reporting `taxonomy-addition`; a separate intermediate merge would add no judgment.

## Names and principle identity

Directories/files use lowercase kebab-case. Domain IDs/codes are repository-wide unique; subdomain IDs/codes are unique within a domain. Codes are taxonomy metadata, not principle identity.

Principle IDs are repository-wide and location-independent:

- Moves preserve IDs and create no relationship.
- Splits retire the original, allocate at least two children, and record `derived_from`.
- Merges preserve one survivor and record each retired ID with `replaced_by`.
- Retired IDs are never reused.

The ledger retains contiguous all-time allocations and prior relationships. Relationships require allocated endpoints and are directed, unique, non-self, and acyclic. Trusted-base transitions are monotonic; split children are new, while a merge survivor pre-exists and remains active. Without a trusted baseline, transition validity is `not_evaluated`. `config/identity-policy.yaml` and `config/identity-ledger.yaml` own exact rules.

## Review and approval boundaries

Deterministic validation checks schema, lifecycle combinations, uniqueness, registration, required-scope state, path agreement, definitions, identity, and trusted transitions. Semantic review judges independent research, source fitness, boundaries, distinctness, overlap, placement, and duplication. Humans decide additions, definition changes, deprecations, reactivations, protected intent, and acceptance without explicit unchanged-target authorization. Lifecycle records the outcome; software proves neither semantic fitness nor approval.
