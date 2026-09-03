---
schema_version: 5
id: coding.version-control
title: Coding Version Control
domain: coding
type: subdomain
subdomain: version-control
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 76a17dc3a1b778a2aa6d53f0d11d28e502d37cdeebaaff171dd0b7e13044e315
---

# Coding Version Control

Version control concerns creating an inspectable, attributable, and recoverable history of code and related artifacts.

## Principles

### PRN-000043 — Record one coherent change per commit

Make each published commit a small logical step that is internally consistent and independently understandable. [1]

#### Why

Coherent commits improve review, later inspection, causal debugging, and selective reversal. Mixing unrelated edits hides intent and makes every history operation carry unnecessary risk. [1]

#### Practices

- Separate behavior, refactoring, generated output, and broad formatting when they can be reviewed and verified independently. [1]
- Write the commit message to explain the purpose and consequence that the diff cannot show by itself. [2]

### PRN-000044 — Keep shared history trustworthy

Protect shared branches and preserve attribution, review, and verification evidence appropriate to the code’s risk. [3], [4]

#### Why

Version history is used to understand how code changed and which controls were applied. Unauthorized mutation or ambiguous provenance weakens both operational recovery and supply-chain assurance. [3], [4]

#### Practices

- Require authenticated changes and restrict direct updates to protected integration and release references. [3], [4]
- Use review, status checks, signing, or source provenance where their assurance benefit matches the threat model. [3], [4]

### PRN-000045 — Integrate without obscuring ancestry

Choose merge, rebase, and cherry-pick behavior deliberately so shared history remains understandable and already-published ancestry is not silently rewritten. [1]

#### Why

Integration strategies encode different relationships between changes. Rewriting a revision that others rely on creates competing histories, while indiscriminate cherry-picking can hide which line of development contains a fix. [1]

#### Practices

- Rebase private work when useful, but avoid rebasing a topic after it has been merged or otherwise shared as stable history. [1]
- Follow the project’s documented release and backport policy; use oldest-line-upward propagation only in workflows organized that way. [1]

#### Applicability

The cited Git workflow documents the Git project’s own integration model and explicitly warns that a different project may need only selected ideas. Preserve understandable ancestry without copying its branch direction literally. [1]

## References

1. [gitworkflows — An overview of recommended workflows with Git][1] — `SRC-000021`
2. [SubmittingPatches][2] — `SRC-000030`
3. [NIST SP 800-218, Secure Software Development Framework Version 1.1][3] — `SRC-000014`
4. [SLSA v1.2 — Provenance][4] — `SRC-000019`

[1]: https://git-scm.com/docs/gitworkflows/2.35.0
[2]: https://git-scm.com/docs/SubmittingPatches
[3]: https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-218.pdf
[4]: https://slsa.dev/spec/v1.2/provenance
