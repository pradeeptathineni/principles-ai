# Scripts

Repository tooling should be implemented during the bootstrap workflow.

Expected deterministic capabilities:

- Discover and validate `domains/*/domain.yaml` manifests.
- Build a derived repository-wide taxonomy from domain manifests.
- Scaffold domain/subdomain codes and detect collisions.
- Parse corpus Markdown into structured data.
- Validate schema and taxonomy membership.
- Check references and links.
- Check required citation presence.
- Build derived AI context.
- Run or orchestrate semantic evals.
- Produce actionable diagnostics.

Scripts should enforce deterministic invariants, not replace AI judgment about fuzzy user intent, domain boundaries, or evidence synthesis.

Implementation details are intentionally not fixed by policy. Prefer small composable commands with deterministic behavior where possible.
