import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import canonicalize from 'canonicalize'
import { SUPPORTED } from './constants.js'
import { loadYaml } from './yaml.js'

const expectedShapeFingerprints = Object.freeze({
  'content-policy': 'aac0b5812c448b4f0dc0a48264de2075085b476aedb6ce0afa9d196f7fb15185',
  'evidence-policy': 'cf5b105456eefc73b551307500d0d9e560e9ff8dcd20146e94c2da38452c9f19',
  'identity-policy': 'd403ff29ce9411c31c0d38ce93599a32231ef8b808cfc1969052d66bbc7eee54',
  'source-policy': 'bcd259a9c7705e8e4c0ca8a2506ecfb0dc7c22b9aaf54ddb2c49369d75348499',
  'taxonomy-policy': '6243fb9a292b541f5c7ca20c6c663d10c4b931def41922ed103fa8039a628a07',
  validation: '55a43d3c3418e327311cbd5546c422efb73661830b1c72b3177653ebbf31ead1'
})

const expectedValueFingerprints = Object.freeze({
  'content-policy': '2eae83d8fb7e99df31ddb99aa59e3d8afec87a1ac84211d582c48f2a8e7ce040',
  'evidence-policy': 'b0072ddb98c160fc1d8e252aab3e3ee4d5509fe553ffce8a4e2b81a50e195758',
  'identity-policy': 'ee88ae4bd1264d34a97535457856a04b353627ebd81a17bc95f7aefbf7882279',
  'source-policy': 'c7b87517014ff11f2abf1ca0f169f7b37c0e68ff4b793d764b198c36f36176e2',
  'taxonomy-policy': 'b238149714a5598739770bb65d0a2a83674726513c3a9787913e8185d1fab2c2',
  validation: '7639042d751b4e7d94f37e359fcff98a21ec176bc3f080e87808f67c93ffa897'
})

const shapes = {
  'identity-policy': {
    version: 0, ledger: 0,
    allocation_sets: { allocated_meaning: 0, retired_must_be_subset_of_allocated: 0, issued_sequences_start_at: 0, issued_sequences_below_next_sequence_are_contiguous: 0, next_sequence_must_equal_highest_allocated_sequence_plus_one: 0, empty_set_next_sequence: 0, allocated_and_retired_arrays_sorted_by_numeric_sequence: 0, reuse_allowed: 0 },
    transition_validation: { required_in_pull_request_ci: 0, baseline: 0, baseline_policy_source: 0, unavailable_baseline_result: 0, unavailable_baseline_must_not_be_reported_as_full_identity_validation: 0, allocated_ids_must_be_monotonic: 0, retired_ids_must_be_monotonic: 0, next_sequence_must_not_decrease: 0, newly_allocated_ids_must_be_exact_contiguous_suffix_from_baseline_next_sequence: 0, existing_relationships_must_not_be_deleted_or_rewritten: 0, exceptional_repair_requires_explicit_versioned_migration_and_human_approval: 0 },
    principles: { active_heading_id_must_be_allocated_and_not_retired: 0, allocated_id_without_heading_allowed: 0, retired_id_must_not_appear_as_heading: 0 },
    sources: { registry_id_must_be_allocated_and_not_retired: 0, retired_allocation_must_not_have_record_or_bibliography_use: 0, lifecycle_change_uses_status_not_retirement: 0 },
    relationships: { allowed_types: 0, endpoints_must_be_allocated_principle_ids: 0, duplicate_relationships_allowed: 0, self_relationships_allowed: 0, directed_cycles_allowed: 0, move_creates_relationship: 0, split: { relationship_type: 0, from: 0, to: 0, original_must_be_retired: 0, minimum_distinct_children_per_original: 0, children_must_be_newly_allocated_in_same_transition: 0, original_must_be_allocated_and_nonretired_in_baseline: 0 }, merge: { relationship_type: 0, from: 0, to: 0, replaced_id_must_be_retired: 0, replaced_ids_must_be_allocated_and_nonretired_in_baseline: 0, survivor_must_be_allocated_and_nonretired_in_baseline: 0, survivor_must_remain_nonretired_in_merge_transition: 0 }, historical_target_may_later_be_retired: 0, canonical_order: 0 }
  },
  'content-policy': {
    version: 0, policy_precedence: { executable_structure: 0, semantic_meaning: 0 }, file_types: '*', path_frontmatter_mapping: '*', identity: '*', document_grammar: '*', entry_grammar: '*', citations: '*', bibliography: '*', tags: '*', markdown: '*', title_comparison: '*'
  },
  'source-policy': { version: 0, registry: '*', urls: '*', url_transition_validation: '*', lifecycle: '*', retirement_transition_validation: '*', operational_observation: '*', claim_reviews: '*' },
  'evidence-policy': { version: 0, records: '*', coverage: '*', adoption: '*', outcomes: '*', reviewer_configuration: '*', invalidation: '*' },
  'taxonomy-policy': { version: 0, manifests: '*', identity_scope: '*', universal_files: '*', naming: '*', lifecycle: '*', taxonomy_review: '*', human_intent: '*', registration: '*', principle_identity: '*' },
  validation: { version: 0, schema_validation: '*', yaml_loading: '*', canonical_text: '*', policy_loading: '*', trusted_baseline: '*', classes: '*', severity: '*', diagnostic_language: '*', internal_links: '*' }
}

function checkShape(value, shape, bag, path, pointer = '') {
  if (shape === '*' || shape === 0) return
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  for (const key of Object.keys(value)) {
    if (!(key in shape)) bag.error('POLICY_UNKNOWN_FIELD', `Unknown policy field ${pointer}/${key}.`, path)
    else checkShape(value[key], shape[key], bag, path, `${pointer}/${key}`)
  }
}

export function policyShapeFingerprint(value) {
  const lines = []
  function walk(item, pointer = '') {
    if (Array.isArray(item)) {
      for (const child of item) if (child && typeof child === 'object') walk(child, `${pointer}/*`)
    } else if (item && typeof item === 'object') {
      const keys = Object.keys(item).sort()
      lines.push(`${pointer || '/'}:${keys.join(',')}`)
      for (const key of keys) walk(item[key], `${pointer}/${key}`)
    }
  }
  walk(value)
  return createHash('sha256').update(lines.sort().join('\n'), 'utf8').digest('hex')
}

export function policyValueFingerprint(value) {
  return createHash('sha256').update(canonicalize(value), 'utf8').digest('hex')
}

function validateTrustedSelectors(policies, bag) {
  const checks = [
    [policies.validation?.trusted_baseline?.pull_request_source, 'merge_base_with_trusted_target_branch', 'validation/trusted_baseline/pull_request_source'],
    [policies.validation?.trusted_baseline?.policy_for_policy_change_review, 'merge_base', 'validation/trusted_baseline/policy_for_policy_change_review'],
    [policies.validation?.trusted_baseline?.identity_and_source_transition_state, 'merge_base', 'validation/trusted_baseline/identity_and_source_transition_state'],
    [policies['identity-policy']?.transition_validation?.baseline, 'trusted_merge_base', 'identity-policy/transition_validation/baseline'],
    [policies['identity-policy']?.transition_validation?.baseline_policy_source, 'trusted_merge_base', 'identity-policy/transition_validation/baseline_policy_source'],
    [policies['source-policy']?.url_transition_validation?.baseline, 'trusted_merge_base', 'source-policy/url_transition_validation/baseline']
  ]
  for (const [actual, expected, pointer] of checks) {
    if (actual !== expected) bag.error('TRUSTED_BASELINE_POLICY', `${pointer} must remain ${expected}.`, `config/${pointer.split('/')[0]}.yaml`)
  }
}

export function loadPolicies(root, bag) {
  const policies = {}
  for (const [name, version] of Object.entries(SUPPORTED.policies)) {
    const path = `config/${name}.yaml`
    const value = loadYaml(root, path, bag, { metadata: false })
    policies[name] = value
    if (!value) continue
    if (value.version !== version) bag.error('POLICY_VERSION', `Unsupported ${name} version ${String(value.version)}; expected ${version}.`, path)
    checkShape(value, shapes[name], bag, path)
    if (policyShapeFingerprint(value) !== expectedShapeFingerprints[name]) bag.error('POLICY_SHAPE', `${name} fields do not match the closed shape implemented for version ${version}; update the version and tooling through an explicit migration.`, path)
    if (policyValueFingerprint(value) !== expectedValueFingerprints[name]) bag.error('POLICY_VALUE_DRIFT', `${name} values do not match the exact contract implemented for version ${version}; change the version and tooling through an explicit migration.`, path)
  }
  const validationVersions = policies.validation?.policy_loading?.supported_versions
  if (validationVersions) {
    for (const [name, version] of Object.entries(SUPPORTED.policies)) {
      if (validationVersions[name] !== version) bag.error('POLICY_VERSION_DRIFT', `validation.yaml supports ${name} ${String(validationVersions[name])}; tooling supports ${version}.`, 'config/validation.yaml')
    }
  }
  if (policies.validation?.schema_validation?.schema_document_id !== SUPPORTED.schemaId) {
    bag.error('SCHEMA_ID_DRIFT', 'validation.yaml schema document ID does not match the supported schema.', 'config/validation.yaml')
  }
  validateTrustedSelectors(policies, bag)
  return policies
}

export function loadHistoricalPolicies(root, bag) {
  const policies = {}
  for (const name of Object.keys(SUPPORTED.policies)) {
    const path = `config/${name}.yaml`
    if (!existsSync(join(root, path))) continue
    policies[name] = loadYaml(root, path, bag, { metadata: false, historical: true })
  }
  return policies
}

export function validatePolicyTransition(baselinePolicies, proposedPolicies, bag) {
  for (const [name, proposed] of Object.entries(proposedPolicies)) {
    const baseline = baselinePolicies[name]
    if (!baseline) {
      bag.info('POLICY_MIGRATION', `${name} has no trusted-baseline predecessor and is treated as an explicit bootstrap policy addition.`, `config/${name}.yaml`)
      continue
    }
    if (!Number.isInteger(baseline.version) || !Number.isInteger(proposed?.version)) {
      bag.error('POLICY_TRANSITION_VERSION', `${name} requires integer baseline and proposed versions.`, `config/${name}.yaml`)
      continue
    }
    if (baseline.version === proposed.version) {
      if (canonicalize(baseline) !== canonicalize(proposed)) {
        bag.error('POLICY_CHANGE_WITHOUT_VERSION', `${name} changed under version ${proposed.version}; policy changes require an explicit versioned migration.`, `config/${name}.yaml`)
      }
    } else if (baseline.version > proposed.version) {
      bag.error('POLICY_VERSION_REGRESSION', `${name} regressed from version ${baseline.version} to ${proposed.version}.`, `config/${name}.yaml`)
    } else {
      bag.info('POLICY_MIGRATION', `${name} advances from trusted-baseline version ${baseline.version} to ${proposed.version}.`, `config/${name}.yaml`)
    }
  }
  const baselineChecks = baselinePolicies.validation?.classes?.deterministic?.checks ?? []
  const proposedChecks = new Set(proposedPolicies.validation?.classes?.deterministic?.checks ?? [])
  for (const check of baselineChecks) {
    if (!proposedChecks.has(check)) bag.error('TRUSTED_CHECK_REMOVED', `Proposed policy removed trusted deterministic check ${check}.`, 'config/validation.yaml')
  }
}
