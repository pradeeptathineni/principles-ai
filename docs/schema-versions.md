# Schema and Policy Versions

## Live contract

Schema and policy versions are compatibility boundaries. Tooling supports only versions implemented and declared in `config/validation.yaml`; unknown versions and policy fields fail. Canonical data is never silently coerced, reinterpreted, or upgraded.

A version change requires:

1. a documented reason, affected record set, and compatibility impact;
2. an explicit deterministic migration for every affected canonical record;
3. rationale and human approval for any intentional information loss;
4. updated schemas, policies, templates, fixtures, workflows, implementation, and tests as applicable; and
5. validation of the fully migrated repository before old-version support is removed.

When no affected records exist, record that fact instead of inventing fixtures or provenance. The proposed policy cannot redefine its trusted baseline or waive its own transition checks.

## Review boundary

Use trusted merge-base policy and state to classify schema, policy, identity, source, taxonomy, protected-intent, and corpus transitions. Without that baseline, snapshot checks may run but transition results remain `not_evaluated`.

Keep responsibilities separate:

- Executable schemas and policies define accepted structure and deterministic behavior.
- Migration code performs explicit mechanical transformation.
- Semantic review checks whether meaning, intent, authority, and workflow behavior are preserved.
- Humans approve schema/policy/governance changes and any intentional loss.

Do not use a version bump to hide same-version policy weakening, semantic change, fabricated provenance, or an otherwise required human decision.

## Format assertion

Repository validation treats JSON Schema Draft 2020-12 `format` as an assertion. Implementations must validate configured formats, including `date` and `uri`; annotation-only handling is nonconforming.

## Progressive disclosure

Current supported versions and exact transition rules live in executable configuration. Completed migration rationale is retained in [Schema and policy version history](schema-version-history.md). Load that history only when a new change depends on a prior migration or when auditing old compatibility decisions; routine schema/policy work uses this contract, the affected configuration/code, canonical records, and tests.

## Derived context export version 2

Context exports use derived `schema_version: 2` for explicit lifecycle, source-input bindings, profile omissions, reference-only minimal output, and a cross-profile selection digest with optional expected-digest checking. The semantic owner and digest procedure are in [Context](standards/context.md); `src/context.js`, the CLI, and context fixtures implement the contract.

This replaces lossy derived version 1 output. Existing exports are disposable and must be regenerated from canonical inputs; do not silently relabel or upgrade a version 1 artifact. No canonical record or policy version changes, no canonical data migration, and no selection or activation policy change are part of this extension. A consumer must explicitly support version 2 before accepting it; real Context integration remains a separate consumer gate.
