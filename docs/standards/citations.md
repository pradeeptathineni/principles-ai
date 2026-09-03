# Citation Standard

## Purpose and claim units

Citations provide claim-level provenance; their presence does not prove support.

A terminal citation run is required for the statement, every top-level Why paragraph, every Practice item, every Applicability paragraph, and any Goal making an external claim. Introductions are editorial scope and cannot evade this rule.

## Authoring syntax

Use document-local numeric CommonMark reference links:

```markdown
One-source claim. [1]

Jointly supported claim. [1], [2]
```

A claim block contains exactly one citation run at its end. Labels are positive integers, ascending and unrepeated within a run, separated by comma-space. Never use adjacent `[1][2]`; GFM parses it as one full reference link. Text after the run, numeric reference links elsewhere in the block, and unsupported separators are invalid. Split a block when distinct claims need different evidence.

Ordinary inline links remain available, but claim-block link titles are forbidden and link destinations contribute to the normalized claim text.

## Bibliography and stable identity

The final `## References` section maps every local label to one stable repository source ID:

```markdown
## References

1. [Source title][1] — `SRC-000001`

[1]: https://example.com/current-url
```

Used labels, visible entries, and definitions form one exact catalog: each appears once, labels are contiguous and ordered, the entry/definition labels agree, and a source ID appears at most once per file. Visible title and definition URL agree exactly with that source record's title and canonical URL or stored alias. No unused, duplicate, nonnumeric, or unrelated reference definitions are allowed. `config/content-policy.yaml` owns the full executable grammar.

First-use numbering is recommended, not required. After humans or agents select source identities, deterministic synchronization may assign labels and regenerate the catalog; it cannot add/select evidence or judge entailment. A changed source sequence invalidates retained claim review.

Source records follow [Sources](sources.md) and the executable schema.

## Entailment, quotations, and authority

Each source must support the exact claim's meaning, scope, normative strength, and material conditions; topical relevance alone is insufficient. Multiple partial sources may jointly support a claim when semantic review records the combined judgment. Narrow, re-source, or remove unsupported claims.

Quote only brief exact language inside a claim block whose terminal run supports it. Never present reconstructed wording as a quotation.

Deterministic validation proves citation presence and grammar, catalog/source mapping, resolution, URL syntax, evidence coverage, and claim-hash/source agreement. Semantic review decides entailment, fitness, authority, calibration, independence, currency, and hidden claims. Humans retain required high-impact and evidence-policy decisions.

## Reference

[GitHub Flavored Markdown — reference links](https://github.github.com/gfm/#reference-link)
