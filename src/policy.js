import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import canonicalize from 'canonicalize'
import { SUPPORTED } from './constants.js'
import { loadYaml } from './yaml.js'

const expectedShapeFingerprints = Object.freeze({
  'content-policy': '6cfe2a5f4d2340f04f5f6ae969359823880b9b1fe0fdfef8c00465fc1edff828',
  'evidence-policy': '6d5f35136f0bc5284c8b6a27a24badc3fa769e7bc0d4955f26e53bace016a94d',
  'identity-policy': 'd403ff29ce9411c31c0d38ce93599a32231ef8b808cfc1969052d66bbc7eee54',
  'source-policy': '813a8b4a41ff7aa2fd5f21f1d07caff10853f6aeffc3f67548109246bc3075fe',
  'taxonomy-policy': 'e381778210d125b33fea3c45ccfc1c0b41ba8843fd4c4c32d4dc88dec4642ef2',
  validation: '11b9d4a47f7cfc0cb94770696521802bf3db1ee9a7f9d848ebf7791be7c30199'
})

const expectedValueFingerprints = Object.freeze({
  'content-policy': '07ed632614f5b7302ea782f93c8f3acaa90ffa1dbf3f9eb07f94029996775993',
  'evidence-policy': 'b2a65d438c149786121c144837aa177f4186fcc6f813af0dc7f3dba8640c356b',
  'identity-policy': 'ee88ae4bd1264d34a97535457856a04b353627ebd81a17bc95f7aefbf7882279',
  'source-policy': 'b9c6e773909c98001d30f90e0a07d378f6b06ac07e3f3564f9006d8be4e1e78d',
  'taxonomy-policy': '9ecc06a30213ea82905461c44e4300a8777710c92e56e1c9ca1d4d615eb71ff3',
  validation: '48f776bd39ec1a26ab8835b82359674f92ed6618f5b6605a3b790113883172fd'
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
    version: 0, policy_precedence: { executable_structure: 0, semantic_meaning: 0 }, file_types: '*', path_frontmatter_mapping: '*', review_state: '*', identity: '*', document_grammar: '*', entry_grammar: '*', citations: '*', bibliography: '*', tags: '*', markdown: '*', title_comparison: '*', word_economy: '*'
  },
  'source-policy': { version: 0, registry: '*', urls: '*', url_transition_validation: '*', lifecycle: '*', retirement_transition_validation: '*', operational_observation: '*', claim_reviews: '*', evidence_kinds: '*' },
  'evidence-policy': { version: 0, records: '*', coverage: '*', adoption: '*', outcomes: '*', reviewer_configuration: '*', invalidation: '*' },
  'taxonomy-policy': { version: 0, manifests: '*', identity_scope: '*', universal_files: '*', naming: '*', lifecycle: '*', explicit_target_request: '*', transition_validation: '*', human_intent: '*', registration: '*', principle_identity: '*' },
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
    [policies.validation?.trusted_baseline?.identity_source_taxonomy_and_corpus_transition_state, 'merge_base', 'validation/trusted_baseline/identity_source_taxonomy_and_corpus_transition_state'],
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
}
