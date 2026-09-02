const owners = {
  yaml: ['yaml_and_frontmatter_parse', 'duplicate_yaml_key', 'safe_yaml_construction', 'forbidden_yaml_anchor_alias_merge_or_custom_tag', 'bounded_input_bytes_and_yaml_nodes'],
  schema: ['executable_schema_with_format_assertion', 'unknown_canonical_field', 'supported_schema_and_policy_version'],
  repository: ['canonical_text_encoding_normalization_and_newlines', 'internal_link_resolution'],
  taxonomy: ['manifest_path_and_registration', 'taxonomy_identity_uniqueness_scope', 'taxonomy_lifecycle_consistency', 'taxonomy_transition_against_trusted_base', 'protected_intent_transition_against_trusted_base', 'deprecated_scope_without_corpus', 'protected_subdomain_presence_and_status'],
  markdown: ['corpus_path_frontmatter_agreement', 'corpus_review_hash_and_transition', 'heading_and_section_grammar', 'title_projection_and_exact_equality', 'structural_citation_presence', 'citation_run_grammar', 'claim_block_link_title_policy', 'reference_resolution', 'bibliography_one_to_one_source_mapping', 'advisory_word_economy'],
  identity: ['principle_and_source_identity', 'identity_ledger_sequence_and_retirement', 'identity_ledger_transition_against_trusted_base', 'principle_relationship_direction_and_acyclicity', 'principle_relationship_transition_against_trusted_base'],
  sources: ['source_filename_and_ledger_agreement', 'source_record_persistence_against_trusted_base', 'source_url_registry_uniqueness', 'source_url_normalized_storage', 'source_url_transition_against_trusted_base', 'source_url_userinfo_and_fragment_policy', 'source_lifecycle_consistency', 'source_supersession_acyclicity'],
  evidence: ['evidence_filename_and_entry_agreement', 'evaluator_configuration_schema_path_and_i_json_input', 'claim_review_coverage_and_unique_roles', 'claim_review_source_and_locator_agreement', 'evaluator_configuration_reference_and_hash_agreement', 'claim_review_hash_match', 'claim_review_publishable_outcome'],
  generation: ['generated_output_reproducibility']
}

export const DETERMINISTIC_CHECK_IMPLEMENTATIONS = Object.freeze(Object.fromEntries(
  Object.entries(owners).flatMap(([owner, checks]) => checks.map((check) => [check, owner]))
))

export function validateCheckRegistry(validationPolicy, bag) {
  const configured = validationPolicy?.classes?.deterministic?.checks ?? []
  const configuredSet = new Set(configured)
  for (const check of configured) {
    if (!DETERMINISTIC_CHECK_IMPLEMENTATIONS[check]) bag.error('DETERMINISTIC_CHECK_UNIMPLEMENTED', `Configured deterministic check ${check} has no implementation owner.`, 'config/validation.yaml')
  }
  for (const check of Object.keys(DETERMINISTIC_CHECK_IMPLEMENTATIONS)) {
    if (!configuredSet.has(check)) bag.error('DETERMINISTIC_CHECK_UNCONFIGURED', `Implemented deterministic check ${check} is missing from validation policy.`, 'config/validation.yaml')
  }
}
