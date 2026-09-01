# Source Standard

## Principle

Use the strongest source that is fit for the specific claim.

Authority is contextual. A source can be definitive for one claim and weak for another.

## Authority classes

### A — Normative or primary authority

Examples:

- Standards bodies.
- Formal specifications.
- Government publications.
- Regulatory requirements.
- Original peer-reviewed research for empirical claims.
- Official language or protocol specifications.

Use when the claim concerns a standard, formal requirement, definition, or primary evidence.

### B — Canonical first-party guidance

Examples:

- Official vendor documentation.
- Official framework documentation.
- Maintainer documentation.
- Product architecture and security guidance.

For product-specific behavior, this may be the strongest available authority.

### C — Mature institutional practice

Examples:

- Published engineering practices from mature organizations.
- CNCF or foundation guidance that is not itself normative.
- Established professional bodies.
- Long-running institutional engineering handbooks.

Useful when a domain has no formal standard for the judgment being synthesized.

### D — Established expert or academic secondary source

Examples:

- Seminal engineering books.
- Recognized subject-matter experts.
- University materials.
- High-quality review papers.
- Conference material from established practitioners.

Use to strengthen conceptual guidance, historical context, or areas where formal authorities are limited.

### E — Community or ecosystem evidence

Examples:

- roadmap.sh.
- High-quality tutorials.
- Community surveys.
- Widely used open-source repositories.
- Stack Overflow or Reddit discussions.
- Practitioner blog posts.

Useful for:

- Learning paths.
- Adoption patterns.
- Developer experience.
- Ecosystem conventions.
- Discovering candidate ideas or stronger sources.

Do not use popularity alone to establish a universal principle.

## Source-fitness dimensions

Evaluate each source on:

### Authority

Who is making the claim and why are they credible for this topic?

### Directness

Is this the original source or a summary of another source?

### Relevance

Does the source address the exact claim or only the general topic?

### Normativity

Is the source defining a requirement, documenting behavior, making a recommendation, reporting evidence, or offering opinion?

### Evidence

What supports the source's claim: formal standard, data, research, operational experience, consensus, or assertion?

### Currency

Is the source current enough for the topic's staleness risk?

### Stability

Is the guidance likely to remain valid or is it tied to a transient implementation?

### Independence

Do apparently multiple sources ultimately repeat one original source?

### Applicability

How broadly does the claim apply and under what conditions?

## Source-selection order

Prefer this sequence unless the topic justifies a different order:

1. Relevant Class A sources.
2. Relevant Class B sources.
3. Relevant Class C sources.
4. Strong Class D sources.
5. Class E for supplementation, ecosystem reality, and discovery.

Do not add lower-class sources when stronger sources already establish the same claim unless the additional source adds independent evidence or useful context.

## Triangulation

### Broad synthesized principles

Prefer support from at least two independent strong sources when the principle is a broad synthesis rather than a canonical requirement.

This is a preference, not a mechanical citation quota.

### Canonical facts and requirements

One authoritative canonical source can be sufficient for:

- A standard's explicit requirement.
- A documented product behavior.
- A protocol definition.
- A specific vendor feature or constraint.

Do not cite three weaker secondary sources to imitate confidence when one primary source is definitive.

## Contextual authority examples

- W3C is stronger than a framework blog for normative web-accessibility requirements.
- AWS documentation is stronger than a generic cloud blog for AWS IAM behavior.
- AWS documentation alone should not define universal cloud philosophy.
- A language specification is stronger than a tutorial for syntax or semantics.
- roadmap.sh can be excellent evidence for personal-growth coverage but is not a standards body for software correctness.

## Source rejection criteria

Reject or strongly de-prioritize sources that are:

- Unverifiable.
- AI-generated with unclear provenance.
- Content farms or SEO aggregators.
- Mere reposts of stronger sources.
- Stale for a high-change topic.
- Anonymous opinion presented as fact.
- Vague enough that they do not support the exact claim.
- Marketing copy used to establish a broad technical truth.
- Search snippets used without opening the source.

## Conflicts

When sources conflict, do not resolve conflict by authority rank alone.

Investigate:

- Scope.
- Date/version.
- Intended audience.
- Normative versus advisory status.
- Evidence quality.
- Whether the disagreement is real or contextual.

Represent unresolved material disagreement in the rationale or narrow the principle.

## Source metadata

Tooling should eventually track at minimum:

- Canonical URL.
- Title.
- Publisher/author.
- Authority class.
- Retrieved or reviewed date.
- Published/version date when available.
- Source type.
- Normalized domain.
- Status: active, moved, superseded, unavailable.
