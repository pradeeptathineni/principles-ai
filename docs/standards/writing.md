# Writing Standard

## Goal

Write principles that are enjoyable for humans to learn from and predictable for machines to parse.

Structured Markdown should remain natural prose, not YAML disguised as a document.

## Voice

Use:

- Plain English.
- Concrete verbs.
- Concise sentences.
- Domain-standard terminology.
- Direct recommendations.
- Explicit tradeoffs.

Avoid:

- Corporate filler.
- Motivational padding.
- AI throat-clearing.
- Empty intensifiers such as `robust`, `comprehensive`, or `seamless` when they add no meaning.
- Unnecessary adjectives.
- Jargon when a simpler term is equally precise.
- Artificial symmetry that forces every section to have the same number of bullets.

## Principle titles

Titles should be memorable and action-oriented.

Prefer:

> Keep complexity proportional to the problem

over:

> Complexity considerations

The title may be concise; the paragraph beneath it carries the precise claim and citations.

## Principle statements

The first paragraph after an entry heading is the principle statement.

It should:

- Express one central idea.
- Be understandable without reading the rest of the entry.
- Use normative strength appropriate to the evidence.
- Include claim-level citations.
- Avoid unnecessary qualification while preserving material conditions.

## Rationale

`Why` explains reasoning rather than repeating the title.

Prefer separate paragraphs when distinct rationale claims require different evidence.

## Practices

Use bullet lists.

Each bullet should:

- Represent one actionable behavior.
- Be independently readable.
- Include its own citation when externally grounded.
- Avoid combining three unrelated actions with `and`.

## Goals

Use bullet lists.

Goals should describe capabilities, habits, or outcomes rather than implementation steps.

Prefer:

> Become faster at tracing unfamiliar execution paths.

over:

> Read GitHub for 30 minutes every Tuesday.

The latter may be a personal plan, not a durable domain goal.

## Tags

Entry-level tags use Markdown bullet lists:

```markdown
#### Tags

- abstraction
- simplicity
- maintainability
```

Do not use inline backticked tags. Backticks represent code spans, and a Markdown list is more semantically explicit.

File-level tags remain YAML lists in frontmatter.

## Markdown hierarchy

Use this hierarchy exactly for corpus files:

- `#` file title
- `## Principles`
- `### ID — Principle title`
- `#### Why`
- `#### Practices`
- `#### Goals`
- `#### Tags`
- `## References`

Do not skip heading levels.

Do not use HTML for ordinary content structure.

## Links

Use numeric reference-style links for evidence according to `citations.md`.

Normal inline links may be used for navigational links in introductions when they are not evidence citations.

## Tables

Use tables only when tabular comparison materially improves understanding.

Do not use tables for ordinary principle entries.

## Callouts

Use GitHub callouts sparingly and only for file-level notes that genuinely deserve emphasis. Do not make every principle a callout.

## Length

No global word count is imposed.

Prefer the shortest wording that preserves:

- Meaning.
- Evidence.
- Scope.
- Nuance.
- Actionability.

A long entry is justified only when the topic is genuinely nuanced.

## Human-readability test

A reader should be able to:

1. Scan titles and understand the file's major ideas.
2. Read only principle statements and get useful guidance.
3. Read `Why` to understand reasoning.
4. Read practices to act.
5. Read goals to grow.
6. Click directly from a claim to its evidence.

## Machine-readability test

A parser should be able to determine structure from standard Markdown syntax and documented heading order without interpreting typography tricks or prose conventions beyond the schema.

GitHub Flavored Markdown is a strict superset of CommonMark and provides predictable rendering on GitHub. YAML frontmatter is a widely used convention for Markdown metadata and is used with schema validation in GitHub's own documentation tooling. [1][2]

## References

1. [GitHub Flavored Markdown Specification][1]
2. [GitHub Docs — Using YAML frontmatter][2]
3. [CommonMark Specification][3]

[1]: https://github.github.com/gfm/
[2]: https://docs.github.com/en/contributing/writing-for-github-docs/using-yaml-frontmatter
[3]: https://spec.commonmark.org/
