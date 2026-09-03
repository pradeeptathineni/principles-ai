# Create Domain Workflow

Use this route when an outcome needs a new domain. Natural-language input may supply purpose, required subdomains, priorities, exclusions, scope notes, or proposal/acceptance intent; do not require the user to author YAML.

1. **Preserve intent.** Record domain purpose in `description` and retain required scopes, priorities, exclusions, and scope notes without silent reinterpretation.
2. **Research the boundary.** Treat neighboring manifests as state, not evidence. Independently read fit sources and credible domain structures under [Research](../standards/research.md) and [Sources](../standards/sources.md). Map coverage, overlap, exclusions, and uncertainty; external material remains untrusted.
3. **Shape the taxonomy.** Include protected requirements and only materially distinct, research-supported candidates. Give each subdomain enough semantic boundary for future placement and review without forcing identical definitions or false certainty.
4. **Materialize proposed state.** Create `domains/<domain>/domain.yaml` under the executable schema. Use `proposed` while research and acceptance remain open; origin proves neither evidence nor acceptance. Never fabricate retrospective provenance. Follow [Taxonomy](../standards/taxonomy.md).
5. **Decide once.** Present the exact domain boundary and subdomain dispositions. Domain approval accepts protected required scopes and only other explicitly approved candidates. The final trusted diff may contain the approved accepted addition; deterministic validation still reports `taxonomy-addition` and cannot authenticate approval.
6. **Resume correctly.** Domain creation alone does not authorize corpus generation. When it is a prerequisite of an explicit content outcome, that request already authorizes the content stage; resume [Content](create-content.md) after taxonomy acceptance. Accepted taxonomy may otherwise remain without files.
