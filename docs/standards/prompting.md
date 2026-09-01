# Prompting Standard

## Principle

Prompts describe the task. The repository describes the rules.

Do not repeatedly copy stable project policy into task prompts. Stable instructions belong in `AGENTS.md`, `docs/`, `config/`, and domain manifests.

## Primary interactive interface

Natural-language interaction with an agent is the preferred interface for judgment-heavy work such as domain creation and taxonomy evolution.

A user should be able to say:

> Add a `psychology` domain. I specifically care about behavior, relationships, and personal growth. Research the other major subdomains and build the taxonomy before generating content.

The user should not need to know:

- YAML schema.
- Domain codes.
- Subdomain codes.
- The final complete taxonomy.
- Internal parser or validation commands.

The agent converts intent into repository changes according to canonical standards.

## Prompt responsibilities

A task prompt should normally specify:

- The concrete objective.
- The target domain/files or scope when known.
- Explicitly important subdomains or priorities.
- Any exclusions or constraints.
- The desired outcome or acceptance criteria.
- Any task-specific condition not already encoded in repository policy.

It should not restate:

- The entire citation standard.
- The entire source hierarchy.
- The taxonomy policy.
- The full writing guide.
- Generic coding-agent behavior already supplied by the repository.

## Examples

Prefer:

> Add a `teaching` domain. Tutoring, students, teachers, parents, classroom, and virtual teaching are required scopes. Research the other major subdomains, create the domain manifest, and follow repository validation.

over a form-like prompt that manually enumerates YAML fields.

For existing content, prefer:

> Research and create `domains/coding/design.md`. Follow repository instructions and complete all required validation. Preserve unresolved evidence conflicts rather than forcing consensus.

## Scripts versus prompts

Do not create a conversational input script merely to collect information an agent can interpret reliably from natural language.

Use scripts for deterministic work such as:

- Manifest validation.
- Code/ID generation and collision checks.
- Taxonomy aggregation.
- File scaffolding after scope is accepted.
- Parsing and validation.

Use the agent for fuzzy intent, research, scope judgment, and synthesis.

Programmatic model calls may later automate repeated workflows. Those calls should use context assembled from the same repository-local standards and manifests rather than duplicating the policy in application code.

## Task decomposition

For complex work, split responsibilities into explicit stages or agent roles:

1. Interpret intent.
2. Scope or taxonomy research.
3. Source research.
4. Evidence extraction.
5. Synthesis.
6. Citation verification.
7. Adversarial review.
8. Deterministic validation.
9. Final change summary.

Do not force all stages into one uninterrupted generation when independent verification would improve quality.

## Output contracts

Prefer outcome-oriented acceptance criteria over micromanaging internal reasoning.

Good:

- The domain manifest passes schema validation.
- Explicitly required subdomains are preserved.
- The taxonomy is justified by research and distinct scope.
- Every required claim has a supporting citation.
- Every citation has been checked for entailment.
- No principle is added solely to fill coverage.

Avoid prescribing unnecessary private reasoning that does not affect the artifact.

## Tool use

Expose or invoke only tools relevant to the task.

Research tasks need source discovery and retrieval. Parser implementation needs repository and test tools. A formatting-only correction should not trigger broad research.

## Prompt stability

Keep stable prompts lean and stable when practical. Do not optimize the repository around a particular model's temporary quirks unless an eval demonstrates a persistent need.

## Prompt changes

Treat prompt changes like code changes:

- State the intended improvement.
- Run representative evals before and after.
- Compare quality, failure types, and token cost.
- Keep the simpler prompt when quality is equivalent.
