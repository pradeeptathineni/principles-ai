# Private principle practice

Run `node bin/principles-study.js help` with Node 24 for the standalone interface. No model, network, scheduler, or generation service is used. Prompts are deterministic questions about the actual selected principle title. Edit them to suit your purpose.

Source selection uses the existing native parser, identity ledger, accepted taxonomy, active corpus status, and exact reviewed semantic hash. Drafts are excluded. The source snapshot retains the complete verification context, exact entry Markdown, bibliography, source lifecycle qualifications, explicit revision, and input digests. Selection does not activate or change anything in the corpus.

## CLI sequence

Pass an explicit corpus root and revision on every invocation. Session commands also require a private directory outside that repository. Use a directory whose contents you intend to keep private. The following placeholders are values to replace; do not paste them literally.

```sh
node bin/principles-study.js list --root CORPUS_ROOT --revision SOURCE_REVISION --query SEARCH_TEXT
node bin/principles-study.js start --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --name SESSION_NAME --principles PRN-000001
node bin/principles-study.js cue --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --session SESSION_ID --principle PRN-000001 --text 'My recall cue'
node bin/principles-study.js attempt --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --session SESSION_ID --principle PRN-000001 --text 'My explanation before reveal'
node bin/principles-study.js reveal --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --session SESSION_ID --principle PRN-000001 --attempt ATTEMPT_ID
node bin/principles-study.js rate --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --session SESSION_ID --principle PRN-000001 --attempt ATTEMPT_ID --rating partial --example 'My own application example' --revisit 2026-10-30
node bin/principles-study.js show --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --session SESSION_ID
node bin/principles-study.js export --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --session SESSION_ID --format markdown
```

`sessions` lists resumable sessions. `revisit --date YYYY-MM-DD` changes a chosen date and retains date history. A second attempt requires completion of the pending attempt. Completed attempts are immutable, and each retains the exact source snapshot and cue used. Cues remain editable, with earlier versions retained. Explanations, examples, and the `again`, `partial`, and `comfortable` self-ratings are personal reports, never mastery or empirical efficacy measurements.

Normal session views omit exact source content until an explanation has been recorded and that attempt revealed. The explicit `list` source reader and `export` actions intentionally disclose source content. An export is not an enforced learning protocol or a secrecy mechanism. Personal notes never become canonical corpus evidence.

## Private learning paths

A path adds a learner-authored goal, ordered explain/apply steps, earlier-step prerequisites, and evidence-bound progress to a private study session. It uses the same selected principle snapshots, attempts, and atomic `sessions.json` store. Creation is one write, and each command reloads the store, so paths reopen in another process. Definitions and evidence stay private; neither enters the public corpus.

`path-create` takes a JSON array of steps. Each step has a unique `id`, `title`, `kind` (`explain` or `apply`), selected `principle_id`, learner-authored `prompt`, and `prerequisites` array. Prerequisites may name only earlier steps. The path supports at most 32 steps and 32 retained definitions. `path-revise` requires the current `--expected-revision`; it appends a definition. `path-view` reports `available`, `blocked`, `recorded`, `review`, or `unavailable`, with prerequisite blockers, saved source state, and prior evidence. Independent steps can remain available while another step is blocked.

An explain step can be recorded only by linking a revealed, rated attempt for the selected principle whose cue exactly matches that step's current prompt and whose source index is the current saved snapshot, while that snapshot still compares as current. Any self-rating qualifies; it is not a correctness score. Start an attempt with `path-attempt --step STEP-ID --expected-revision N --text TEXT`; this uses the existing attempt history while capturing the step prompt as the attempt cue, without changing the ordinary session cue. Then use the existing `reveal` and `rate` commands. Generic attempts and attempts for another prompt remain in history but cannot complete this step. An apply step requires an explicit `--observation` about what happened when the learner used the principle; it is labeled as the learner's report and is not independently verified. A linked attempt is optional, but must meet the same prompt, completion, and source conditions. Neither a rating nor a model evaluates the report as correct. Changed step meaning, source snapshot, or prerequisites leaves old records in history and makes the step require review. If the source owner is unavailable, matching saved progress remains visible with that unavailable status, while new path attempts and completions wait. Old sessions without `learning_path` remain valid.

```sh
node bin/principles-study.js path-create --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --name PATH_NAME --goal 'Explain and apply a decision' --principles PRN-000001 --steps '[{"id":"explain","title":"Explain the principle","kind":"explain","principle_id":"PRN-000001","prompt":"State the decision and its limits.","prerequisites":[]},{"id":"apply","title":"Apply the principle","kind":"apply","principle_id":"PRN-000001","prompt":"Describe an application and what happened.","prerequisites":["explain"]}]'
node bin/principles-study.js path-view --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --session SESSION_ID
node bin/principles-study.js path-attempt --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --session SESSION_ID --step explain --expected-revision 1 --text 'My explanation before reveal'
node bin/principles-study.js reveal --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --session SESSION_ID --principle PRN-000001 --attempt ATTEMPT_ID
node bin/principles-study.js rate --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --session SESSION_ID --principle PRN-000001 --attempt ATTEMPT_ID --rating partial --example 'My own example' --revisit 2026-10-30
node bin/principles-study.js path-record --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --session SESSION_ID --step explain --expected-revision 1 --attempt ATTEMPT_ID
node bin/principles-study.js path-record --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --session SESSION_ID --step apply --expected-revision 1 --observation 'I tried it in a disposable example and noted the result.'
node bin/principles-study.js path-revise --root CORPUS_ROOT --revision SOURCE_REVISION --store PRIVATE_DIR --session SESSION_ID --expected-revision 1 --goal 'Explain and apply the decision' --steps '[{"id":"explain","title":"Explain the principle","kind":"explain","principle_id":"PRN-000001","prompt":"State the decision and its limits.","prerequisites":[]}]'
```

Replace placeholders and step JSON with the learner's actual values. `export --format json|markdown` includes the path, definition history, saved evidence, and source qualifications alongside existing session detail. A revision conflict refuses without writing; invalid IDs, selected principles, dependencies, and bounds also fail closed.

## Reopen and source changes

Each command reads the private store again, so restarting the process needs only the same explicit root, revision, store, and session ID. Saved source material is retained when the live owner is unavailable. Current comparisons report `current`, `changed`, `inactive`, `missing`, or `unavailable`. A changed revision, entry, referenced source input, taxonomy input, or identity ledger binding cannot silently replace a snapshot. `refresh --session ID --principle PRN-ID` explicitly appends the current eligible source and keeps earlier attempts attached to their earlier snapshot. Finish a pending attempt before refreshing. Missing or inactive sources cannot be refreshed or used for new attempts; their notes remain readable.

The private directory is created mode 0700 and `sessions.json` mode 0600. Writes acquire `.study.lock` and atomically rename a temporary file. Concurrent writers fail with an explicit busy error. After a crashed writer, verify no writer is active before manually removing a stale lock. Unknown versions, invalid records, and tampered source snapshots fail closed. No repair, migration, or deletion is automatic. This is local plaintext storage under the user's control, without account synchronization.

## Read-only owner integration

`src/study.js` exports `loadStudyCatalog({root,revision})` and `createStudyService({root,store,revision,clock?,idFactory?})`. The service implements the CLI actions; injected clocks and IDs support deterministic fixtures. All corpus access is read-only.

`knowledge-export --instance INSTANCE_ID` produces the Signals envelope with accepted principles. Supplying `--store PRIVATE_DIR` explicitly includes `study-session` records as well. The service equivalent is `knowledgeExport(instanceId,{includeSessions:true})`; private records are excluded by default. Each record's `content` is canonical JSON, and its reference contains `owner`, `kind`, stable `id`, `digest` (SHA256 of UTF8 content), and `revision` (`sha256:` plus digest). The envelope includes `source_revision`, `exported_at`, and an explicit frozen-export freshness description. A downstream reader's match means agreement with that configured export, not live observation of the owner; export again after changes.

Session export includes personal explanations/examples and saved sources. Only configure such an export for consumers you intend to receive those notes. No arbitrary filesystem discovery is involved. The Deep host should own configuration of source/store paths and keep those paths out of client-supplied requests.

Signals display metadata is bounded (title 500, summary 2000, qualification 1000 characters) while exact content stays complete. Records over 2 MB or an envelope over 10 MB fail explicitly; use the standalone session export for larger histories. No source content is silently shortened to satisfy an integration limit.

## Verification and fixtures

Run `node --test tests/study.test.js` and the normal offline repository checks. The focused tests cover explanation-before-reveal, immutable attempts, restart/reopen, explicit date history, source refresh/change/inactive/missing/unavailable paths, store privacy boundaries, malformed versions, symlinks, concurrent writers, exact Signals digests, and real native source selection. These demonstrate mechanics, not human benefit.

For a safe synthetic consumer journey, run `node scripts/study-fixture.mjs NEW_FIXTURE_ROOT`; its parent must exist and target must not. It writes a standalone synthetic source accepted by the actual native reader, with reserved fixture identity `PRN-000001`, example.com sources and explicit test-only qualification. It never edits the real corpus. `tests/fixtures/study-repository.js` exposes the same factory for consumer tests. [Study prior art](study-prior-art.md) records the exact inspected method and no-transfer decision.
