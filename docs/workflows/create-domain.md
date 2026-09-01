# Create Domain Workflow

Use this workflow when a user asks to add a new domain.

## Input

The request may be natural language and may include:

- Domain name or concept.
- Optional description or intended scope.
- Explicitly required subdomains.
- Priorities or exclusions.
- Whether the user wants only a proposal or wants the domain built.

Do not require the user to supply YAML, stable codes, or a complete taxonomy.

## Stage 1 — Interpret intent

1. Identify the requested domain.
2. Extract explicitly required subdomains and preserve their wording/meaning.
3. Identify user constraints and priorities.
4. If the request is sufficiently clear, do not ask for information that research or repository context can resolve.

## Stage 2 — Scope the domain

1. Define what belongs in the domain.
2. Inspect existing domain manifests for overlap.
3. Decide whether the requested concept deserves a top-level domain rather than a subdomain of an existing domain.
4. Preserve useful overlap when the domain meaning, practices, goals, or sources materially differ.

## Stage 3 — Research the taxonomy

1. Identify authoritative frameworks, standards, bodies of knowledge, curricula, roadmaps, vendor-neutral guidance, and mature practice relevant to the domain.
2. Read enough primary material to understand how the discipline is commonly divided.
3. Build a coverage map of candidate subdomains.
4. Include all explicit user-required subdomains.
5. Add research-supported subdomains that pass the admission test in `docs/standards/taxonomy.md`.
6. Remove or combine thin research-only candidates that do not earn separate files.
7. Record meaningful ambiguity instead of pretending the taxonomy is objectively unique.

## Stage 4 — Materialize the manifest

Create:

```text
domains/<domain>/domain.yaml
```

The manifest must:

- Pass `config/schema.yaml` and `config/taxonomy-policy.yaml`.
- Assign a unique stable domain code.
- Assign unique stable subdomain codes.
- Put explicit human requirements in `required_subdomains`.
- Include every required subdomain in `subdomains`.
- Record subdomain provenance.
- Use `mixed` when a user-requested scope is also independently supported by the research synthesis.

Tooling may scaffold codes, but accepted codes live in the manifest.

## Stage 5 — Validate

Validate:

- Domain ID and directory name.
- Domain-code uniqueness across manifests.
- Subdomain IDs and codes.
- Required-subdomain preservation.
- Overlap and scope fit.
- No duplicate or artificial subdomains.
- No conflict with existing registered corpus paths.

Generate the repository-wide taxonomy aggregate if tooling supports it and verify it is reproducible.

## Stage 6 — Decide whether to continue

If the user asked only for taxonomy design, stop after presenting the manifest/change.

If the user explicitly asked to build the domain, the accepted manifest becomes the input to incremental corpus generation. Create content according to `docs/workflows/create-content.md` rather than inventing additional unregistered files during generation.

## Review summary

For a taxonomy change, report:

- Explicit user-required subdomains.
- Research-added subdomains.
- Material overlaps or exclusions considered.
- Any uncertainty.
- Validation performed.
