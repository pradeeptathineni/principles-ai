# Project

## Mission

This project preserves and continuously improves the principles the maintainer wants to embody across the disciplines they practice.

It is an evidence-grounded knowledge system, not a generic list of best practices. The corpus should represent considered judgment synthesized from authoritative evidence, established practice, meaningful experience, explicit human priorities, and explicit tradeoffs.

The project should help a reader answer:

- What matters most in this domain?
- Why does it matter?
- What should I actually do?
- How should I keep growing?
- What evidence supports this guidance?
- Where is the guidance contextual, disputed, or changing?

## Primary outputs

The primary artifact is the Markdown corpus under `domains/`.

Each domain also owns a `domain.yaml` manifest that defines its accepted taxonomy and stable ID codes.

Each domain contains or may progressively build:

- `principles.md`: the highest-order guidance worth carrying into nearly every task in the domain.
- `personal-growth.md`: the best ways to continue developing capability and judgment in the domain.
- Subdomain files: focused principles, practices, and goals for materially distinct areas of practice.

A domain manifest may register scopes before all corresponding Markdown files have been written. This supports deliberate, incremental corpus growth.

## Human intent

Human intent is first-class project input.

A maintainer may ask for a new domain and explicitly identify subdomains that matter personally or professionally. Those requirements should be preserved as protected taxonomy intent while AI research fills in other major areas of the discipline.

The project should not force a human to know the final taxonomy before asking for a domain. The agent is expected to help research and synthesize it.

## Audiences

### Humans

The corpus should be pleasant to browse as a learning resource. A reader should be able to understand a principle without knowing the repository's parser or automation.

### AI systems

The corpus should be structured enough to retrieve, parse, filter, validate, and inject selected principles into AI context without lossy interpretation.

### Maintainers and reviewers

Changes should be reviewable as evidence-backed proposals. The repository should make it easy to see what changed, why, which human priorities are protected, and which sources substantiate the content.

## Quality model

The repository optimizes for:

1. **Truthfulness** — claims accurately reflect the evidence.
2. **Authority** — sources are strong and fit for the claim.
3. **Usefulness** — guidance changes judgment or behavior.
4. **Durability** — principles survive ordinary changes in tools and fashion.
5. **Nuance** — scope, tradeoffs, uncertainty, and disagreement are preserved.
6. **Readability** — humans can learn from the raw Markdown.
7. **Parseability** — machines can extract structure without heuristic guessing.
8. **Maintainability** — stale evidence and weak content can be detected and updated.
9. **Context efficiency** — selected content can be supplied to AI without unnecessary repository noise.
10. **Intent preservation** — explicit human priorities survive autonomous maintenance unless a human intentionally changes them.

## Stability gradient

Different content changes at different rates:

| Content | Expected stability |
| --- | --- |
| Principles | Slow-changing |
| Rationale | Slow to moderate |
| Practices | Moderate |
| Goals | Personal and evolving |
| References | Actively maintained |
| Research-added taxonomy | Deliberate, reviewable |
| Explicit human taxonomy requirements | Protected until explicitly revised |

A newer tool or article is not sufficient reason to rewrite a durable principle.

## Human and agent roles

Humans define purpose, personal priorities, acceptable judgment, and final governance. Agents can interpret natural-language intent, research domain structure, synthesize taxonomy, research content, challenge assumptions, validate, implement, and propose updates.

Code should enforce deterministic invariants. AI should handle judgment where deterministic rules are insufficient.

The project should progressively encode human judgment into repository-local documentation, configuration, manifests, tests, and evaluation so agent performance improves without requiring larger ad hoc prompts.

## Non-goals

This repository is not intended to:

- Catalog every fact, tool, framework, or technique in a domain.
- Treat popularity as proof.
- Pretend engineering or teaching has one universal answer when credible disagreement exists.
- Turn vendor guidance into universal doctrine.
- Replace primary source documentation.
- Accumulate quotations or scraped source text.
- Optimize for maximum file size or principle count.
- Hide subjective synthesis behind authoritative-looking citations.
- Hardcode a forever-complete ontology of domains and subdomains in one central configuration file.
- Require users to express natural-language priorities through a low-level CLI or schema.

## Repository-local context

Important project knowledge should live in the repository rather than depending on external chat history or unwritten conventions. Agents are more reliable when the environment, rules, and feedback loops they need are inspectable and enforceable in-repo. OpenAI describes this pattern as making repository knowledge the system of record and using `AGENTS.md` as a compact map to deeper documentation. [1]

## References

1. [OpenAI — Harness engineering: leveraging Codex in an agent-first world][1]
2. [OpenAI — Unrolling the Codex agent loop][2]

[1]: https://openai.com/index/harness-engineering/
[2]: https://openai.com/index/unrolling-the-codex-agent-loop/
