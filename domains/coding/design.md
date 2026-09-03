---
schema_version: 5
id: coding.design
title: Coding Design
domain: coding
type: subdomain
subdomain: design
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: ac4b317fe29fd7571c4651ad9d760f7145bee22506517886928b8d1c55981c4c
---

# Coding Design

Code and component design shape how software is understood, changed, implemented, and verified.

## Principles

### PRN-000001 — Separate concerns to make reasoning tractable

Separate code into coherent concerns with explicit boundaries so each part can be understood and changed without carrying unrelated detail. [1], [2]

#### Why

Human reasoning is limited. Modular boundaries reduce the information needed for one decision at a time. Cross-cutting concerns do not disappear; a useful boundary makes their interactions visible instead of scattering them or pretending they are independent. [1], [2]

#### Practices

- Group related data and behavior, then expose only what clients need for the unit's purpose. [1]
- Split a concern only when the boundary reduces reasoning or coupling; otherwise keep it local and explicit. [1], [3]

### PRN-000002 — Hide change behind stable interfaces

Hide difficult or likely-to-change design decisions behind interfaces that expose only needed behavior and constraints. [1], [4]

#### Why

Exposed representations and algorithms spread change across clients. Information hiding localizes those decisions and lets clients use a module without learning its internals. Stability comes from revealing less, not from making an interface broadly generic. [1], [4]

#### Practices

- Place each difficult decision with the data and operations needed to keep it private. [4]
- Specify behavior and constraints; expose internal layouts, order, or algorithms only for a demonstrated client need. [1], [4]

#### Applicability

Information hiding can add indirection or runtime cost. Expose an internal decision only when measured constraints justify the tradeoff, and preserve the conceptual boundary where practical. [4], [5]

### PRN-000003 — Keep design proportional to the problem

Use the simplest design that meets known requirements and constraints; do not add layers or genericity solely for speculative needs. [1], [3]

#### Why

Unnecessary complexity makes code harder to understand and change. Proportional design can still protect plausible change points; it avoids implementing variation whose requirements are unknown. [3], [4]

#### Practices

- Add an abstraction only when it clarifies an existing concept, protects a concrete decision, or serves demonstrated variation. [1], [3], [4]
- Remove layers, hooks, configuration paths, and dependencies whose maintenance cost exceeds their current purpose. [3]

#### Applicability

High-assurance, regulated, or costly-to-change software may need more analysis, traceability, and safeguards. There, simplicity means making necessary complexity explicit and verifiable. [1]

### PRN-000004 — Make tradeoffs and rationale explicit

Evaluate consequential choices against stated requirements and quality attributes; record the assumptions, alternatives, and rationale behind the decision. [1], [5]

#### Why

Software qualities interact, so improving one can constrain another. Explicit criteria make tradeoffs reviewable, expose hidden assumptions, and let maintainers revisit a decision when its conditions change. [1], [5]

#### Practices

- Turn significant functional and quality needs into reviewable scenarios or constraints before comparing options. [1], [5]
- Record why consequential alternatives were selected or rejected, and verify the choice in proportion to risk. [1], [5]

#### Applicability

Do not document every local choice. Record decisions that are consequential, non-obvious, disputed, or expensive to reverse; increase formality with risk and assurance needs. [1]

### PRN-000053 — Make concurrency protocols explicit

When work can overlap, define which state is shared, how access is synchronized, and which ordering and progress guarantees callers may rely on. [1], [6]

#### Why

Concurrent units can interleave where sequential reasoning assumes one order. Correctness depends on atomicity, synchronization, scheduling, and preserving shared-state invariants; an incomplete protocol can produce races, deadlock, or starvation. [1], [6]

#### Practices

- Associate mutable shared state with an ownership or synchronization rule, and state the invariant that must hold whenever its protection is released. [6]
- Define wait and wake-up conditions, cancellation behavior, and acquisition ordering before composing concurrent operations. [1], [6]

### PRN-000054 — Honor published compatibility contracts

Evolve a public interface within its documented stability and versioning contract so existing consumers are not surprised by source, wire, or behavior changes. [7], [8]

#### Why

Consumers build code and operational assumptions around an interface. Incompatible changes impose migration cost even when signatures still compile, while an explicit version and deprecation contract lets consumers plan the transition. [7], [8]

#### Practices

- Evaluate source, wire, and semantic compatibility, including names, types, defaults, and visible behavior, before releasing an interface change. [7]
- For an intentional incompatible change, publish the corresponding new version and provide a documented deprecation or migration path before removal. [7], [8]

#### Applicability

Privately controlled consumers may support a different update contract than a broadly published API. State the stability level and upgrade expectations instead of assuming one compatibility policy fits every interface. [7], [8]

## References

1. [Guide to the Software Engineering Body of Knowledge (SWEBOK Guide), Version 4.0a][1] — `SRC-000001`
2. [EWD447: On the role of scientific thought][2] — `SRC-000005`
3. [What to look for in a code review][3] — `SRC-000003`
4. [On the criteria to be used in decomposing systems into modules][4] — `SRC-000004`
5. [Quality Attributes][5] — `SRC-000006`
6. [An Introduction to Programming with Threads][6] — `SRC-000033`
7. [AIP-180: Backwards compatibility][7] — `SRC-000034`
8. [Semantic Versioning 2.0.0][8] — `SRC-000035`

[1]: https://ieeecs-media.computer.org/media/education/swebok/swebok-v4.pdf
[2]: https://www.cs.utexas.edu/~EWD/transcriptions/EWD04xx/EWD447.html
[3]: https://google.github.io/eng-practices/review/reviewer/looking-for.html
[4]: https://kilthub.cmu.edu/articles/journal_contribution/On_the_criteria_to_be_used_in_decomposing_systems_into_modules/6607958
[5]: https://www.sei.cmu.edu/library/quality-attributes/
[6]: https://www.microsoft.com/en-us/research/publication/an-introduction-to-programming-with-threads/
[7]: https://google.aip.dev/180
[8]: https://semver.org/
