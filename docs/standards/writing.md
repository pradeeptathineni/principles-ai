# Writing Standard

## Goal

Write guidance that is useful to humans and structurally predictable for machines. The YAML preamble and GFM body should remain readable source, not configuration disguised as prose.

## Voice

Use plain English, concrete verbs, concise sentences, domain-standard terminology, calibrated recommendations, and explicit tradeoffs. Avoid corporate filler, motivational padding, empty intensifiers, artificial symmetry, and jargon that adds no precision.

## Titles and statements

Entry headings use an immutable location-independent ID:

```markdown
### PRN-000001 — Keep complexity proportional to the problem
```

The first paragraph expresses one central principle and includes citations. The title may be memorable; the paragraph carries precise scope and normative strength.

## Rationale and practices

Use separate `Why` paragraphs for distinct claims or evidence. Keep practice bullets independently actionable. Do not combine unrelated recommendations into one bullet merely to reduce list length.

Applicability uses separate cited paragraphs for distinct conditions, limits, and exceptions. Practices and Goals use flat unordered lists with one paragraph per item; nested lists and extra block children are outside the canonical grammar.

## Optional sections

Use `Applicability`, `Goals`, and `Tags` only when they add material value. Remove unused optional headings. Do not manufacture goals or tags to complete a shape.

Entry Tags are a flat list of normalized kebab-case retrieval concepts. Frontmatter tags apply to the whole file; do not duplicate them at entry level without a retrieval reason.

## Markdown hierarchy

- `#` file title.
- `## Principles`.
- `### PRN-...... — Principle title`.
- Required `#### Why` and `#### Practices`.
- Optional `#### Applicability`, `#### Goals`, and `#### Tags`, in that order.
- Final `## References` when citations exist.

Do not skip levels, add unknown or duplicate sections, or use raw HTML. Claim blocks forbid ordinary link titles. Exact block shapes, order, decoded-title equality, and document/path mappings are in `config/content-policy.yaml`.

## Citations

Use `[1]` for one source and comma-space-separated runs such as `[1], [2]`; never `[1][2]`. End every citation-required claim block with its run. Bibliographies include stable source IDs and follow `config/content-policy.yaml` and [Citations](citations.md).

## Frontmatter and Markdown

Corpus files consist of a YAML frontmatter preamble followed by a GitHub Flavored Markdown body. YAML frontmatter is a repository convention, not part of the GFM grammar. A future parser must process the preamble separately.

The executable policy pins the canonical body grammar to GFM 0.29-gfm. Parser-library upgrades must continue to pass the repository's AST contract fixtures rather than silently changing accepted syntax.

## Readability test

A reader should be able to scan titles, understand statements, learn the reasoning, act on practices, see conditions, pursue meaningful goals, and follow evidence without knowing repository internals.

## Parseability test

A parser should determine identity, structure, claim blocks, citations, source mappings, and optional sections from documented standard syntax without interpreting visual tricks.
