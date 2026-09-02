# Content Workflow

This is the complete routine path for creating or revising one corpus file. A prompt such as `Create domains/coding/design.md` is sufficient.

## 1. Establish the target

Read the target manifest, existing target if any, and only the neighboring scopes needed to prevent duplication.

If the user names an existing registered domain or subdomain and its definition does not need to change, research its fit and accept that unchanged target as an agent-owned prerequisite. The request itself supplies the target judgment; a separate taxonomy review record or approval stop adds no information.

Stop for human judgment when reaching the outcome requires a new scope, rename, merge, material rescope, deprecation, or protected-intent change. Present the exact change and its consequences. See [Taxonomy](../standards/taxonomy.md) only in that case.

## 2. Discover the evidence landscape

Research before choosing principles. Start with the kinds of evidence the topic could support: normative authority, official documentation, institutional practice, academic evidence, expert synthesis, community guidance, and individual perspective. Open and read the relevant source content.

Map candidate claims to the strongest available claim-specific fit. A professional host, famous author, polished page, or agreement with the draft does not establish authority. Weaker evidence may fill a legitimate role, but it must not silently replace stronger available evidence. Seek disagreement and important limits before synthesis.

Reuse matching `SRC-......` identities; otherwise allocate and register sources. Follow [Research](../standards/research.md) and [Sources](../standards/sources.md) when source choice is uncertain, contested, or operationally complex.

## 3. Select and write principles

Choose principles from the evidence landscape, not from model intuition followed by citation hunting. Check existing corpus identities and nearby scopes before allocating new `PRN-......` IDs.

Say everything necessary and useful, but nothing merely because the format permits it.

- Make the title memorable and the statement precise.
- Make Why explain the mechanism or consequence; do not restate the statement.
- Include two or more Practices only when each changes behavior.
- Add Applicability, Goals, or Tags only when each earns its presence.
- Prefer one rationale paragraph. Add another only for distinct reasoning that should stand alone.

Configured word expectations are warnings, not hard caps. Longer text is acceptable when its additional value is clear; `config/content-policy.yaml` is the single source for current thresholds.

Every statement, top-level Why paragraph, Practice item, and Applicability paragraph ends in a claim-level citation. Use `[1]` or `[1], [2]`. Local bibliography entries map human-readable sources to stable source IDs. [Writing](../standards/writing.md), [Content](../standards/content.md), and [Citations](../standards/citations.md) provide uncommon-case details; `config/content-policy.yaml` owns exact syntax.

## 4. Review and provenance

Keep changed content `draft` with null review metadata while iterating. For paths required by `config/evidence-policy.yaml`, maintain a compact evidence record per principle; elsewhere add one when impact, novelty, disagreement, or a weak evidence landscape makes provenance worth its cost. A record stores review metadata once, then one hash/outcome/source-locator mapping per claim.

Evaluate exact entailment, calibration, source fitness, material qualifiers, and disagreement. Deterministic validation checks structure and consistency; it does not prove semantic quality. Run operational source checks when current reachability or state matters. See [Evidence](../standards/evidence.md) and [Review](review-content.md) for detailed or disputed cases.

## 5. Activate

Run repository validation and relevant tests. Present the exact reviewed principle package for the single normal human gate. After approval, set `active`, `last_reviewed`, and the exact semantic hash, then rerun validation. Do not ask again for content authorization.

When a multi-file outcome workflow invokes this workflow, return the reviewed draft to its coordinator. The coordinator may batch exact activation decisions, but it must not weaken or bypass this gate.

Report source limitations, unresolved disagreement, operational uncertainty, validation class, and any remaining genuine gate. Stop at the requested file; never infer authorization to generate neighboring corpus.
