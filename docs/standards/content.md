# Content Standard

## Scope

This standard defines what belongs in the corpus and what each content type means. `config/schema.yaml` and `config/content-policy.yaml` own executable structure.

## Content semantics

- **Principle:** a durable normative statement that guides judgment or behavior in a defined scope. It must be important, useful, evidence-calibrated, distinct, and durable beyond ordinary tool churn—not a fact, feature, slogan, preference, or tutorial step.
- **Why:** cited rationale about consequences, evidence, tradeoffs, requirements, failure modes, conditions, or disagreement. Each top-level paragraph is one claim block and must add reasoning rather than restate the principle.
- **Practice:** a cited concrete behavior or decision pattern. Each top-level item is one claim block; a product/tool name alone is not a practice.
- **Applicability:** optional cited conditions, limits, or exceptions that materially change correct use. Consider scale, risk, maturity, architecture, regulation, operating model, workload, lifecycle, reversibility, statefulness, and human burden without treating them as a checklist. Omit it when the statement or rationale already carries the qualification.
- **Goal:** an optional developmental capability, habit, or outcome. Editorial goals need no citation; externally grounded claims do. Goals are not required for symmetry or mechanical repetition across personal-growth files.
- **Tag:** an optional normalized retrieval concept. File tags describe the document and entry tags describe one principle. Until a controlled vocabulary is justified, prefer a few valuable tags and do not repeat path metadata without a retrieval reason.

`principles.md` contains selective highest-order domain guidance; `personal-growth.md` concerns developing capability, judgment, fluency, and currency; a subdomain file contains scope-specific guidance. Their selection criteria differ, but all share one grammar.

## Grammar and lifecycle

Each entry has a `### PRN-...... — Title` heading, one cited statement, required Why and Practices sections, and optional Applicability, Goals, and Tags in policy order. Claim blocks are top-level paragraphs or flat one-paragraph list items as configured. Each document has one title, one editorial introduction, one `## Principles` section, and final `## References`. The grammar is closed; raw HTML, unknown/duplicate sections, and unsupported block forms are invalid. Required lower bounds make a file parseable, not complete.

Corpus Markdown lives directly under `domains/<domain>/`. Directory, filename, frontmatter ID/type/subdomain, and decoded titles agree exactly. Universal files use the `principles` and `personal-growth` presets; subdomain files require a matching accepted registration. `config/content-policy.yaml` owns exact AST shapes, inline restrictions, ordering, and projections.

The introduction is editorial scope. It cannot hide substantive uncited claims outside the claim grammar.

Content state is `draft` or `active`; absence is pre-creation and taxonomy/identity history represents retirement. Draft is agent-owned working content under accepted taxonomy with null review metadata. Active content carries its review date and exact reviewed semantic hash. Activation readiness is derived, not stored.

Deterministic validity and publishable evidence outcomes are necessary but do not prove semantic adequacy or approval. New or materially changed principle meaning requires human activation; proposed substantive edits return to draft. Formatting-only edits and source URL moves that preserve identity may remain active when the semantic hash is unchanged.

## Discovery and selection

Research precedes final prose. Selection has four distinct stages:

1. discover a broad set of materially different candidate themes from the evidence landscape;
2. test coverage of the major subject-specific dimensions revealed by strong evidence;
3. compare candidates and consolidate only genuine redundancy; and
4. select every candidate that clears the inclusion bar.

For a substantive scope that supports such breadth, approximately ten plausible themes is a defeasible exploration prompt. It is not a minimum candidate count or a target for the published file. A narrow subject may yield fewer after adequate research; do not invent weak, redundant, practice-level, temporary, misplaced, or unimportant candidates. Repeated one- or two-principle results across broad scopes are a signal to recheck discovery and coverage, not a requirement to add entries.

Judge candidates by importance to excellent practice, durability, distinctness, evidence quality and fitness, practical consequence, human usefulness, appropriate placement, actionability, and survival under simpler wording. Select all that meaningfully pass and target no final count. A large set is not inherently better, and a small set is not inherently deficient.

Working candidate analysis remains lightweight unless durable provenance has a use. Canonical files contain selected principles, not rejection inventories, but the author should be able to explain major themes, dimensions, and consequential inclusion, consolidation, rejection, or placement decisions.

No template, example, workflow, prior file, or neighboring domain establishes preferred counts for principles, Why paragraphs, Practices, Goals, Tags, sources, citations, or optional sections. Structure follows the subject and evidence; do not introduce cosmetic variation.

## Duplication and recurrence

Do not optimize the corpus for textual or conceptual DRYness.

- Consolidate accidental semantic duplicates within one scope and sibling duplication that adds no materially different decision, practice, applicability, evidence, or ownership.
- Preserve recurrence between universal and subdomain guidance when the subdomain materially develops the higher-order idea.
- Preserve cross-domain recurrence when context changes interpretation, rationale, practice, applicability, importance, evidence, or provenance.
- Similar wording can express different meaning; different wording can conceal a true duplicate.
- Derived analysis may group recurring higher-order themes without erasing domain-authored records or identity.

## Calibration and economy

Use `must` only for genuine requirements, `should` for strong recommendations, `prefer` for contextual defaults, and `consider` for conditional techniques. Never exceed the evidence's strength.

Say everything necessary and useful, but nothing merely because the format permits it. Advisory length warnings expose possible word-economy issues, not desired sizes or hard caps; safety, precision, and material qualification prevail.
