# Scripts

The deterministic harness is exposed through one local CLI:

```text
npm run validate
node bin/principles.js validate --json
node bin/principles.js validate --baseline-ref <trusted-merge-base>
node bin/principles.js workflow --target domains/coding/design.md --json
node bin/principles.js workflow --domain coding --json
node bin/principles.js taxonomy --output generated/taxonomy.yaml
node bin/principles.js parse --output -
node bin/principles.js context --profile standard --principle PRN-000001 --revision <revision>
npm run check:links -- --json
node bin/principles.js links external --baseline generated/operational-links.json --as-of 2026-09-01 --snapshot-output generated/operational-links-next.json --json
```

`validate` is offline. External reachability is an isolated operational command and workflow. A supplied operational baseline enables hash-only source-content comparison; without one that check reports `not_evaluated`. Review-due output uses the explicit observation date when provided. Operational snapshots, generated taxonomy, parsed models, and context packs are derived outputs; they are not canonical and are not committed by default.

The workflow command reports deterministic prerequisite and gate state for an agent-orchestrated natural-language outcome. The harness contains no model SDK, embeddings, semantic search, database, service, daemon, or programmatic model orchestration.
