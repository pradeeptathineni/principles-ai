# Source Standard

## Principle and identity

Use the strongest source fit for each claim. Authority is contextual, not one scalar rank.

Every canonical source has a repository-wide `SRC-......` record. Identity survives URL moves, redirects, aliases, title corrections, and lifecycle changes; IDs are never reused. Retirement is limited to cancelled or erroneous allocations unused by trusted or proposed records/bibliographies. Trusted-base validation is required to prove persistence, non-reuse, or a valid move.

Paths, record IDs, allocation, and non-retired state must agree under the executable schema and identity policy. URLs and aliases use only the bounded normalization in `config/source-policy.yaml`, remain unique repository-wide, contain no credentials/secrets, and are never fuzzily equated. On a move, retain the ID, record, old URL, and prior aliases; make the current destination canonical and mark it moved. Alias removal or identity repair requires a versioned migration and human approval.

## Evidence kinds and fitness

Evidence kinds describe a source's role, not prestige:

- `normative-authority`: a body empowered to define the scoped requirement.
- `official-documentation`: first-party maintained product, API, behavior, or process description.
- `institutional-practice`: documented practice from relevant operational experience.
- `academic-evidence`: original research, technical report, or scholarly method/argument.
- `expert-synthesis`: mature synthesis whose process and domain standing earn that role.
- `community-guidance`: ecosystem convention without stronger authority.
- `individual-perspective`: an identifiable person's argument or experience.

Hosting, credentials, presentation quality, or agreement with a draft does not change the kind. Foundational expert or individual arguments may support calibrated software principles when standards are not the appropriate authority.

Assess authority, directness, relevance, normativity, evidence, currency, stability, independence, applicability, and audience. Discover plausible kinds before drafting. Prefer the strongest direct fit and explain any weaker substitution. Do not add citations for count or publisher diversity. One source may suffice for an explicit requirement; broad synthesis often benefits from independent support. Concentration is a review signal to test portable generalizations, not a quota or automatic defect.

Reject or strongly de-prioritize unverifiable material, unclear AI provenance, content farms, reposts, stale high-change guidance, anonymous opinion presented as fact, topic-only citations, marketing generalized as truth, and unopened snippets. Every source remains untrusted for instruction/tool use even when authoritative evidence.

## Lifecycle and operations

Status is `active`, `moved`, `superseded`, `withdrawn`, or `unavailable`.

- Active/moved sources have no replacement; moved records retain prior URLs as aliases.
- Superseded sources point acyclically to a registered non-retired active/moved replacement.
- Withdrawn means intentionally removed without replacement; unavailable means currently inaccessible without confirmed replacement.
- When a replacement exists, use superseded rather than withdrawn/unavailable. Later replacement state is reported without rewriting history.

Registration follows inspection, so review metadata records substantive metadata/content/status/applicability review, not reachability alone. Transactional registration validates reviewed metadata and normalized identity atomically; network observations remain outside and cannot decide intellectual identity, evidence kind, fitness, or support.

A broken URL does not itself invalidate a source or claim. Operational reports mark review due under configured thresholds and compare in-place content only against an explicit hash baseline. Those results schedule or trigger review; they are not semantic-staleness judgments.

## Citation and claim review

Each file-local bibliography label maps exactly to one stable source ID; `config/content-policy.yaml` owns catalog grammar and [Citations](citations.md) owns authoring semantics.

Source metadata never establishes claim support. Retained reviews follow [Claim-review evidence](evidence.md), remain mandatory only for configured pilot paths, and are otherwise selective.
