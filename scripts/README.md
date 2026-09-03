# Scripts

The deterministic harness is exposed through one local CLI:

```text
npm run validate
node bin/principles.js validate --json
node bin/principles.js validate --baseline-ref <trusted-merge-base>
node bin/principles.js validate --baseline-ref <trusted-merge-base> --authorized-taxonomy-target <domain[/subdomain]>
node bin/principles.js workflow --target domains/coding/design.md --json
node bin/principles.js workflow --domain coding --json
node bin/principles.js workflow --outcome refine-domain-content --domain coding --json
node bin/principles.js workflow --outcome create-domain --domain psychology --json
node bin/principles.js workflow --outcome review-architecture --json
node bin/principles.js prepare --domain coding --baseline-ref <trusted-merge-base>
node bin/principles.js run checkpoint --domain coding --input generated/coding-progress.yaml --output generated/coding-checkpoint.json
node bin/principles.js run checkpoint --check generated/coding-checkpoint.json --json
node bin/principles.js identity allocate --kind principle --count 2 --baseline-ref <trusted-merge-base> --json
node bin/principles.js source register --input generated/source-plan.yaml --baseline-ref <trusted-merge-base> --json
node bin/principles.js source register --input generated/source-batch.yaml --baseline-ref <trusted-merge-base> --json
node bin/principles.js content scaffold --target domains/coding/testing.md --output generated/testing-scaffold.md
node bin/principles.js content materialize --input generated/content-plan.yaml --baseline-ref <trusted-merge-base> --json
node bin/principles.js content materialize --input generated/content-batch.yaml --baseline-ref <trusted-merge-base> --json
node bin/principles.js citations sync --target domains/coding/design.md --apply
node bin/principles.js citations sync --domain coding --apply
node bin/principles.js evidence scaffold --entry PRN-000001
node bin/principles.js activation package --domain coding --baseline-ref <trusted-merge-base> --output generated/coding-activation.json --review-output generated/coding-activation-review.json
node bin/principles.js activation manifest --input generated/coding-activation.json --reviewed-at 2026-09-02 --all --output generated/approved-activation.yaml
node bin/principles.js activation apply --input generated/approved-activation.yaml --baseline-ref <trusted-merge-base> --json
node bin/principles.js taxonomy --output generated/taxonomy.yaml
node bin/principles.js parse --output -
node bin/principles.js context --profile standard --principle PRN-000001 --revision <revision>
npm run check:links -- --json
node bin/principles.js links external --domain coding --json
node bin/principles.js links external --source SRC-000014 --json
node bin/principles.js links external --baseline generated/operational-links.json --as-of 2026-09-01 --snapshot-output generated/operational-links-next.json --json
```

`validate` is offline. `--authorized-taxonomy-target` supplies explicit outcome-request context only for an unchanged proposed-to-accepted transition; it cannot authorize additions, definition changes, deprecations, reactivations, or protected-intent changes and does not prove semantic fit or approval. External reachability is an isolated operational command and workflow. A supplied operational baseline enables hash-only source-content comparison; without one that check reports `not_evaluated`. Review-due output uses the explicit observation date when provided. Operational snapshots, generated taxonomy, parsed models, and context packs are derived outputs; they are not canonical and are not committed by default.

The workflow command reports deterministic prerequisite and gate state for a resolved, agent-orchestrated natural-language outcome. `--target` and `--domain` retain the routine creation and furnishing shortcuts; `--outcome refine-domain-content --domain <domain>` explicitly selects every universal and accepted-subdomain file for renewed semantic discovery and selection, including active files. The helper exposes the target set and route but does not claim that the semantic work occurred. The harness contains no model SDK, embeddings, semantic search, database, service, daemon, or programmatic model orchestration.

`prepare` emits a disposable domain inventory, source-usage summary, policy versions, next identities, current outcome state, task-path/repository-wide/unrelated trusted-baseline transition groups, and a hash-bound task workset. A run checkpoint combines that workset with explicit coordination declarations and invalidates when bound files or an optional activation package change; it is not evidence, semantic proof, or approval.

`identity allocate`, `source register`, `content materialize`, citation application, and activation use validated transactions with rollback and a fail-fast repository writer lock. Source and content plans may use version 1 for one record or version 2 for a non-empty `sources` or `documents` array. Version-2 batches allocate contiguous identities and validate the complete write set once. Both plan forms may be read from standard input with `--input -`. Their semantic fields must already have been selected through the applicable research or content workflow. `content scaffold` emits a shell with `PRN-AUTO`; materialization replaces each placeholder with a contiguous identity while updating the ledger.

Batch plans wrap the corresponding reviewed version-1 payloads without adding semantic fields:

```yaml
version: 2
sources:
  - title: Reviewed source title
    publisher: Reviewed publisher
    evidence_kind: official-documentation
    canonical_url: https://example.com/source
    url_aliases: []
    published_or_version: null
    first_retrieved: '2026-09-02'
    last_reviewed: '2026-09-02'
    status: active
    superseded_by: null
```

```yaml
version: 2
documents:
  - target: domains/coding/testing.md
    content: |-
      <complete reviewed draft containing PRN-AUTO placeholders>
```

A run-checkpoint declaration has this closed coordination-only shape:

```yaml
version: 1
retrieved_sources:
  - url: https://example.com/source
    source_id: SRC-000001
    targets: [domains/coding/testing.md]
evidence_gaps:
  - target: domains/coding/testing.md
    description: Independent evidence for the scoped claim remains open.
reviewed_artifacts: [domains/coding/testing.md]
domain_review_complete: false
activation_package_path: null
```

Citation synchronization uses the source IDs already cited by valid claim blocks, assigns local numbers by first use, and regenerates the bibliography from the source registry. Target mode returns or applies one file; domain mode checks or applies every current domain file through one transaction. It neither selects sources nor evaluates support. Evidence scaffolding emits current roles, hashes, source order, and whether prior review can be retained; changed judgments remain unresolved until an AI or human supplies locators and outcomes.

An activation package retains the complete binding state. Its optional compact review projection removes duplicated binding state, deduplicates source and evidence effects, and carries descriptive source-usage counts; the agent still adds semantic findings, limitations, and the explicit decision. `activation manifest` derives approved path fingerprints from the package only after external human approval. `activation apply` rejects changed bound state, applies review metadata atomically, and reruns validation. No activation command infers or authenticates approval.

Unscoped external checking retains repository-wide link coverage. `--domain` and repeated `--source` limit an operational run to the selected registered source records, avoiding unrelated source noise; scoped runs intentionally omit general documentation links. HEAD is an optimization only: content capture and non-reachable HEAD responses are verified with GET, whose result is authoritative.
