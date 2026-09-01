# Evaluation Standard

## Purpose

Agent behavior must be evaluated, not assumed.

Prompt length, model capability, citation count, and polished prose are not substitutes for measured quality.

## Evaluation layers

### Deterministic validation

Test properties that software can determine exactly:

- YAML validity.
- Required frontmatter fields.
- Taxonomy membership.
- Heading hierarchy.
- Stable ID format and uniqueness.
- Required sections.
- Reference-label resolution.
- URL syntax.
- Required citation presence.
- No leftover template placeholders.

### Semantic evaluation

Use curated fixtures, AI evaluators, and human review for properties that require judgment:

- Citation entailment.
- Source authority.
- Source fitness.
- Claim calibration.
- Principle durability.
- Duplicate meaning.
- Misplaced taxonomy.
- Missing nuance.
- Human readability.

## Core metrics

### Citation presence

Percentage of externally grounded required claims containing references.

Target for canonical content: 100%.

### Citation entailment

Percentage of cited claims judged strongly or adequately supported by the cited source.

Unsupported citations are failures, not minor defects.

### Source-quality fitness

Measures whether the chosen source is appropriately authoritative and direct for the claim.

### Unsupported-claim rate

Externally grounded claims lacking sufficient evidence.

Target: 0%.

### Principle distinctness

Detect principles that are semantic duplicates within a file or should be merged.

### Scope calibration

Detect claims that are broader or more absolute than their evidence.

### Taxonomy fit

Detect content that belongs in a neighboring domain or subdomain.

### Human readability

Human reviewers should be able to understand the principle, reasoning, practices, and evidence without parsing machine metadata.

### Context efficiency

Generated AI context should contain the smallest relevant set of principles needed for a downstream task without stripping necessary rationale or provenance.

## Eval fixtures

Maintain representative positive and negative cases.

Examples:

### Unsupported generalization

Source:

> Documentation discusses microservices tradeoffs.

Candidate:

> Microservices always reduce operational complexity.

Expected: `unsupported / overbroad`

### Canonical requirement

Source:

> Current normative standard explicitly states requirement X.

Candidate accurately paraphrases requirement X at the same scope.

Expected: `strong support`

### Topic citation without entailment

Source is about code review generally.

Candidate makes a specific claim not present or implied in the source.

Expected: `unsupported`

### Nuanced synthesis

Two credible sources favor different approaches under different conditions.

Candidate expresses a conditional principle preserving those conditions.

Expected: `good synthesis`

## Regression testing

When changing:

- Prompts.
- Models.
- Source scoring.
- Research workflow.
- Citation evaluator.
- Parser.
- Templates.

rerun representative evals.

Do not assume a more detailed prompt or newer model improves this repository's actual quality. OpenAI's current model guidance recommends simplifying prompts and validating changes against representative evals. [1]

## Human baseline

Periodically compare agent output to careful human review.

Human review should record not only pass/fail but the failure category so recurring weaknesses can become new fixtures or deterministic checks.

## Eval artifacts

Evals should be versioned and reproducible.

Future structure:

```text
evals/
├── fixtures/
│   ├── citation-entailment/
│   ├── source-quality/
│   ├── taxonomy/
│   └── writing/
├── expected/
└── README.md
```

## References

1. [OpenAI — Model guidance][1]

[1]: https://developers.openai.com/api/docs/guides/latest-model
