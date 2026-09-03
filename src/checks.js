import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { classifyArchitectureChanges, validateArchitectureReviewPolicy } from './architecture.js'
import { validateEvidence } from './evidence.js'
import { validateIdentityLedger, validateIdentityTransition } from './identity.js'
import { validateInternalLinks } from './internal-links.js'
import { parseCorpus, validateCorpusTransition } from './markdown.js'
import { readCanonicalText } from './repository.js'
import { SchemaValidator } from './schema.js'
import { validateSources, validateSourceTransition } from './sources.js'
import { renderTaxonomy, validateTaxonomy, validateTaxonomyTransition } from './taxonomy.js'
import { validateWorkflowModel } from './workflow.js'
import { loadYaml } from './yaml.js'
import { applyRepositoryTransaction } from './transaction.js'
import {
  buildActivationManifest,
  buildActivationPackage,
  buildActivationReview,
  buildDomainPreparation,
  buildEvidenceScaffold,
  buildRunCheckpoint,
  buildSourceUsage,
  materializeContents,
  registerSources,
  synchronizeCitations,
  synchronizeDomainCitations,
  verifyRunCheckpoint
} from './mutation.js'

const implementations = {}

function register(owner, run, positiveTests, negativeTests, checks) {
  for (const check of checks) implementations[check] = Object.freeze({ owner, run, positiveTests, negativeTests })
}

register('yaml', loadYaml, ['tests/yaml.test.js'], ['tests/yaml.test.js'], [
  'yaml_and_frontmatter_parse', 'duplicate_yaml_key', 'safe_yaml_construction',
  'forbidden_yaml_anchor_alias_merge_or_custom_tag', 'bounded_input_bytes_and_yaml_nodes'
])
register('schema', SchemaValidator, ['tests/schema.test.js'], ['tests/schema.test.js'], [
  'executable_schema_with_format_assertion', 'unknown_canonical_field', 'supported_schema_and_policy_version'
])
register('repository', readCanonicalText, ['tests/repository.test.js'], ['tests/repository.test.js'], ['canonical_text_encoding_normalization_and_newlines'])
register('internal-links', validateInternalLinks, ['tests/internal-links.test.js'], ['tests/internal-links.test.js'], ['internal_link_resolution'])
register('taxonomy-snapshot', validateTaxonomy, ['tests/taxonomy.test.js'], ['tests/taxonomy.test.js'], [
  'manifest_path_and_registration', 'taxonomy_identity_uniqueness_scope', 'taxonomy_lifecycle_consistency',
  'deprecated_scope_without_corpus', 'protected_subdomain_presence_and_status'
])
register('taxonomy-transition', validateTaxonomyTransition, ['tests/taxonomy.test.js'], ['tests/taxonomy.test.js'], [
  'taxonomy_transition_against_trusted_base', 'protected_intent_transition_against_trusted_base'
])
register('markdown', parseCorpus, ['tests/markdown.test.js'], ['tests/markdown.test.js'], [
  'corpus_path_frontmatter_agreement', 'heading_and_section_grammar', 'title_projection_and_exact_equality',
  'structural_citation_presence', 'citation_run_grammar', 'claim_block_link_title_policy', 'reference_resolution',
  'bibliography_one_to_one_source_mapping', 'advisory_word_economy'
])
register('corpus-transition', validateCorpusTransition, ['tests/markdown.test.js'], ['tests/markdown.test.js'], ['corpus_review_hash_and_transition'])
register('identity-snapshot', validateIdentityLedger, ['tests/identity.test.js'], ['tests/identity.test.js'], [
  'principle_and_source_identity', 'identity_ledger_sequence_and_retirement', 'principle_relationship_direction_and_acyclicity'
])
register('identity-transition', validateIdentityTransition, ['tests/identity.test.js'], ['tests/identity.test.js'], [
  'identity_ledger_transition_against_trusted_base', 'principle_relationship_transition_against_trusted_base'
])
register('sources-snapshot', validateSources, ['tests/sources.test.js'], ['tests/sources.test.js'], [
  'source_filename_and_ledger_agreement', 'source_url_registry_uniqueness', 'source_url_normalized_storage',
  'source_url_userinfo_and_fragment_policy', 'source_lifecycle_consistency', 'source_supersession_acyclicity'
])
register('sources-transition', validateSourceTransition, ['tests/sources.test.js'], ['tests/sources.test.js'], [
  'source_record_persistence_against_trusted_base', 'source_url_transition_against_trusted_base'
])
register('evidence-snapshot', validateEvidence, ['tests/evidence.test.js'], ['tests/evidence.test.js'], [
  'evidence_filename_and_entry_agreement', 'evaluator_configuration_schema_path_and_i_json_input',
  'claim_review_coverage_and_unique_roles', 'claim_review_source_and_locator_agreement',
  'evaluator_configuration_reference_and_hash_agreement', 'claim_review_hash_match', 'claim_review_publishable_outcome'
])
register('generation', renderTaxonomy, ['tests/integration.test.js'], ['tests/integration.test.js'], ['generated_output_reproducibility'])
register('workflow-model', validateWorkflowModel, ['tests/workflow.test.js'], ['tests/workflow.test.js'], ['workflow_model_consistency', 'workflow_route_reachability'])
register('architecture-review', classifyArchitectureChanges, ['tests/architecture.test.js'], ['tests/architecture.test.js'], ['architecture_change_classification'])
register('domain-preparation', buildDomainPreparation, ['tests/mutation.test.js'], ['tests/mutation.test.js'], ['domain_preparation_workset', 'task_scoped_gate_reporting'])
register('source-usage-reporting', buildSourceUsage, ['tests/mutation.test.js'], ['tests/mutation.test.js'], ['source_usage_reporting'])
register('repository-transaction', applyRepositoryTransaction, ['tests/mutation.test.js'], ['tests/mutation.test.js'], ['transactional_mutation_preconditions_and_rollback', 'canonical_writer_serialization'])
register('source-registration', registerSources, ['tests/mutation.test.js'], ['tests/mutation.test.js'], ['atomic_identity_and_source_registration', 'batch_source_registration'])
register('content-materialization', materializeContents, ['tests/mutation.test.js'], ['tests/mutation.test.js'], ['batch_content_materialization'])
register('citation-synchronization', synchronizeCitations, ['tests/mutation.test.js'], ['tests/mutation.test.js'], ['citation_bibliography_synchronization'])
register('domain-citation-synchronization', synchronizeDomainCitations, ['tests/mutation.test.js'], ['tests/mutation.test.js'], ['domain_citation_synchronization'])
register('evidence-scaffold', buildEvidenceScaffold, ['tests/mutation.test.js'], ['tests/mutation.test.js'], ['evidence_review_invalidation_scaffold'])
register('run-checkpoint', buildRunCheckpoint, ['tests/mutation.test.js'], ['tests/mutation.test.js'], ['run_checkpoint_binding'])
register('run-checkpoint-verification', verifyRunCheckpoint, ['tests/mutation.test.js'], ['tests/mutation.test.js'], ['run_checkpoint_invalidation'])
register('activation-package', buildActivationPackage, ['tests/mutation.test.js'], ['tests/mutation.test.js'], ['activation_decision_package_binding_verification'])
register('activation-review', buildActivationReview, ['tests/mutation.test.js'], ['tests/mutation.test.js'], ['activation_human_review_projection'])
register('activation-manifest', buildActivationManifest, ['tests/mutation.test.js'], ['tests/mutation.test.js'], ['activation_manifest_derivation'])

export const DETERMINISTIC_CHECK_IMPLEMENTATIONS = Object.freeze(implementations)

export function validateCheckRegistry(validationPolicy, bag, root = process.cwd()) {
  const configured = validationPolicy?.classes?.deterministic?.checks ?? []
  const configuredSet = new Set(configured)
  for (const check of configured) {
    const implementation = DETERMINISTIC_CHECK_IMPLEMENTATIONS[check]
    if (!implementation) {
      bag.error('DETERMINISTIC_CHECK_UNIMPLEMENTED', `Configured deterministic check ${check} has no implementation owner.`, 'config/validation.yaml')
      continue
    }
    if (typeof implementation.run !== 'function') bag.error('DETERMINISTIC_CHECK_NOT_CALLABLE', `Configured deterministic check ${check} is not backed by a callable implementation.`, 'config/validation.yaml')
    for (const [kind, paths] of [['positive', implementation.positiveTests], ['negative', implementation.negativeTests]]) {
      if (!paths?.length) bag.error('DETERMINISTIC_CHECK_TEST_COVERAGE', `Configured deterministic check ${check} has no declared ${kind} test coverage.`, 'config/validation.yaml')
      for (const path of paths ?? []) if (!existsSync(join(root, path))) bag.error('DETERMINISTIC_CHECK_TEST_MISSING', `Configured deterministic check ${check} references missing test ${path}.`, 'config/validation.yaml')
    }
  }
  for (const check of Object.keys(DETERMINISTIC_CHECK_IMPLEMENTATIONS)) {
    if (!configuredSet.has(check)) bag.error('DETERMINISTIC_CHECK_UNCONFIGURED', `Implemented deterministic check ${check} is missing from validation policy.`, 'config/validation.yaml')
  }
  validateArchitectureReviewPolicy(root, validationPolicy, bag)
}
