# Citation Standard

## Purpose

Citations provide claim-level provenance.

A citation is evidence, not decoration.

## Required citation scope

Every externally grounded:

- Principle statement.
- Substantive rationale claim.
- Recommended practice.

must include one or more citations that substantively support that claim.

Goals may remain uncited when they represent developmental objectives reasonably derived from the surrounding evidence.

## Claim-level placement

Place the citation at the end of the sentence or bullet it supports.

Preferred:

```markdown
Small, focused changes are generally easier to review thoroughly. [1]
```

Preferred:

```markdown
- Keep unrelated refactoring separate when doing so improves reviewability. [1][2]
```

Avoid a pile of references under a principle with no indication of which source supports which claim.

## Local numeric reference labels

Use document-local numeric CommonMark reference links:

```markdown
A supported claim. [1]

Another supported claim. [1][2]

[1]: https://example.com/source-one
[2]: https://example.com/source-two
```

Reference numbers are local to the file and normally assigned in first-use order.

Do not synchronize numbers across files.

CommonMark defines reference-style links separately from their link definitions, allowing the same reference to be reused without repeating the URL. [1]

## Visible reference section

Every corpus file ends with a human-readable `## References` section followed by the link definitions.

Example:

```markdown
## References

1. [Google Engineering Practices — Code Review][1]
2. [OWASP Developer Guide — Security Principles][2]

[1]: https://google.github.io/eng-practices/review/
[2]: https://devguide.owasp.org/
```

Optional one-sentence annotations may be added when they materially help a learner understand why a source matters.

Do not turn the reference section into another essay.

## Entailment

A reference must support the claim's:

- Meaning.
- Scope.
- Normative strength.
- Relevant conditions.

A source about a general topic is not sufficient if it does not support the actual sentence.

Bad:

```markdown
Microservices always reduce operational complexity. [1]
```

when `[1]` merely discusses microservices.

## Multiple sources

Use multiple citations when:

- A principle is synthesized across independent authorities.
- Different parts of the claim come from different evidence.
- A second source adds material independent support.
- The first source is credible but not sufficient by itself.

Do not add citations merely to create the appearance of consensus.

## Source descriptions

The visible source title should identify the source clearly enough for a human reader.

Prefer:

```markdown
1. [Google Engineering Practices — Code Review][1]
```

over:

```markdown
1. [Source][1]
```

## Quotations

Use direct quotations sparingly.

When quoting:

- Copy the wording exactly.
- Keep the quotation short.
- Cite the source immediately.
- Do not reconstruct remembered wording and present it as a quotation.
- Prefer paraphrase when exact wording is not essential.

## Citation validation

Tooling should validate:

### Deterministically

- Every numeric citation label resolves.
- Every link definition is used or intentionally retained.
- No duplicate label definitions exist.
- Required claim types contain citations.
- Reference URLs are syntactically valid.
- References section and link definitions agree.

### Semantically

- Source supports the claim.
- Claim is not stronger than the evidence.
- Source is fit for the claim.
- Source is not obviously superseded when currency matters.

Semantic validation may require an AI evaluator or human review and should not be represented as deterministic proof.

## Machine representation

A parser should be able to emit:

```json
{
  "claim": "Small, focused changes are generally easier to review thoroughly.",
  "references": [
    {
      "label": 1,
      "url": "https://example.com/source"
    }
  ]
}
```

The Markdown remains canonical.

## References

1. [CommonMark Specification][1]
2. [GitHub Flavored Markdown Specification][2]

[1]: https://spec.commonmark.org/
[2]: https://github.github.com/gfm/
