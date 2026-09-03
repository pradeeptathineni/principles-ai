# Tests

Deterministic tests and adversarial fixtures live here and run with `npm test`.

Positive and negative fixtures cover every executable schema and policy boundary: lifecycle and trusted-base transitions; parser and filesystem restrictions; corpus, citation, source, and evidence contracts; internal and external links; deterministic output; and templates. Include unavailable-baseline reporting and every specified edge case in `config/`, `docs/workflows/bootstrap.md`, `docs/standards/security.md`, and `docs/standards/evaluation.md`.

Architecture tests additionally cover change-impact classification, ordinary corpus-only exclusions, route reachability, canonical action and gate identifiers, callable implementation owners, resolved outcome classes, composed state sequences, resumption, ordinary furnishing no-ops, and explicit domain refinement of active targets. Semantic architecture fixtures remain advisory until human calibration.

Mutation tests cover transaction preconditions, rollback, and writer serialization; contiguous and batch principle/source allocation; content identity materialization; file and domain citation/bibliography projection; source-usage reporting; task-scoped gate grouping; run-checkpoint binding and invalidation; evidence invalidation; compact human activation views; manifest derivation; and meaningful activation packages with reviewed-state binding and invalidation. CLI lifecycle assertions use isolated fixture repositories so ordinary canonical lifecycle changes do not require rewriting test expectations. Operational tests keep network behavior controlled and cover method fallback and scoped-source isolation.

The suite uses Node's built-in runner. Network behavior uses controlled resolver/request fixtures; ordinary deterministic tests do not access the network. Snapshot validity must not substitute for historical transition proof, nor deterministic success for semantic correctness.
