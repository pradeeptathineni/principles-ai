# Project

## Mission

This project preserves and continuously improves the principles the maintainer wants to embody across the disciplines they practice.

It is an evidence-grounded system of curated guidance, not a generic list of best practices and not an objective declaration that evidence alone determines values. The corpus combines authoritative evidence, established practice, meaningful experience, explicit human priorities, explicit tradeoffs, and reviewed editorial judgment.

The project should help a reader answer:

- What matters most in this domain?
- Why does it matter?
- What should I do?
- Under what conditions or limitations does the guidance apply?
- How can I continue growing?
- What evidence supports the externally grounded claims?
- Where is the guidance disputed, contextual, uncertain, or changing?

## Primary outputs

Canonical corpus content is Markdown under `domains/`. Each domain owns a manifest describing taxonomy lifecycle and protected human intent. Stable source records live under `sources/`. Compact claim-review records may live under `evidence/`; they are required only for configured pilot paths and are optional elsewhere.

A domain may register proposed or accepted scopes before corresponding Markdown exists. Taxonomy acceptance and content coverage are separate concepts.

## Epistemic model

The repository distinguishes:

- Evidence-backed descriptive claims about consequences, requirements, behavior, or observed practice.
- Normative recommendations synthesized from evidence and judgment.
- Maintainer-adopted priorities and values.
- Developmental goals derived from surrounding guidance.

A citation can substantiate a claim; it cannot hide the editorial judgment involved in choosing or adopting a principle. The corpus should make scope, tradeoffs, and meaningful disagreement visible rather than presenting subjective synthesis as mechanically proven truth.

## Human intent

Human intent is first-class input and includes domain purpose, required subdomains, priorities, exclusions, and scope notes. An agent may challenge or recommend changes, but it must not silently remove, deprecate, rename, merge, or materially redefine protected intent.

Natural-language interaction remains the primary interface. Users should not need to author YAML or know internal identity formats.

## Audiences

### Humans

The raw Markdown should be pleasant to browse and useful without knowledge of parser internals.

### AI systems

The corpus should be structured enough to retrieve, parse, filter, validate, and inject selected principles without losing identity, scope, or provenance.

### Maintainers and reviewers

Changes should be reviewable as evidence-backed proposals. Reviewers should be able to see what changed, which intent is protected, which sources are involved, what was actually verified, and which judgments remain human decisions.

## Quality model

The repository optimizes for:

1. Truthfulness.
2. Source authority and claim-specific fitness.
3. Usefulness.
4. Durability.
5. Nuance and scope calibration.
6. Human readability.
7. Machine parseability.
8. Maintainability and re-verifiability.
9. Context efficiency.
10. Intent preservation.
11. Traceable identity and provenance.
12. Honest separation of deterministic proof, semantic judgment, and human approval.

## Stability gradient

| Content | Expected stability |
| --- | --- |
| Principle identity | Permanent |
| Principle wording | Slow-changing |
| Rationale | Slow to moderate |
| Practices | Moderate |
| Goals | Personal and evolving |
| Source URLs | Changeable without changing source identity |
| Source review status | Actively maintained |
| Research-added taxonomy | Provisional until accepted; deliberate thereafter |
| Explicit human taxonomy requirements | Protected until explicitly revised |

## Human and agent roles

Humans define purpose, personal priorities, acceptable judgment, taxonomy acceptance, and final governance. Agents may interpret intent, research, synthesize, challenge assumptions, validate, implement approved tooling, and propose changes.

Users describe desired outcomes rather than internal workflow sequences. Agents own prerequisite discovery and orchestration, including resuming the requested outcome after a human gate. A request authorizes ordinary prerequisite and draft work, including acceptance of an unchanged explicitly requested proposed registered target after independent fit research, but not additions, definition changes, deprecations, reactivations, protected intent, or other unseen high-impact judgments. Humans own the decision; agents may apply the resulting state transition mechanically.

Code enforces deterministic invariants. Operational checks observe changing external state. AI and humans evaluate semantics. Humans approve protected and high-impact decisions.

Permanent identity and source-move guarantees are transition invariants. Pull-request checks compare proposed state with trusted merge-base state; a snapshot without that baseline cannot prove all-time non-reuse or valid historical moves.

## Non-goals

This repository is not intended to:

- Catalog every fact, tool, framework, or technique.
- Treat popularity or citation count as proof.
- Pretend one universal answer exists when credible disagreement remains.
- Turn vendor guidance into universal doctrine.
- Replace primary documentation.
- Accumulate scraped source text.
- Optimize for file, principle, subdomain, tag, or citation count.
- Hide values or editorial judgment behind authoritative-looking citations.
- Freeze a forever-complete ontology.
- Require users to speak in schemas or CLI arguments.
- Depend on one transient AI interface, model, or product label.
- Add model orchestration, embeddings, databases, or services before demonstrated need.

## Repository-local context

Durable project knowledge belongs in versioned repository policy rather than chat history. `AGENTS.md` is a compact router; task prompts remain lean; exact executable constraints live in schemas and deterministic configuration.
