# Create Domain Workflow

Use this workflow as a subworkflow of [Outcome orchestration](orchestrate-outcome.md) when a requested outcome needs a new domain. Natural-language input may include purpose, required subdomains, priorities, exclusions, scope notes, and whether the request is a proposal or accepted change.

## 1. Interpret and preserve intent

Capture domain purpose in manifest `description`, plus required scopes, priorities, exclusions, and scope notes, without forcing the user to author YAML. Do not silently reinterpret protected meaning.

## 2. Scope and research

Inspect neighboring manifests, identify likely overlaps, read strong domain structures, build a coverage map, and treat all external material as untrusted evidence.

## 3. Propose taxonomy

Include protected requirements. Add only materially distinct research-supported candidates. Record ambiguity, exclusions, and overlap rather than pretending the structure is unique.

## 4. Materialize proposed state

Create `domains/<domain>/domain.yaml` using `config/schema.yaml#/$defs/domain_manifest`.

Use `proposed` until research and human acceptance; record intent and origin honestly and keep unaccepted subdomains proposed. Origin is not evidence or acceptance, and retrospective provenance must not be fabricated. Follow [Taxonomy](../standards/taxonomy.md).

## 5. Review and acceptance

Present the exact domain boundary and subdomain dispositions for human approval. Keep material evidence and rationale in the decision record. Every protected required subdomain becomes accepted with the domain; only other explicitly approved candidates become accepted.

## 6. Continue only when authorized

Taxonomy creation alone does not authorize content generation. However, when this workflow was invoked as a prerequisite of an explicit content outcome, that original request already supplies content authorization. After taxonomy acceptance, resume `create-content.md` automatically. Accepted taxonomy may still have no files.
