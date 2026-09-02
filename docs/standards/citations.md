# Citation Standard

## Purpose

Citations provide claim-level provenance. A citation is evidence, not decoration, and citation presence is not proof of support.

## Structural claim units

Citations are deterministically required for:

- The single principle statement paragraph.
- Every non-empty top-level paragraph under `Why`.
- Every top-level list item under `Practices`.
- Every top-level paragraph under `Applicability`.
- Any goal that makes an externally grounded claim.

Introductions are editorial scope statements and must not be used to evade these requirements.

## Syntax

Use document-local numeric CommonMark reference links.

One citation:

```markdown
A supported claim. [1]
```

Multiple citations:

```markdown
A claim synthesized from two sources. [1], [2]
```

Three or more citations repeat the same comma-and-space separator: `[1], [2], [3]`. Labels are positive decimal integers without leading zeroes and appear in ascending order within a run. A citation run cannot repeat a label and must be the final inline sequence in its claim block. Adjacent labels, other separators, and a citation run followed by uncited claim text are invalid.

Never use adjacent `[1][2]`. CommonMark/GFM parses adjacent labels as one full reference link rather than two citations.

Each cited structural claim block contains exactly one citation run, as its final inline sequence, covering the whole block. Numeric citation links elsewhere in the block are invalid. If a paragraph would need different citations for distinct claims or sentences, split it into separate claim-block paragraphs; split an over-broad Practice or Goal item into separate items.

Ordinary inline links remain available, but link titles are forbidden inside claim blocks. Link destinations are included in normalized claim text, so changing a destination invalidates retained claim review.

## Visible bibliography and stable source identity

Every cited local label must appear in a human-readable `## References` list and map to one canonical source ID:

```markdown
## References

1. [Google Engineering Practices — Code Review][1] — `SRC-000001`
2. [OWASP Developer Guide — Security Principles][2] — `SRC-000002`

[1]: https://google.github.io/eng-practices/review/
[2]: https://devguide.owasp.org/
```

Reference numbers are local to the file and normally follow first use. Source IDs are repository-wide and stable. Updating a URL or registering an alias does not change the source ID.

The bibliography is an exact mapping, not merely a presentation convention:

- `## References` is the final level-two section.
- It contains exactly one ordered list followed by the numeric reference definitions.
- Every used citation label has exactly one visible entry and one definition, and no unused entry or definition is allowed.
- Labels are contiguous from one; visible entries and definitions are ordered by label.
- The ordered-list number, full-reference-link label, and definition label agree.
- Each source ID appears at most once in a file and resolves to one allocated, non-retired source record.
- The bibliography link permits only text, character references, and backslash escapes; its decoded visible title exactly matches the single-line, control-free NFC source-record title by code point.
- The definition URL exactly matches that source's stored normalized canonical URL or one stored normalized alias.
- Definitions use the unbracketed destination form shown above and have no optional reference title.
- Duplicate definitions, duplicate entries, nonnumeric definitions, and ordinary reference definitions outside this catalog are invalid in corpus files. Inline links remain allowed.

Numbering by first use is recommended and produces a warning when violated, but it is not a validity requirement.

Source records are governed by `docs/standards/sources.md` and `config/schema.yaml#/$defs/source_record`.

## Entailment

A source must support the claim's meaning, scope, normative strength, and relevant conditions. A source about the general topic is insufficient.

When sources are individually partial but jointly sufficient, the claim-level review must record the combined judgment. Unsupported claims must be narrowed, re-sourced, or removed.

## Quotations

Quote sparingly, exactly, and briefly within a claim block whose terminal citation run supports the quotation. Never present reconstructed wording as a quotation.

## Validation boundary

Deterministic validation can establish citation presence, terminal-run grammar, label resolution, exact bibliography/source mapping, URL syntax, evidence coverage, and claim-review hash/source agreement.

Semantic evaluation determines entailment, authority, fitness, calibration, independence, currency, and whether unsupported claims were hidden outside structural claim blocks.

Human review remains required for high-impact semantic changes and evidence-policy changes.

## References

1. [GitHub Flavored Markdown Specification — Reference links][1]

[1]: https://github.github.com/gfm/#reference-link
