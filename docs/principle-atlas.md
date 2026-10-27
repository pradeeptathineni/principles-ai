# Principles domain atlas

`principle-atlas` reads the current validated Principles corpus through the native parser, source registry, manifests, and identity ledger. It does not create a second corpus or write canonical principle content.

```sh
node bin/principle-atlas.js search --root CORPUS --owner-revision OWNER_SHA --query "context"
node bin/principle-atlas.js show --root CORPUS --owner-revision OWNER_SHA --entry-id PRN-000001
node bin/principle-atlas.js source --root CORPUS --owner-revision OWNER_SHA --source-id SRC-000001
node bin/principle-atlas.js compare --root CORPUS --owner-revision OWNER_SHA --entry-ids PRN-000001,PRN-000002
```

Search is bounded literal substring lookup over canonical claims, tags, domain/scope titles and IDs, and cited source IDs/titles/publishers/status. Match fields help find records; they do not infer applicability, duplication, conflict, truth or entailment. Comparison returns exact authored entry text, stable principle and source identities, current source registry lifecycle and metadata, file and derived entry-content digests, shared-source identity, same-scope signals, and declared identity relationships. Corpus revision binds all canonical corpus files, manifests, source records, the identity ledger, retained claim-review evidence, and evaluator configurations. Citation syntax supplies no passage locators, so the atlas does not invent them. Shared citations can flag possible dependence; they do not establish source independence, fitness or support.

## Human contextual decisions

The owner also offers standalone decision commands:

```sh
node bin/principle-atlas.js decision create --root CORPUS --owner-revision OWNER_SHA --source-root OWNER_CHECKOUT --store PRIVATE_STORE --request-id UUID --input decision.json
node bin/principle-atlas.js decision list --root CORPUS --owner-revision OWNER_SHA --store PRIVATE_STORE
node bin/principle-atlas.js decision read --root CORPUS --owner-revision OWNER_SHA --store PRIVATE_STORE --id UUID
node bin/principle-atlas.js decision revisit --root CORPUS --owner-revision OWNER_SHA --store PRIVATE_STORE --id UUID
node bin/principle-atlas.js decision successor --root CORPUS --owner-revision OWNER_SHA --source-root OWNER_CHECKOUT --store PRIVATE_STORE --request-id NEW_UUID --input successor.json
node bin/principle-atlas.js decision recover --root CORPUS --owner-revision OWNER_SHA --store PRIVATE_STORE --request-id UUID
```

Keep `PRIVATE_STORE` outside both the corpus and owner checkout. Create/successor inputs require `title`, `reviewer`, `context`, `applicability`, a nonempty `exceptions` list, `valueAssumptions`, `tradeoffs`, `judgment`, 2–8 `principleIds`, and the exact `expectedCorpusRevision` from the comparison the reviewer used. Successor input additionally requires `predecessorDecisionId` and a boolean `acknowledgedChangedBasis`. The service rereads current corpus and source records, refusing stale comparisons before reserving the request ID.

Decision content is a caller-asserted human judgment. The owner persists it in its separate private decision store and request journal, with exact canonical entry IDs/paths, semantic and file digests, source record IDs/status/hashes/supersession, the structural signals shown for review, the full authored situation and rationale, and explicit qualification. The private decision store never changes canonical corpus files, protected intent, activation, or identity allocation. Unknown writes are recovered by the same request UUID and never replayed.

`read` and `revisit` compare the exact selected principle and source-record basis plus the corpus, manifests, identity ledger, retained claim-review evidence, and evaluator configurations with current owner data. A changed/missing basis is surfaced for review. A successor requires a newly authored judgment against a newly compared revision; the old rationale is not copied forward. A current registry record does not prove that external source content remains unchanged, and no atlas output determines the truth or entailment of a principle.
