# Research Standard

## Core rule

Research precedes synthesis.

Do not generate a desired conclusion first and then search for citations that appear to support it.

## Required workflow

### 1. Establish scope

Define:

- Domain.
- Subdomain.
- What belongs in the target file.
- Neighboring files that should own adjacent concerns.
- Whether the topic is primarily normative, technical, empirical, pedagogical, experiential, or mixed.
- Staleness risk.

### 2. Map authoritative source families

Before broad searching, identify likely source classes for the topic.

Examples:

- Standards bodies and specifications.
- Government or regulatory guidance.
- First-party product documentation.
- Maintainer documentation.
- Original research.
- Mature institutional engineering guidance.
- Established books or expert works.
- Community and ecosystem evidence.

### 3. Discover candidate sources

Search top-down according to `sources.md` and `config/source-policy.yaml`.

Do not treat search-engine snippets, AI summaries, page titles, or remembered model knowledge as evidence.

### 4. Read the source

Open the relevant source and inspect the exact language in the relevant section.

Use exact language to determine:

- What the source actually claims.
- Scope and prerequisites.
- Normative strength.
- Exceptions.
- Version or date.
- Whether the source is current.
- Whether the claim is the source's own guidance or a quotation from elsewhere.

### 5. Extract evidence

Capture the minimum evidence needed to support research decisions.

Working evidence should track:

- Source URL.
- Source title.
- Publisher/author.
- Relevant section.
- Exact or near-exact short excerpt where necessary for verification.
- Candidate concepts supported.
- Authority class.
- Source fitness.
- Version/date when applicable.

Evidence notes are working artifacts. Do not bulk-copy source material into the public corpus.

### 6. Build a coverage map

Identify recurring concepts across the research set.

For each concept, consider:

- Importance.
- Number and independence of supporting sources.
- Strength of agreement.
- Conflicting guidance.
- Scope.
- Durability.
- Whether it already belongs elsewhere in the taxonomy.

The purpose is to discover the strongest themes from evidence rather than filling a preconceived outline.

### 7. Analyze disagreement

When credible sources differ:

- Determine whether they address different contexts.
- Determine whether one is normative and another advisory.
- Determine whether versions or dates explain the difference.
- Preserve meaningful disagreement when it cannot be honestly resolved.
- Prefer a conditional principle over a false universal.

### 8. Synthesize candidate principles

Write candidate principles only after evidence analysis.

A synthesis may combine multiple sources. The final wording does not need to copy any source verbatim, but its meaning must remain within what the cited evidence can support.

### 9. Derive practices

Derive concrete behaviors from the principle and evidence.

Practices require the same evidentiary discipline as principle statements unless they are clearly repository-specific implementation rules.

### 10. Derive goals

Ask what capability, habit, or judgment a person should develop to embody the principle.

Goals may be reasonable deductions and are not required to be externally prescribed.

### 11. Verify entailment

For every cited claim, reopen or retrieve the cited evidence and ask:

> Does this source substantively support this exact claim at this level of strength and scope?

Classify support at minimum as:

- `strong`
- `partial`
- `unsupported`

Do not publish an `unsupported` claim. Narrow, rewrite, source more strongly, or remove it.

### 12. Perform adversarial review

Challenge the draft:

- Is any claim overstated?
- Is a recommendation context-dependent?
- Is this merely a current technique disguised as a principle?
- Is there a stronger primary source?
- Is a vendor-specific practice being generalized?
- Is important disagreement missing?
- Are two principles duplicates?
- Does the source actually support the cited sentence?
- Is any goal pretending to be externally mandated?
- Has old but durable guidance been rejected merely because of age?
- Has new but weak guidance been preferred merely because it is recent?

### 13. Write and validate

Only after research and verification should the canonical Markdown be finalized.

Run all applicable deterministic validation and AI evals.

## Exact language versus final prose

Agents should inspect exact source language during research because paraphrase from memory can distort scope and meaning.

Final corpus prose should normally synthesize rather than quote.

Use a short direct quotation only when exact wording materially matters, such as:

- Formal definitions.
- Normative `MUST`/`SHOULD` requirements.
- A concise formulation whose wording is itself important.

Never use quotation marks around reconstructed or approximate wording.

## Research stopping criteria

Stop expanding research when:

- Central themes are well covered by fit sources.
- Additional searches mostly repeat already understood evidence.
- Material disagreements have been investigated.
- Major source classes appropriate to the topic have been checked.
- The candidate principles meet the selection bar.

Do not continue collecting sources merely to increase citation count.

## Freshness

Freshness requirements depend on staleness risk.

High-staleness domains such as AI tooling, cloud services, security advisories, frameworks, and vendor APIs require current verification.

Low-staleness ideas such as systems thinking or enduring software-design concepts may legitimately rely on older foundational sources.

Evaluate staleness, not age alone.
