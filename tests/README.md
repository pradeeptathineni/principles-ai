# Tests

Deterministic tests and adversarial fixtures live here and run with `npm test`.

Positive and negative fixtures cover every executable schema and policy boundary: lifecycle and trusted-base transitions; parser and filesystem restrictions; corpus, citation, source, and evidence contracts; internal and external links; deterministic output; and templates. Include unavailable-baseline reporting and every specified edge case in `config/`, `docs/workflows/bootstrap.md`, `docs/standards/security.md`, and `docs/standards/evaluation.md`.

The suite uses Node's built-in runner. Network behavior uses controlled resolver/request fixtures; ordinary deterministic tests do not access the network. Snapshot validity must not substitute for historical transition proof, nor deterministic success for semantic correctness.
