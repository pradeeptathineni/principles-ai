# Task-specific field guides

`field-guide` exports disposable, read-only guidance for one task from exact active Principles IDs.
It reuses the native validator and Atlas owner, then calls the accepted Context `standard` export
contract. Standard context retains each selected principle's full rationale, practices, authored
applicability, namespaced citations, source IDs, source-input hashes, corpus file revision, and
selection digest. Draft principles are refused. Selection never activates corpus content.

Create a JSON request with an exact current `expectedCorpusRevision` obtained from
`principle-atlas compare` for two or more selected IDs or `principle-atlas show` for one. Then export outside the
corpus:

```sh
principle-atlas compare --root /path/to/principles --owner-revision <owner-revision> \
  --entry-ids PRN-000001,PRN-000002
field-guide create --root /path/to/principles --owner-revision <owner-revision> \
  --input request.json --output /tmp/task-guide.json
field-guide read --root /path/to/principles --owner-revision <owner-revision> \
  --input /tmp/task-guide.json
```

The request format is explicit and closed; this example records caller assertions rather than a
machine conflict verdict:

```json
{
  "task": "Review a recovery-path change.",
  "selectionRationale": "These two principles cover recovery and operator burden.",
  "principleIds": ["PRN-000001", "PRN-000002"],
  "expectedCorpusRevision": "<64-hex-digest-from-atlas>",
  "conflictReview": "Reviewed the selected comparison; precedence remains conditional.",
  "conflicts": [{
    "principleIds": ["PRN-000001", "PRN-000002"],
    "description": "Fast recovery may conflict with preserving forensic context.",
    "resolutionStatus": "conditional",
    "precedence": "Contain immediate harm before restoring full service.",
    "rationale": "Urgent service impact changes the acceptable order.",
    "conditions": "Preserve evidence first when no urgent impact is present."
  }],
  "exceptionNotes": [{
    "principleId": "PRN-000001",
    "exception": "Use the fast path for active harm.",
    "scope": "Active harm only; record the decision and revisit evidence afterward."
  }],
  "coverageUnknowns": [{
    "area": "Unrepresented deployment types",
    "reason": "No separate semantic coverage review was supplied."
  }]
}
```

The request contains `task`, `selectionRationale`, `principleIds`, `expectedCorpusRevision`,
`conflictReview`, `conflicts`, `exceptionNotes`, and `coverageUnknowns`. Each conflict is caller-
authored with selected principle IDs, a description, a status of `conditional`, `precedence-recorded`,
or `unresolved`, precedence, rationale, and conditions. These
fields are retained as caller assertions; Atlas reports structural comparison signals only and does
not infer semantic conflicts, contradiction, or precedence. Canonical applicability claims and
scoped caller exception notes remain visible. The guide reports domain file/lifecycle inventory,
while semantic coverage remains `unknown` and caller-declared gaps remain explicit.

The `principles.field-guide/1` record includes the full Context `standard` payload, exact owner and
corpus revisions, a digest over the guide, caller rationale, conflict/exception declarations, and
coverage limits. `read` cold-validates the digest, rebuilds against current canonical state, and
refuses if the corpus or bound inputs changed. Output files must be new paths outside the corpus;
stdout is also supported. This export grants no approval, activation, installation, or universal
truth claim. A current owner revision string is caller-declared; it is not authenticated as Git
state, and external source content is not fetched or refreshed.
