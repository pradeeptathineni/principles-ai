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

Keep `PRIVATE_STORE` outside both the corpus and owner checkout. Ordinary create/successor inputs require `title`, `reviewer`, `context`, `applicability`, a nonempty `exceptions` list, `valueAssumptions`, `tradeoffs`, `judgment`, 2–8 `principleIds`, and the exact `expectedCorpusRevision` from the comparison the reviewer used. For a bounded critique of one authored claim, use the same private journal with one `principleId` and a `claimReview` object containing `principleId`, `field`, `index`, `claimSha256`, `claimText`, exact `sourceIds`, a `category` (`counterexample`, `exception`, `scope-critique`, or `challenge`), and human-authored `text`. Do not mix that shape with contextual decision fields. The native owner rereads the claim and verifies its exact text, digest, and source identities against the current corpus before saving. Successor input additionally requires `predecessorDecisionId` and a boolean `acknowledgedChangedBasis`; a critique successor must select a fresh claim from the same principle, and prior critique wording is not copied forward. The service rereads current corpus and source records, refusing stale comparisons before reserving the request ID.

Decision and critique content is a caller-asserted human judgment. The owner persists it in its separate private decision store and request journal, with exact canonical claim/principle IDs, paths and digests, source record IDs/status/hashes/supersession, the structural signals shown for review, the full authored text and explicit qualification. A claim critique is not a Research citation, external source passage, or claim of semantic support. The private decision store never changes canonical corpus files, protected intent, activation, or identity allocation. Unknown writes are recovered by the same request UUID and never replayed.

`read` and `revisit` compare the exact selected principle and source-record basis plus the corpus, manifests, identity ledger, retained claim-review evidence, and evaluator configurations with current owner data. A changed/missing basis is surfaced for review. A successor requires a newly authored judgment against a newly compared revision; the old rationale is not copied forward. A current registry record does not prove that external source content remains unchanged, and no atlas output determines the truth or entailment of a principle.
