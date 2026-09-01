# AI Contribution Standard

## Principle

AI is a contributor to the evidence-synthesis and maintenance process, not an authority.

A model's internal knowledge is useful for planning, interpretation, and discovery but does not substitute for evidence when the corpus requires external grounding.

## Human intent

Explicit human priorities are first-class input.

When a user requests a domain or names required subdomains, an agent should preserve that intent in the domain manifest and research around it.

An agent may challenge or recommend changes to a human-required subdomain, but must not silently remove, merge, rename, or deprecate it.

## Permitted contributions

Agents may:

- Interpret natural-language domain requests.
- Research and propose domain taxonomies.
- Map a subdomain.
- Discover candidate sources.
- Read and compare sources.
- Extract minimal research evidence.
- Propose principles, rationale, practices, goals, and tags.
- Propose source upgrades.
- Detect stale or broken references.
- Detect duplicate or conflicting principles.
- Evaluate citation entailment.
- Implement parser, validator, test, and automation tooling.
- Generate pull requests.
- Respond to review feedback.
- Build derived taxonomy and context artifacts.

## Prohibited behavior

Agents must not:

- Fabricate a source, quotation, date, version, or citation.
- Cite a page without reading enough of it to verify the claim.
- Treat search snippets as evidence.
- Generate principles first and backfill vaguely related citations.
- Strengthen normative language beyond the evidence.
- Convert vendor-specific advice into a universal principle without support.
- Hide credible disagreement.
- Bulk-copy copyrighted source material into the repository.
- Silently remove an established principle because a newer source uses different wording.
- Silently alter a `required_subdomains` entry.
- Treat a generated taxonomy aggregate as canonical.
- Modify generated artifacts as though they were source-of-truth files.
- Bypass failed validation to complete a task.

## Impact levels

### Low

- Fix broken URLs without changing the referenced authority.
- Formatting corrections.
- Typographical corrections.

### Medium

- Replace a source with a stronger equivalent.
- Update a practice while preserving the principle.
- Refine goals.
- Clarify rationale without changing meaning.

### High

- Change principle meaning or scope.
- Add or remove a principle.
- Resolve a documented disagreement.
- Add, remove, merge, rename, or materially rescope a domain/subdomain.
- Change stable taxonomy codes.
- Change citation, source, or taxonomy policy.

### Protected-intent change

A change to `required_subdomains` is high-impact and additionally requires explicit human approval.

## Independent verification

When feasible, generation and verification should be separated.

```text
Research / synthesis agent
        │
        ▼
Candidate change
        │
        ├──► citation-entailment reviewer
        ├──► source-quality reviewer
        ├──► taxonomy/duplication reviewer
        └──► deterministic validation
```

The same model may perform multiple passes initially, but prompts and artifacts should keep roles conceptually separate.

## Uncertainty

Agents should report uncertainty rather than collapse it.

An empty or smaller file is preferable to invented certainty. A smaller taxonomy is preferable to artificial symmetry.

## Repository feedback loop

When an agent repeatedly makes the same kind of mistake, improve the harness through documentation, configuration, deterministic validation, eval fixtures, workflow changes, or better context.

Do not respond only by making future prompts longer.

## Human governance

The default governance model is pull-request based:

- Agents propose.
- Automated checks evaluate.
- Humans retain final authority over high-impact corpus changes and protected human intent.

This may evolve as eval quality and confidence improve, but automation must not silently assume that semantic confidence equals truth.
