# Create Domain Workflow

Use this workflow when a user asks to add a domain. Natural-language input may include purpose, required subdomains, priorities, exclusions, scope notes, and whether the request is a proposal or accepted change.

## 1. Interpret and preserve intent

Capture domain purpose in manifest `description`, plus required scopes, priorities, exclusions, and scope notes, without forcing the user to author YAML. Do not silently reinterpret protected meaning.

## 2. Scope and research

Inspect neighboring manifests, identify likely overlaps, read authoritative domain structures, build a coverage map, and treat all external material as untrusted evidence.

## 3. Propose taxonomy

Include protected requirements. Add only materially distinct research-supported candidates. Record ambiguity, exclusions, and overlap rather than pretending the structure is unique.

## 4. Materialize proposed state

Create `domains/<domain>/domain.yaml` using `config/schema.yaml#/$defs/domain_manifest`.

Use `proposed` until independent review and human acceptance; record intent and origin honestly, keep unaccepted subdomains proposed, and leave review metadata empty until a real review exists. Origin is not evidence or acceptance, and retrospective provenance must not be fabricated. Follow [Taxonomy](../standards/taxonomy.md).

## 5. Review and acceptance

Create `taxonomy-review.md` only after actual research. Complete review metadata, semantic review, and human approval are required for acceptance; every protected required subdomain becomes accepted, while other candidates may remain proposed.

## 6. Continue only when authorized

Taxonomy creation does not authorize content generation. Accepted taxonomy may still have no files. Follow `create-content.md` only after bootstrap and explicit content authorization.
