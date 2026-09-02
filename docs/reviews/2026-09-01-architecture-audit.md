# Architecture Audit and Corrected Tooling Implementation Plan

Date: 2026-09-01  
Status: Historical pre-implementation review; findings accepted and dispositioned on 2026-09-01  
Disposition: Accepted outcomes are canonical only where encoded in `docs/`, `config/`, templates, manifests, and workflows. See `docs/architecture.md` and `docs/workflows/bootstrap.md`.

## 1. Purpose

This document consolidates:

- the repository-wide architecture and context audit performed before tooling;
- the preliminary deterministic tooling review formerly stored in `tooling-plan.md`;
- current repository policy under `AGENTS.md`, `docs/`, `config/`, domain manifests, templates, workflows, tests, evals, and `.github/`;
- current first-party documentation relevant to Codex instruction discovery and AI-agent trust boundaries.

It supersedes `tooling-plan.md`. It is a review and implementation plan only. It does not authorize implementation or corpus generation.

## 2. Executive conclusion

The repository has a strong mission, a sound high-level separation between canonical and derived material, and unusually good evidence and source-selection principles. The intended boundary between human judgment, AI judgment, deterministic validation, and human governance is directionally correct.

The repository is not yet ready for tooling implementation because several foundational contracts are contradictory or incomplete. Building the parser and validators first would make those provisional choices expensive to change after corpus content exists.

The critical pre-tooling corrections are:

1. Correct the invalid adjacent multi-citation syntax.
2. Decouple immutable principle identity from mutable domain/file location.
3. Replace the custom schema DSL with executable schemas and define policy precedence.
4. Define structural claim units so citation-presence validation is honest and deterministic.
5. Add stable source identity and minimal claim/source review provenance.
6. Expand taxonomy manifests to preserve human priorities, exclusions, lifecycle, and approval state.
7. Treat current research-origin taxonomy as provisional until auditable review exists.
8. Add explicit trust boundaries for researched content, changed repository policy, link checking, CI, and dependencies.
9. Simplify the corpus grammar to avoid mandatory filler, especially goals and tags.
10. Separate deterministic validation, operational checks, semantic evaluation, and human approval.

Verdict: **NOT READY FOR TOOLING — ARCHITECTURE CONTRACT CHANGES REQUIRED.**

## 3. Current repository state

The read-only inspection found:

- 15 domain manifests.
- 274 registered subdomains.
- 268 subdomains marked with `origin: research`.
- 6 protected teaching subdomains marked with `origin: mixed`.
- 304 possible corpus files when the two universal files per domain are included.
- No canonical corpus Markdown files yet.
- `scripts/`, `tests/`, and `evals/` contain scaffolding only.
- No runtime, package manager configuration, parser, executable schema, validator, context builder, or CI workflow exists.
- `generated/taxonomy.yaml` does not exist.
- `MANIFEST.json` is an unexplained, manually maintained, dated file inventory.
- `domains/.DS_Store` is tracked.
- The worktree contains pre-existing changes in `docs/standards/ai-contributions.md` and `docs/standards/prompting.md`; future implementation must preserve them.

The absence of corpus content makes this the least expensive point at which to correct identity, provenance, schema, and taxonomy contracts.

## 4. Design that should remain

The following choices are strong and should be preserved:

### 4.1 Mission and governance

- The corpus is a curated, evidence-grounded source of guidance rather than an encyclopedia or popularity list.
- Humans define intent, priorities, acceptable judgment, and final governance.
- AI is a contributor and reviewer, not an authority.
- High-impact semantic and protected-intent changes remain pull-request and human-review decisions.

### 4.2 Canonical and derived separation

- Human-readable Markdown remains the canonical corpus presentation.
- Per-domain `domain.yaml` files remain canonical taxonomy state.
- Generated taxonomy, parsed representations, indexes, context packs, citation graphs, and reports remain derived.
- Derived artifacts must be reproducible and must not become independent sources of truth.

### 4.3 Research and evidence principles

- Research precedes synthesis.
- Search snippets, page titles, AI summaries, and remembered model knowledge are not evidence.
- Source fitness matters alongside authority.
- Citation entailment is distinct from citation presence.
- Credible disagreement, scope, conditions, and uncertainty must be preserved.
- The repository should not bulk-copy source content.

### 4.4 Interaction and automation boundary

- Natural language remains the primary interface for fuzzy intent and taxonomy judgment.
- Scripts enforce deterministic invariants and transformations.
- AI handles source fitness, synthesis, entailment, durability, and taxonomy judgment.
- Humans retain decisions involving values, protected intent, policy changes, principle removal, and unresolved material disagreement.
- Programmatic model orchestration, embeddings, and multi-agent automation are not required for bootstrap.

### 4.5 Context architecture

- A compact root `AGENTS.md` remains the repository entry point.
- Task-relevant documents should be loaded progressively rather than injecting the whole repository.
- Current Codex documentation supports layered `AGENTS.md` instruction discovery, but linked policy files are still a repository workflow obligation rather than automatically loaded context.

Reference: <https://developers.openai.com/codex/guides/agents-md>

## 5. Critical findings and corrected decisions

### 5.1 Citation syntax

#### Finding

The standards and templates use adjacent citations such as `[1][2]`. Under CommonMark/GFM this is one full reference link with visible text `1` and destination label `2`, not two citations.

Reference: <https://github.github.com/gfm/#reference-link>

#### Decision

- Use `[1]` for one citation.
- Use `[1], [2]` for multiple citations.
- Permit `[1] [2]` only if the style policy explicitly chooses it; comma separation is preferred for human clarity.
- Treat shortcut numeric reference links in claim-bearing blocks as citations.
- Treat `[Human-readable title][1]` in the visible bibliography as a full reference link, not a claim citation.
- Add parser contract tests proving these AST distinctions before implementing citation rules.

### 5.2 Immutable principle identity

#### Finding

The current entry ID embeds domain and file codes, while taxonomy workflows permit moves and request preservation of semantic identity. A move therefore either changes the ID or violates the prefix schema.

#### Decision

- Principle identity must be repository-wide and location-independent.
- Recommended canonical format: `PRN-000001` with a six-digit non-reusable sequence.
- The heading remains human-readable:

  ```markdown
  ### PRN-000001 — Delay abstraction until the pattern is understood
  ```

- Domain, subdomain, and file codes remain taxonomy/location metadata but are not part of the immutable principle ID.
- A canonical identity ledger records allocated and retired IDs so deleted IDs are never reused.
- Moves preserve the principle ID.
- Splits allocate new IDs and record `derived_from` relationships.
- Merges choose one surviving semantic identity and record replaced IDs as aliases or tombstones.
- Display order never determines identity or numbering.

The exact identifier prefix remains an acceptance decision, but location independence is mandatory before content exists.

### 5.3 Executable schema and policy precedence

#### Finding

`config/schema.yaml` is a repository-specific descriptive DSL, not an executable standard schema. `docs/` and `config/` repeat canonical policy without specifying precedence when they diverge.

#### Decision

- Convert `config/schema.yaml` into valid JSON Schema Draft 2020-12, authored in YAML if desired.
- Use executable schemas for local structural constraints: required fields, types, enums, patterns, conditional fields, and unknown-field handling.
- Implement cross-file constraints in deterministic code: uniqueness, directory agreement, taxonomy registration, protected-intent status, source-ID resolution, and ID non-reuse.
- `config/` is authoritative for executable syntax and enums.
- `docs/` is authoritative for semantic meaning, rationale, judgment, and workflow.
- Documentation must link to the executable rule rather than duplicate exact patterns or enum lists where avoidable.
- A drift test should ensure templates and fixtures validate against the current schema.
- Unknown fields should fail by default in canonical manifests and frontmatter unless the schema explicitly allows extension metadata.
- Schema versions require a changelog, compatibility rule, and migration path before version 2 is introduced.

### 5.4 Structural claim units and citation presence

#### Finding

The repository calls citation presence deterministic but does not define whether the unit is a section, paragraph, sentence, or bullet. “Externally grounded claim” itself requires semantic judgment.

#### Decision

Define the deterministic content grammar as follows:

- The first paragraph after an entry heading is the principle statement. Exactly one statement paragraph is required, and it must contain at least one resolved citation.
- Every non-empty paragraph under `#### Why` is a rationale claim block and must contain at least one resolved citation.
- Every top-level list item under `#### Practices` is a practice claim block and must contain at least one resolved citation.
- `#### Goals` items do not require citations when they are developmental objectives. A goal that contains a citation enters the evidence-review contract like any other cited claim.
- File introductions are editorial scope statements. They should not make substantive external claims. A semantic reviewer must flag introductions that evade the citation grammar.
- Citation presence proves only that a structural claim block includes resolved references. It does not prove completeness, entailment, authority, fitness, independence, or currency.
- Semantic evaluation remains responsible for splitting compound claims and identifying unsupported external assertions.

### 5.5 Corpus grammar

#### Finding

Every entry currently requires `Why`, `Practices`, `Goals`, and `Tags`, even when a section would be artificial. Entry-level goals also overlap with the dedicated `personal-growth.md` file.

#### Decision

Use one underlying grammar for all three file types:

```text
# File title
file introduction
## Principles
### PRN-...... — Title
statement paragraph
#### Why                    required; one or more paragraphs
#### Practices              required; one or more bullets
#### Applicability          optional; conditions, limits, exceptions
#### Goals                  optional; only meaningful development outcomes
#### Tags                   optional; controlled retrieval concepts
## References               required when the file contains citations
```

- `principles.md`, `personal-growth.md`, and ordinary subdomain files remain useful authoring presets.
- They must validate against one underlying schema and parser model.
- `personal-growth.md` differs in purpose and selection criteria, not in parser grammar.
- Do not require goals merely for symmetry.
- Do not require tags until tag normalization and governance are defined.
- Material conditions and exceptions may remain in `Why`; use `Applicability` only when separate retrieval materially helps.
- Frontmatter is a YAML preamble followed by a GFM body. The entire raw file should not be described as pure CommonMark/GFM.

### 5.6 Stable source identity and source reuse

#### Finding

Document-local numeric links are pleasant for readers but URLs are insufficient repository-wide source identities. Pages move, change in place, or appear at aliases. Source metadata is currently postponed even though freshness and re-verification depend on it.

#### Decision

- Add canonical source records before pilot corpus generation.
- Recommended structure: one YAML record per source under `sources/`, using stable IDs such as `SRC-000001`.
- Each record contains at minimum:
  - source ID;
  - title;
  - author/publisher;
  - source type;
  - descriptive authority class;
  - current canonical URL;
  - prior and alternate URLs;
  - publication/version date when available;
  - first retrieved date;
  - last substantive review date;
  - status: active, moved, superseded, withdrawn, or unavailable;
  - replacement/supersession relationship;
  - staleness-risk category or explicit review interval where useful.
- Authority class is not a universal scalar score. Source fitness remains claim-specific.
- Corpus files retain document-local numeric citations and direct human-clickable URLs.
- The visible bibliography maps the local label to a source ID using an explicit, parseable format:

  ```markdown
  1. [Google Engineering Practices — Code Review][1] — `SRC-000001`

  [1]: https://google.github.io/eng-practices/review/
  ```

- The validator ensures the visible title/URL agree with the canonical source record or an allowed URL alias.
- Updating a moved URL must not change source identity.

### 5.7 Minimal claim/source review provenance

#### Finding

Ephemeral evidence notes prevent later tools and reviewers from knowing what source section was checked, what version was seen, and whether wording changes invalidate a prior entailment review.

#### Decision

- Retain minimal verification records without storing bulk source text.
- Recommended structure: `evidence/claims/<entry-id>.yaml`.
- A review record identifies a structural claim by:
  - entry ID;
  - role such as `statement`, `why-1`, or `practice-2`;
  - SHA-256 hash of normalized claim text;
  - cited source IDs;
  - claim-specific locator such as section, page, heading, or fragment;
  - support result for the claim as a whole;
  - per-source support where useful;
  - review date;
  - reviewer type and evaluator configuration or human identity category;
  - optional short exact excerpt or excerpt hash when exact language matters.
- A claim-text hash mismatch invalidates the previous semantic review and requires re-review.
- Exact excerpts remain short and purpose-limited; full source copies are not stored by default.
- The pilot must test whether this provenance burden is proportionate before scaling it to every domain.

### 5.8 Human intent and taxonomy lifecycle

#### Finding

Natural-language workflows accept priorities, exclusions, scope constraints, and protected interests, but manifests preserve only `required_subdomains`. Current status values do not distinguish provisional research taxonomy, accepted taxonomy, or content publication.

#### Decision

Extend each domain manifest with a minimal human-intent and taxonomy-review contract:

```yaml
taxonomy_status: proposed | accepted | deprecated
human_intent:
  required_subdomains: []
  priorities: []
  exclusions: []
  scope_notes: []
taxonomy_review:
  reviewed_at: YYYY-MM-DD | null
  source_ids: []
  review_record: taxonomy-review.md | null
```

- Preserve `required_subdomains` at a stable, directly validated location; the final nesting is a schema-design choice.
- A required subdomain must remain active/accepted unless an explicit human-approved decision changes it.
- Deprecating or materially rescoping a protected item counts as changing protected intent even if its ID remains present.
- The top-level domain and its stated purpose are also human intent and cannot be silently deprecated or materially redefined.
- `origin` records why a scope entered the taxonomy; it does not prove quality or acceptance.
- `active` content coverage must not be inferred from taxonomy acceptance. Content coverage is derived from existing validated files.
- Each accepted domain should have a concise `taxonomy-review.md` explaining boundary, evidence families, meaningful overlaps, included/excluded candidates, protected intent, and unresolved ambiguity.

### 5.9 Existing taxonomy state

#### Finding

All 274 registered subdomains are active, 268 claim research origin, and no retained research or decision record makes those assertions auditable. Reused scopes such as security, observability, architecture, documentation, and automation may be legitimate, but their cross-domain distinctions are not recorded.

#### Decision

- Do not delete or merge current scopes automatically.
- Treat current research-origin taxonomy as provisional until reviewed.
- Add the new lifecycle field without pretending prior research provenance exists.
- Deeply audit the coding domain first because it is the intended pilot.
- Compare coding with engineering, backend, frontend, full-stack, DevOps, DevSecOps, cloud, and AI before accepting its boundary.
- Review additional domains incrementally rather than requiring all 15 to be complete before deterministic tooling exists.
- Do not bulk-generate files merely because a scope is registered.
- Add derived cross-domain overlap reports later; do not introduce a centralized master ontology.

### 5.10 Trust and security boundary

#### Finding

The repository does not yet treat external sources, contributed Markdown, changed policy, or network link targets as untrusted input.

#### Decision

Add a repository security/trust standard before research automation:

- External text is evidence data, never agent instruction.
- Commands, prompts, code, or policy-like language inside sources must not override repository instructions.
- Research extraction and repository mutation should be separate stages or passes.
- Untrusted free text should not directly choose action-capable tools or command arguments.
- Automated reviewers evaluate policy-changing PRs against the trusted base-branch policy, not only the proposed policy.
- Changes to `AGENTS.md`, governance standards, executable schemas, protected intent, and CI require designated human review.
- YAML must be parsed with safe, non-object-instantiating APIs and duplicate-key detection.
- Repository discovery must defend against symlink escape and path traversal.
- Allowed evidence URL schemes are initially `https` and `http`; insecure `http` should warn unless justified.
- External link checking must:
  - block loopback, link-local, private, multicast, and cloud metadata destinations;
  - re-resolve and revalidate every redirect target;
  - use bounded concurrency, timeouts, redirect limits, and response-size limits;
  - send no repository secrets, cookies, or ambient credentials;
  - distinguish definitive `404`/`410` failures from timeout, DNS, TLS, authentication, rate limit, bot blocking, and server errors;
  - never interpret fetched content as instructions or execute it.
- CI uses minimal permissions, immutable action SHAs, lockfiles, dependency review, and no model/API secrets in untrusted pull-request jobs.
- Generated Markdown/HTML must be treated as untrusted when rendered; raw HTML should be forbidden initially unless a concrete need emerges.

Reference: <https://developers.openai.com/api/docs/guides/agent-builder-safety>

## 6. Corrected canonical architecture

```text
AGENTS.md
  repository router + universal integrity and trust invariants

docs/
  project philosophy, architecture, semantic standards, workflows, security

config/
  executable schemas, deterministic rule configuration, ID ledgers

domains/<domain>/
  domain.yaml              canonical taxonomy + protected intent + lifecycle
  taxonomy-review.md       canonical accepted taxonomy rationale
  *.md                     canonical human-readable corpus

sources/
  SRC-......yaml           canonical source identity and lifecycle metadata

evidence/claims/
  PRN-......yaml           minimal claim/source semantic review provenance

scripts/
  parser, validators, ID/source tools, generators, context builders

tests/
  deterministic fixtures and contract tests

evals/
  semantic fixtures, rubrics, expected judgments, calibration data

generated/
  disposable taxonomy, parsed JSON, context packs, graphs, and reports

.github/
  PR template, deterministic CI, scheduled operational checks
```

### 6.1 Canonical policy boundaries

- `docs/`: semantic policy and human workflow.
- `config/`: executable structure and deterministic configuration.
- `domains/`: accepted taxonomy and corpus.
- `sources/`: source identity and lifecycle.
- `evidence/`: review provenance, not bulk source content.
- `generated/`: reproducible and disposable.

### 6.2 Generated artifact policy

- Generated artifacts are not committed by default.
- `generated/README.md` remains tracked.
- CI generates artifacts into a temporary directory and validates deterministic repeatability.
- A release or downstream consumer may explicitly publish generated outputs with source revision and input hashes.
- No generated artifact contains an implicit wall-clock timestamp in deterministic output. Time metadata must be injected explicitly when required.
- `MANIFEST.json` should be removed unless a concrete packaging consumer is defined; file discovery is deterministic and does not require a manual inventory.

## 7. Validation and governance model

### 7.1 Deterministic validation

Software can enforce:

- YAML/frontmatter parse validity and duplicate-key rejection.
- Executable schema validation.
- Required fields, enums, patterns, and unknown fields.
- Domain/directory/path/frontmatter agreement.
- Taxonomy registration and code uniqueness.
- Protected subdomain presence and accepted status.
- Principle and source ID format, uniqueness, allocation, and non-reuse.
- Heading hierarchy and section grammar.
- Required structural claim blocks.
- Citation presence in defined claim blocks.
- Numeric reference resolution and duplicate definitions.
- Visible bibliography/source-record agreement.
- Allowed URL syntax and schemes.
- Internal link resolution and repository-bound path safety.
- Template placeholders.
- Source-review due dates when calculated from explicit metadata and thresholds; diagnostics must say “review due,” not claim that the source is semantically stale.
- Claim hashes matching recorded review evidence.
- Deterministic serialization and generated-output reproducibility.

### 7.2 Operational checks

These are observable but time-dependent:

- External URL reachability.
- Redirect behavior.
- TLS/DNS/network availability.
- Source-page content hash changes.
- Scheduled freshness reports.

Operational checks must not be part of the ordinary deterministic `check` command unless explicitly requested.

### 7.3 Semantic evaluation

AI or human judgment evaluates:

- Citation entailment.
- Source authority and claim-specific fitness.
- Claim strength and scope calibration.
- Independence and triangulation.
- Principle importance, durability, distinctness, and actionability.
- Taxonomy fit and cross-domain duplication.
- Meaningful disagreement and omitted conditions.
- Whether a goal is a real developmental objective.
- Whether an introduction contains uncited substantive claims.
- Readability and usefulness.

Semantic checks produce evidence and verdicts, not deterministic proof.

### 7.4 Human approval

Humans must decide or approve:

- Protected human-intent changes.
- Material domain-boundary changes.
- Principle addition, removal, merge, or semantic rescoping.
- Resolution of credible value-laden disagreement.
- Changes to evidence, taxonomy, identity, or governance policy.
- Overrides of failed or uncertain semantic review.
- Whether provisional taxonomy becomes accepted.

### 7.5 CI policy

- Deterministic validation and tests block every pull request.
- Operational external-link checks run scheduled or manually and report indeterminate results separately.
- Semantic evals remain non-blocking reports until fixtures, evaluator configuration, and human calibration demonstrate acceptable reliability.
- High-impact changes require human review even after semantic evals become automated.
- CI must not display “semantic checks passed” merely because the evaluator process completed.

## 8. Tooling architecture after Phase 0

The preliminary plan’s single-CLI architecture remains appropriate after the contracts above are settled.

### 8.1 Runtime recommendation

- Use one local TypeScript/Node ESM CLI unless the Phase 0 spike identifies a material parser or ecosystem problem.
- Select the current supported Node LTS and current compatible library versions at implementation time.
- Commit exact dependency versions and integrity data in the lockfile.
- Do not encode transient package versions in durable architecture policy.
- Likely capabilities include:
  - GFM/CommonMark AST parsing with source positions;
  - a separate strict YAML/frontmatter parser;
  - JSON Schema Draft 2020-12 validation;
  - deterministic YAML/JSON serialization;
  - a small CLI dispatcher;
  - Node’s built-in test runner if it meets fixture and snapshot needs.
- Avoid an OpenAI SDK, database, daemon, web service, embeddings, generic Markdown linter, or model orchestration during deterministic bootstrap.

### 8.2 Layering

```text
Discovery
  stable repository file discovery and safe path resolution

Parsing
  YAML/frontmatter + GFM AST + source locations

Normalization
  repository-specific typed models independent of parser-library ASTs

Validation
  schema, taxonomy, identity, document, citation, source, evidence, links

Generation
  taxonomy, parsed data, context, reports

Presentation
  stable diagnostics, text/JSON output, exit codes
```

- Rules consume normalized models rather than reparsing files.
- Generators refuse structurally invalid canonical input.
- Parser ASTs are internal and not the stable CLI JSON contract.
- Diagnostics include stable code, severity, message, path, range, document ID, entry ID, and source ID where applicable.

### 8.3 CLI surface

The initial CLI should remain small:

```text
principles check
principles validate [paths...] [--format text|json]
principles parse <corpus-file> [--format json]
principles taxonomy build [--output <path>]
principles ids next --kind principle|source
principles links check [--external] [--format text|json]
principles context build --request <request.yaml> [--format markdown|json]
```

- `check` performs deterministic offline validation only.
- `links check --external` is explicitly network-dependent.
- Context building initially accepts explicit file and principle IDs.
- Semantic retrieval and “relevant practice” selection are deferred.

## 9. Parser and normalized-model contracts

### 9.1 Parser contract tests

Before repository validators, prove parser behavior for:

- YAML frontmatter extraction and duplicate keys.
- Source line, column, and offset retention.
- Shortcut numeric citation `[1]`.
- Correct separated multiple citations `[1], [2]`.
- Incorrect adjacent syntax `[1][2]` producing a full reference link and therefore failing citation-style validation.
- Full bibliography links `[Title][1]`.
- Duplicate and undefined definitions.
- Definitions inside and outside `## References`.
- Lists, nested list content, code spans, tables, autolinks, and raw HTML.
- Links inside code blocks not being treated as citations.
- Heading text and Unicode punctuation.

Use a narrow tokenizer-level supplement only if the main AST irreversibly loses information required for duplicate-definition or source-range diagnostics.

### 9.2 Normalized models

The internal model should represent at minimum:

```text
RepositoryModel
  domain manifests
  taxonomy review records
  corpus documents
  source records
  claim evidence records
  identity ledgers

CorpusDocument
  path, source hash, metadata, title, introduction
  entries, local references, source locations

PrincipleEntry
  immutable ID, title, statement
  rationale blocks, practices, optional applicability/goals/tags
  source range

ClaimBlock
  role, ordinal, normalized hash
  text, raw Markdown, citations, links, source range

ReferenceCatalog
  citation uses, definitions, visible bibliography entries
  local-label-to-source-ID mapping
```

Raw Markdown slices should be preserved where context generation must retain canonical wording.

## 10. Source, citation, and link tooling

### 10.1 Citation/reference validation

Deterministic checks should enforce:

- Numeric local citation labels.
- Separated multiple-citation syntax.
- Resolution of every citation use.
- Duplicate-definition errors.
- Visible bibliography entries and link definitions in one-to-one agreement.
- Source ID presence and resolution.
- Bibliography URL matching the source’s canonical URL or registered alias.
- `## References` as the final level-two section.
- Definitions after the visible bibliography.
- Unused definitions as warnings.
- First-use numbering differences as warnings, not semantic failures.

### 10.2 Internal links

- Parse all repository Markdown files, not only corpus files.
- Resolve relative links from the containing file.
- Reject paths that escape the repository.
- Validate same-file and cross-file fragments using documented GitHub-compatible slug rules.
- Report every source occurrence with a precise range.

### 10.3 External links

- Keep reachability outside ordinary deterministic validation.
- Deduplicate normalized fetch targets while preserving all source occurrences.
- Use bounded concurrency, timeout, response-size, and redirect limits.
- Prefer a bounded GET because many servers handle HEAD incorrectly.
- Classify `404` and `410` as definitive broken links.
- Classify DNS, TLS, timeout, authentication, `429`, `5xx`, and bot blocking as indeterminate or transient.
- Apply the network-safety controls from section 5.10.

## 11. Context builder

Initial context generation remains deterministic and explicit.

### 11.1 Initial profiles

- `minimal`: principle ID, title, statement, file identity, source IDs.
- `standard`: statement, all rationale, all practices, applicability, source IDs.
- `learning`: complete selected entries, goals, tags, and used references.
- `verification`: claim blocks plus source metadata and evidence-review records.

Do not ask deterministic code to select “essential” rationale or “relevant” practices. For a selected entry, include the complete blocks required by the profile.

### 11.2 Reproducibility

- Inputs use explicit file and principle IDs.
- Preserve request order and canonical entry order.
- Deduplicate by first occurrence.
- Namespace document-local numeric labels in combined Markdown output to avoid collisions.
- Record canonical file IDs, principle IDs, source IDs, input hashes, context profile, filters, and explicit source revision.
- Inject timestamps and repository revisions rather than reading them implicitly inside pure builders.

Semantic retrieval may later supplement explicit selection but must not silently omit known mandatory principles.

## 12. Evaluation plan

### 12.1 Deterministic fixture families

Include the bootstrap fixtures plus:

- adjacent multi-citation failure;
- valid separated citations;
- duplicate YAML key;
- unknown schema field;
- wrong directory/manifest ID;
- protected subdomain deprecated without approval;
- provisional versus accepted taxonomy;
- principle move preserving ID;
- retired ID reuse;
- source URL alias and supersession;
- missing source ID;
- claim hash changed after semantic review;
- bibliography/source-record mismatch;
- path traversal and symlink escape;
- external-link redirect to a private address;
- context citation-label collision;
- deterministic metadata injection;
- all three authoring presets validating against one grammar.

### 12.2 Semantic fixture families

- Unsupported generalization.
- Topic citation without entailment.
- Correct canonical requirement.
- Multi-source synthesis where each source is individually partial but the claim is jointly supported.
- Credible disagreement preserved conditionally.
- Vendor-specific guidance generalized incorrectly.
- Stale but durable source versus new but weak source.
- Thin or duplicative taxonomy candidate.
- Valid contextual duplication across domains.
- Goal disguised as a practice.
- Artificial goal/tag filler.
- Uncited factual claim in a file introduction.
- Malicious instructions embedded in a researched page.
- Automated proposal weakening evidence policy.
- Protected intent preserved textually but defeated by deprecation or rescoping.

### 12.3 Eval reproducibility and acceptance

- Version fixture, rubric, evaluator prompt, model/configuration, and expected result.
- Record failure category, not only pass/fail.
- Calibrate AI judgments against careful human review.
- Measure false positives and false negatives.
- Define whether `partial` support is acceptable only as part of jointly sufficient support or requires claim narrowing.
- Do not claim exact reproducibility for hosted-model judgments; require repeatable inputs, traceable configuration, and periodic human calibration.
- Prompt/model changes must run representative before/after evals and compare quality, token use, and failure distribution.

## 13. Sequenced implementation plan

No phase begins until the preceding phase’s acceptance gate is met.

### Phase 0 — Architecture contract checkpoint

Scope:

- Accept the corrected citation syntax.
- Accept a location-independent principle ID format.
- Accept stable source IDs and the bibliography mapping format.
- Accept the minimal evidence-review record.
- Accept the manifest lifecycle and human-intent model.
- Accept the simplified corpus grammar.
- Accept policy precedence and schema strategy.
- Accept trust/security requirements.
- Accept generated-artifact policy.

Repository changes after approval:

- Update architecture and standards.
- Add security/trust standard.
- Convert schema design.
- Update templates and workflows.
- Update manifest schema without inventing missing provenance.

Acceptance gate:

- No documented contradiction remains among identity, moves, citations, source identity, protected intent, and validation boundaries.
- No parser/runtime dependency has yet been required to define repository semantics.

### Phase 1 — Taxonomy state migration and pilot review

Scope:

- Add taxonomy lifecycle and human-intent fields.
- Preserve all current scopes.
- Mark unverified research-origin state provisional.
- Create and human-review the coding domain’s taxonomy review record.
- Identify important coding overlaps and exclusions.

Acceptance gate:

- Coding taxonomy is explicitly accepted for pilot use.
- Protected teaching intent remains present and active.
- No bulk domain audit or content generation occurs.

### Phase 2 — Runtime, schema, and diagnostic foundation

Scope:

- Select current supported runtime and libraries.
- Add package metadata, exact lockfile, compiler configuration, safe YAML handling, JSON Schema validation, repository discovery, diagnostic model, and CLI shell.
- Add dependency and CI security baselines.

Acceptance gate:

- Clean build succeeds.
- Malformed YAML, duplicate keys, schema failures, and unsafe paths produce stable ranged diagnostics.
- No network or AI call occurs.

### Phase 3 — Manifest, identity, source, and taxonomy tooling

Scope:

- Validate manifests, lifecycle, intent, codes, and cross-file uniqueness.
- Implement principle/source identity ledgers.
- Parse and validate source records.
- Build deterministic taxonomy output in memory or a temporary output directory.

Acceptance gate:

- All migrated manifests validate without falsely claiming accepted research provenance.
- Repeated taxonomy builds are byte-identical.
- Protected deprecation and ID reuse fixtures fail correctly.

### Phase 4 — Markdown parser and corpus structure

Scope:

- Implement YAML preamble plus GFM AST parsing.
- Normalize entries, claim blocks, optional sections, references, and source locations.
- Validate path/frontmatter/manifest agreement and one underlying grammar.

Acceptance gate:

- Parser contract suite passes, including `[1][2]` failure semantics.
- Three substituted authoring presets normalize to the same stable document model.

### Phase 5 — Citation, source, and evidence validation

Scope:

- Implement structural citation presence.
- Resolve bibliography entries, URLs, source IDs, and aliases.
- Validate claim review records and claim hashes.

Acceptance gate:

- Missing, undefined, duplicate, adjacent, mismatched, stale-review, and jointly-supported fixtures behave as specified.
- Diagnostics never imply entailment was proven deterministically.

### Phase 6 — Link checking and network safety

Scope:

- Implement deterministic internal links.
- Implement isolated external reachability with SSRF and resource protections.
- Test external behavior against a local controlled HTTP server.

Acceptance gate:

- Definitive broken links and indeterminate failures remain distinct.
- Redirect-to-private-network fixtures are blocked.
- Ordinary `check` remains offline.

### Phase 7 — Context builder

Scope:

- Implement explicit-ID selection and initial profiles.
- Namespace citations in combined output.
- Include source/evidence provenance and injected revision metadata.

Acceptance gate:

- Identical inputs and injected metadata produce identical bytes.
- Unknown IDs, ambiguous source mappings, and invalid input fail.
- No semantic retrieval is introduced.

### Phase 8 — Semantic eval harness skeleton

Scope:

- Add schemas for eval cases, versioned fixtures, rubrics, expected classifications, and human calibration records.
- Do not require a programmatic model API during the deterministic bootstrap if manual/interactive evaluation is sufficient.

Acceptance gate:

- Representative positive, negative, disagreement, security, taxonomy, and intent fixtures exist.
- The harness can compare expected and observed judgments without presenting model output as truth.

### Phase 9 — CI and repository cleanup

Scope:

- Add deterministic CI for build, tests, and offline checks.
- Add scheduled/manual external-link checks.
- Pin actions by immutable SHA and use minimal permissions.
- Remove `MANIFEST.json` unless a consumer has been established.
- Remove tracked `.DS_Store` and add appropriate ignore rules.
- Update READMEs and PR template with exact commands and governance gates.

Acceptance gate:

- A clean checkout passes installation, build, test, and deterministic check without network or AI access beyond dependency installation.
- Scheduled operational checks cannot access private network targets or secrets.

### Phase 10 — Pilot corpus, separately authorized

Scope after explicit approval:

- Research and create only:
  - `domains/coding/principles.md`;
  - `domains/coding/personal-growth.md`;
  - `domains/coding/design.md`.
- Create source records and claim review evidence with the pilot.
- Perform independent entailment, source-quality, taxonomy, duplication, readability, and human reviews.

Acceptance gate:

- Pilot files pass deterministic validation.
- Every cited claim has traceable source and review provenance.
- Human review finds the Markdown genuinely useful rather than mechanically compliant.
- The provenance burden and grammar remain practical.
- Pilot failures are fed back into architecture, schemas, tests, and evals before expansion.

## 14. Planned repository changes after approval

### Create

```text
.gitignore                         if not already present
package.json
package-lock.json
tsconfig.json

config/identity-ledger.yaml
docs/standards/security.md

sources/
evidence/claims/

scripts/principles.ts
scripts/lib/...                    bounded modules by responsibility

tests/...                          parser, rule, repository, CLI fixtures
evals/schema/...
evals/fixtures/...

.github/workflows/ci.yml
.github/workflows/links.yml
```

Exact module and fixture filenames should follow implementation seams discovered in Phases 2–5 rather than committing now to a long speculative file list.

### Modify

```text
AGENTS.md
README.md
docs/project.md
docs/architecture.md
docs/standards/content.md
docs/standards/research.md
docs/standards/sources.md
docs/standards/citations.md
docs/standards/writing.md
docs/standards/taxonomy.md
docs/standards/ai-contributions.md
docs/standards/context.md
docs/standards/evaluation.md
docs/workflows/bootstrap.md
docs/workflows/create-domain.md
docs/workflows/update-taxonomy.md
docs/workflows/create-content.md
docs/workflows/update-content.md
docs/workflows/review-content.md
config/schema.yaml
config/content-policy.yaml
config/source-policy.yaml
config/taxonomy-policy.yaml
config/validation.yaml
config/templates/*.md
domains/*/domain.yaml
scripts/README.md
tests/README.md
evals/README.md
generated/README.md
.github/pull_request_template.md
```

### Remove after approval and migration

```text
MANIFEST.json                      unless a real package consumer is defined
domains/.DS_Store
```

No canonical corpus file is created during Phases 0–9.

## 15. Deferred capabilities

The following are deliberately outside bootstrap:

- Embeddings and semantic search.
- Automatic cross-domain contradiction graphs.
- Automated taxonomy generation.
- Programmatic multi-agent orchestration.
- OpenAI SDK integration.
- Autonomous semantic PR approval.
- Dashboards and hosted services.
- Global ontology normalization.
- Automatic bibliographic merging beyond registered aliases.
- Automatic principle relationship inference.
- Bulk source archival.

These may be reconsidered only after the three-file pilot demonstrates a need.

## 16. Final pre-implementation checklist

Tooling implementation may begin only when all answers are “yes”:

- [ ] Is separated multi-citation syntax accepted and documented?
- [ ] Is principle identity independent of domain/file location?
- [ ] Is source identity stable across URL changes?
- [ ] Is the bibliography-to-source-ID grammar accepted?
- [ ] Are deterministic claim units explicit?
- [ ] Are mandatory versus optional entry sections explicit?
- [ ] Can a prior semantic review be invalidated when claim text changes?
- [ ] Are priorities, exclusions, protected status, and taxonomy lifecycle represented?
- [ ] Is current research-origin taxonomy honestly marked provisional where evidence is absent?
- [ ] Are executable schemas distinct from semantic policy?
- [ ] Is policy precedence defined?
- [ ] Are deterministic, operational, semantic, and human gates separated?
- [ ] Are external sources and proposed policy changes treated as untrusted input?
- [ ] Is external link checking protected against private-network access and unsafe redirects?
- [ ] Is generated-artifact commit policy explicit?
- [ ] Is the coding taxonomy accepted for the pilot?
- [ ] Has the maintainer explicitly authorized implementation after reviewing this checkpoint?

Until then, stop after planning and review.
