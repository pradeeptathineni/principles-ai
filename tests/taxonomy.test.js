import test from 'node:test'
import assert from 'node:assert/strict'
import { DiagnosticBag } from '../src/diagnostics.js'
import { validateTaxonomy, validateTaxonomyTransition } from '../src/taxonomy.js'

function manifest(overrides = {}) {
  return {
    schema_version: 5,
    id: 'coding',
    code: 'COD',
    title: 'Coding',
    taxonomy_status: 'proposed',
    description: 'Coding guidance.',
    human_intent: { required_subdomains: [], priorities: [], exclusions: [], scope_notes: [] },
    subdomains: [{ id: 'design', code: 'DES', title: 'Design', status: 'proposed', origin: 'research' }],
    ...overrides
  }
}

test('snapshot taxonomy validation needs no review sidecar', () => {
  const value = manifest({ taxonomy_status: 'accepted' })
  value.subdomains[0].status = 'accepted'
  const bag = new DiagnosticBag()
  validateTaxonomy('/', [{ path: 'domains/coding/domain.yaml', value }], new Set(), bag)
  assert.equal(bag.errorCount, 0)
})

test('trusted taxonomy transitions preserve identities and classify human gates', () => {
  const before = manifest()
  const accepted = structuredClone(before)
  accepted.taxonomy_status = 'accepted'
  accepted.subdomains[0].status = 'accepted'
  const bag = new DiagnosticBag()
  const gates = validateTaxonomyTransition([{ value: before }], [{ value: accepted }], bag)
  assert.equal(bag.errorCount, 0)
  assert.ok(gates.has('taxonomy-lifecycle'))

  const changed = structuredClone(before)
  changed.human_intent.priorities = ['Durability']
  assert.ok(validateTaxonomyTransition([{ value: before }], [{ value: changed }], new DiagnosticBag()).has('protected-intent-change'))

  const removalBag = new DiagnosticBag()
  validateTaxonomyTransition([{ value: before }], [], removalBag)
  assert.ok(removalBag.items.some((item) => item.code === 'TAXONOMY_DOMAIN_REMOVED'))
})
