import { existsSync } from 'node:fs'
import { join } from 'node:path'
import canonicalize from 'canonicalize'
import { DiagnosticBag } from './diagnostics.js'
import { loadHistoricalPolicies, loadPolicies, validatePolicyTransition } from './policy.js'
import { SchemaValidator } from './schema.js'
import { loadYaml } from './yaml.js'
import { validateIdentityLedger, validateIdentityTransition } from './identity.js'
import { loadSources, validateSources, validateSourceTransition } from './sources.js'
import { discoverCorpusPaths, parseCorpus } from './markdown.js'
import { loadManifests, renderTaxonomy, validateTaxonomy } from './taxonomy.js'
import { loadEvaluatorConfigurations, loadEvidence, validateEvidence, validateEvidenceTransition } from './evidence.js'
import { validateInternalLinks } from './internal-links.js'
import { readCanonicalText, toRepoPath, walkCanonicalRepository } from './repository.js'

function validateCanonicalRepositoryText(root, bag) {
  const paths = ['AGENTS.md', 'README.md', '.gitignore', '.node-version', 'package.json', 'package-lock.json']
  for (const directory of ['.github', 'bin', 'config', 'docs', 'domains', 'evidence', 'evals', 'generated', 'prompts', 'scripts', 'sources', 'src', 'tests']) {
    paths.push(...walkCanonicalRepository(root, directory, bag, { optional: true }).map((path) => toRepoPath(root, path)).filter((path) => /\.(?:js|mjs|json|md|txt|ya?ml)$/.test(path)))
  }
  for (const path of [...new Set(paths)].sort()) {
    if (path.startsWith('docs/reviews/')) continue
    readCanonicalText(root, path, bag, { maxBytes: 4 * 1024 * 1024 })
  }
}

function loadState(root, bag, { complete = true } = {}) {
  if (complete) validateCanonicalRepositoryText(root, bag)
  const policies = loadPolicies(root, bag)
  const schema = new SchemaValidator(root, bag)
  let ledger = loadYaml(root, 'config/identity-ledger.yaml', bag)
  if (ledger) {
    if (schema.validate('identity_ledger', ledger, 'config/identity-ledger.yaml')) validateIdentityLedger(ledger, bag)
    else ledger = null
  }
  const sources = loadSources(root, schema, bag)
  const sourceRegistry = validateSources(sources, ledger, bag)
  const manifests = loadManifests(root, schema, bag)
  const corpusPaths = new Set(discoverCorpusPaths(root, bag))
  const corpus = parseCorpus(root, schema, manifests, sourceRegistry.byId, ledger, bag)
  validateTaxonomy(root, manifests, sourceRegistry.byId, corpusPaths, bag)
  const evaluatorConfigs = loadEvaluatorConfigurations(root, schema, bag)
  const evidence = loadEvidence(root, schema, bag)
  const evidenceByEntryId = validateEvidence(root, evidence, corpus.entryById, evaluatorConfigs, sourceRegistry.byId, bag)
  if (complete) validateInternalLinks(root, bag)
  return { policies, schema, ledger, sources, sourceById: sourceRegistry.byId, manifests, corpus, evaluatorConfigs, evidence, evidenceByEntryId }
}

function emptyLedger() {
  return {
    schema_version: 2,
    principles: { next_sequence: 1, allocated: [], retired: [] },
    sources: { next_sequence: 1, allocated: [], retired: [] },
    principle_relationships: []
  }
}

function loadTransitionBaseline(root, proposedSchema, bag) {
  const policies = loadHistoricalPolicies(root, bag)
  const ledgerPath = join(root, 'config', 'identity-ledger.yaml')
  let ledger = emptyLedger()
  if (existsSync(ledgerPath)) {
    const loaded = loadYaml(root, 'config/identity-ledger.yaml', bag, { historical: true })
    if (loaded && proposedSchema.validate('identity_ledger', loaded, 'config/identity-ledger.yaml')) ledger = loaded
    else bag.error('BASELINE_LEDGER_INVALID', 'Trusted baseline identity ledger cannot be used for transition validation.', 'config/identity-ledger.yaml')
  }
  const sources = loadSources(root, proposedSchema, bag)
  validateSources(sources, ledger, bag)
  const evidence = loadEvidence(root, proposedSchema, bag)
  if (!existsSync(ledgerPath) && (sources.length > 0 || evidence.length > 0)) {
    bag.error('BASELINE_LEDGER_MISSING', 'A trusted baseline with source or evidence records must contain an identity ledger.', 'config/identity-ledger.yaml')
  }
  const schema = existsSync(join(root, 'config', 'schema.yaml'))
    ? loadYaml(root, 'config/schema.yaml', bag, { metadata: false, historical: true })
    : null
  return { policies, ledger, sources, evidence, schema }
}

function validateSchemaTransition(baselineSchema, proposedSchema, bag) {
  if (!baselineSchema) {
    bag.info('SCHEMA_MIGRATION', 'The trusted baseline has no executable schema predecessor.', 'config/schema.yaml')
    return
  }
  if (baselineSchema.$id === proposedSchema?.$id) {
    if (canonicalize(baselineSchema) !== canonicalize(proposedSchema)) {
      bag.error('SCHEMA_CHANGE_WITHOUT_VERSION', `Schema ${proposedSchema.$id} changed without a new document ID.`, 'config/schema.yaml')
    }
  } else {
    bag.info('SCHEMA_MIGRATION', `Schema advances from ${baselineSchema.$id ?? `legacy version ${baselineSchema.version ?? 'unknown'}`} to ${proposedSchema?.$id ?? '<missing>'}.`, 'config/schema.yaml')
  }
}

export function validateRepository(root, options = {}) {
  const bag = new DiagnosticBag()
  const state = loadState(root, bag)
  let transitionStatus = 'not_evaluated'
  if (options.baselineRoot) {
    const baselineBag = new DiagnosticBag()
    const baseline = loadTransitionBaseline(options.baselineRoot, state.schema, baselineBag)
    validatePolicyTransition(baseline.policies, state.policies, bag)
    validateSchemaTransition(baseline.schema, state.schema.schema, bag)
    if (baselineBag.errorCount > 0) {
      bag.error('TRUSTED_BASELINE_INVALID', `Trusted baseline has ${baselineBag.errorCount} deterministic error(s); transition validation cannot proceed.`, '<trusted-baseline>')
    } else if (!state.ledger) {
      bag.error('TRANSITION_STATE_INVALID', 'Proposed identity ledger is invalid; transition validation cannot proceed.', 'config/identity-ledger.yaml')
    } else {
      validateIdentityTransition(baseline.ledger, state.ledger, bag)
      validateSourceTransition(baseline.sources, state.sources, baseline.ledger, state.ledger, bag, state.policies['source-policy'])
      validateEvidenceTransition(baseline.evidence, state.evidence, baseline.sources, state.sources, bag)
      transitionStatus = 'evaluated'
    }
  } else {
    bag.info('TRANSITION_NOT_EVALUATED', 'Trusted merge-base state was unavailable; identity/source transition checks are not_evaluated and snapshot validity does not prove historical non-reuse or valid moves.', '<trusted-baseline>')
  }
  const taxonomyA = renderTaxonomy(state.manifests, state.corpus.documents)
  const replayBag = new DiagnosticBag()
  const replay = loadState(root, replayBag, { complete: false })
  if (bag.errorCount === 0 && replayBag.errorCount > 0) bag.error('GENERATION_REPLAY_INVALID', 'Independent canonical-input replay failed during reproducibility checking.', 'generated/taxonomy.yaml')
  const taxonomyB = renderTaxonomy(replay.manifests, replay.corpus.documents)
  if (taxonomyA !== taxonomyB) bag.error('GENERATION_NONDETERMINISTIC', 'Taxonomy generation is not reproducible.', 'generated/taxonomy.yaml')
  return { bag, state, transitionStatus, generated: { taxonomy: taxonomyA } }
}

export { loadState }
