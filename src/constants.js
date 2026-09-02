export const SUPPORTED = Object.freeze({
  schemaId: 'https://principles.local/config/schema/v3',
  records: Object.freeze({
    domain_manifest: 3,
    corpus_frontmatter: 4,
    source_record: 3,
    claim_review_record: 3,
    identity_ledger: 2,
    evaluator_configuration_record: 2
  }),
  policies: Object.freeze({
    'content-policy': 4,
    'evidence-policy': 3,
    'identity-policy': 2,
    'source-policy': 5,
    'taxonomy-policy': 4,
    validation: 4
  })
})

export const LIMITS = Object.freeze({
  yamlBytes: 2 * 1024 * 1024,
  markdownBytes: 4 * 1024 * 1024,
  yamlNodes: 100_000,
  externalConcurrency: 4,
  externalTimeoutMs: 10_000,
  externalRedirects: 5,
  externalResponseBytes: 1024 * 1024,
  externalRetries: 1
})

export const RECORD_DEFINITIONS = Object.freeze({
  domain_manifest: 'domain_manifest',
  corpus_frontmatter: 'corpus_frontmatter',
  source_record: 'source_record',
  claim_review_record: 'claim_review_record',
  identity_ledger: 'identity_ledger',
  evaluator_configuration_record: 'evaluator_configuration_record'
})
