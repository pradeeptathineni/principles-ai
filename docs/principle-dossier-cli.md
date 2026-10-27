# Standalone principle dossier CLI

`principle-dossier` exposes the existing native dossier service for local review workflows. It reads and writes the same dossier records and request journal used by other service callers. It does not create a server or run a model.

Every command takes an explicit repository root, dossier store, and host-configured adoption targets:

```sh
principle-dossier list --root /path/to/principles --store /private/dossiers --targets /private/targets.json
principle-dossier show --root /path/to/principles --store /private/dossiers --targets /private/targets.json --id UUID
principle-dossier propose --root /path/to/principles --store /private/dossiers --targets /private/targets.json --request-id UUID --input proposal.json
```

`--targets` names adoption destinations as a JSON array, for example `[ { "id": "teaching-classroom", "path": "domains/teaching/classroom.md" } ]`. The store must be an absolute directory outside the Principles repository. Keep it private; proposal records include retained Research content.

`list` prints current dossier summaries. `show --id UUID [--version N]` reads an exact retained dossier version. The mutation commands `propose`, `revise`, `review`, `adopt`, `activate`, and `retire` accept JSON input through `--input FILE` or standard input with `--input -`. Their input fields match the corresponding methods in `createPrincipleDossierService`; the service remains the schema and policy authority. Proposals should include the retained Research answer object. The service labels caller supplied answers `caller_asserted` unless a configured Research owner reader verifies them.

Every mutation requires a caller-chosen UUID `--request-id`. Reusing an ID with different input is rejected. `recover --request-id UUID` reconciles that exact journal entry; if it was absent, the service durably records `not_seen` and that ID cannot be used for a later mutation. An `unknown` result means the service could not prove completion and did not replay the action. Recover that same ID after checking the owner state.

Review requires an explicit disposition, reviewer, support outcome, and acknowledgements of counterevidence, limits, and any value assumptions. The service records review identity as caller asserted and only permits human acceptance to support activation. Activation remains bound to the exact accepted version and review event. Adoption must use one configured target matching the proposal placement. Retirement requires exact active-version and canonical file digests, and the existing service applies its retirement safeguards.

Every command requires an explicit `--root`. Unknown and duplicate options are errors. Exit codes are 0 for confirmed or read-only success, 1 for rejected or fenced mutations (including a `not_seen` recovery), 2 for invalid CLI input or configuration, and 3 for an `unknown` mutation or recovery outcome. Mutation output is JSON so callers can preserve request IDs and review evidence.
