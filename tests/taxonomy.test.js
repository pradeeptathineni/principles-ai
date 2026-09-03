import test from 'node:test'
import assert from 'node:assert/strict'
import { DiagnosticBag } from '../src/diagnostics.js'
import { taxonomyAggregate, validateTaxonomy, validateTaxonomyTransition } from '../src/taxonomy.js'

function manifest(overrides = {}) {
  return {
    schema_version: 6,
    id: 'coding',
    code: 'COD',
    title: 'Coding',
    taxonomy_status: 'proposed',
    description: 'Coding guidance.',
    human_intent: { required_subdomains: [], priorities: [], exclusions: [], scope_notes: [] },
    subdomains: [{ id: 'design', code: 'DES', title: 'Design', description: 'Coding design decisions and practices.', status: 'proposed', origin: 'research' }],
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

test('derived taxonomy exposes canonical subdomain scope definitions', () => {
  const aggregate = taxonomyAggregate([{ value: manifest() }])
  assert.equal(aggregate.schema_version, 3)
  assert.equal(aggregate.domains[0].subdomains[0].description, 'Coding design decisions and practices.')
})

test('trusted taxonomy transitions preserve identities and classify human gates', () => {
  const before = manifest()
  const accepted = structuredClone(before)
  accepted.taxonomy_status = 'accepted'
  accepted.subdomains[0].status = 'accepted'
  const bag = new DiagnosticBag()
  const gates = validateTaxonomyTransition([{ value: before }], [{ value: accepted }], bag)
  assert.equal(bag.errorCount, 0)
  assert.ok(gates.has('taxonomy-acceptance'))

  const routineTransitions = new Set()
  const authorizedGates = validateTaxonomyTransition([{ value: before }], [{ value: accepted }], new DiagnosticBag(), {
    authorizedAcceptances: new Set(['coding', 'coding/design']),
    routineTransitions
  })
  assert.ok(!authorizedGates.has('taxonomy-acceptance'))
  assert.deepEqual([...routineTransitions].sort(), ['taxonomy-acceptance:coding', 'taxonomy-acceptance:coding/design'])

  const requiredBefore = manifest()
  requiredBefore.human_intent.required_subdomains = ['design']
  const requiredAccepted = structuredClone(requiredBefore)
  requiredAccepted.taxonomy_status = 'accepted'
  requiredAccepted.subdomains[0].status = 'accepted'
  const requiredRoutine = new Set()
  const requiredGates = validateTaxonomyTransition([{ value: requiredBefore }], [{ value: requiredAccepted }], new DiagnosticBag(), {
    authorizedAcceptances: new Set(['coding']),
    routineTransitions: requiredRoutine
  })
  assert.ok(!requiredGates.has('taxonomy-acceptance'))
  assert.deepEqual([...requiredRoutine].sort(), ['taxonomy-acceptance:coding', 'taxonomy-acceptance:coding/design'])

  const reframedAcceptance = structuredClone(accepted)
  reframedAcceptance.subdomains[0].description = 'A materially different design boundary.'
  const reframedGates = validateTaxonomyTransition([{ value: before }], [{ value: reframedAcceptance }], new DiagnosticBag(), {
    authorizedAcceptances: new Set(['coding', 'coding/design'])
  })
  assert.ok(reframedGates.has('taxonomy-acceptance'))
  assert.ok(reframedGates.has('taxonomy-definition-change'))

  const changed = structuredClone(before)
  changed.human_intent.priorities = ['Durability']
  assert.ok(validateTaxonomyTransition([{ value: before }], [{ value: changed }], new DiagnosticBag()).has('protected-intent-change'))

  const removalBag = new DiagnosticBag()
  validateTaxonomyTransition([{ value: before }], [], removalBag)
  assert.ok(removalBag.items.some((item) => item.code === 'TAXONOMY_DOMAIN_REMOVED'))
})

test('taxonomy lifecycle transitions distinguish consequential decisions and reject regressions', () => {
  const proposed = manifest({ taxonomy_status: 'accepted' })
  const deprecated = structuredClone(proposed)
  deprecated.subdomains[0].status = 'deprecated'
  assert.deepEqual([...validateTaxonomyTransition([{ value: proposed }], [{ value: deprecated }], new DiagnosticBag())], ['taxonomy-deprecation'])

  const reactivated = structuredClone(deprecated)
  reactivated.subdomains[0].status = 'accepted'
  assert.deepEqual([...validateTaxonomyTransition([{ value: deprecated }], [{ value: reactivated }], new DiagnosticBag())], ['taxonomy-reactivation'])

  const regression = structuredClone(deprecated)
  regression.subdomains[0].status = 'proposed'
  const regressionBag = new DiagnosticBag()
  validateTaxonomyTransition([{ value: deprecated }], [{ value: regression }], regressionBag)
  assert.ok(regressionBag.items.some((item) => item.code === 'TAXONOMY_STATUS_REGRESSION'))
})

test('taxonomy operation patterns classify add, rename, reframe, replace, split, and merge components', () => {
  const before = manifest({ taxonomy_status: 'accepted' })
  before.subdomains[0].status = 'accepted'

  const renamed = structuredClone(before)
  renamed.subdomains[0].title = 'Software Design'
  assert.ok(validateTaxonomyTransition([{ value: before }], [{ value: renamed }], new DiagnosticBag()).has('taxonomy-definition-change'))

  const reframed = structuredClone(before)
  reframed.subdomains[0].description = 'Architecture-level coding design decisions and practices.'
  assert.ok(validateTaxonomyTransition([{ value: before }], [{ value: reframed }], new DiagnosticBag()).has('taxonomy-definition-change'))

  const added = structuredClone(before)
  added.subdomains.push({ id: 'delivery', code: 'DLV', title: 'Delivery', description: 'Coding delivery decisions and practices.', status: 'proposed', origin: 'research' })
  assert.ok(validateTaxonomyTransition([{ value: before }], [{ value: added }], new DiagnosticBag()).has('taxonomy-addition'))

  const approvedAddition = structuredClone(before)
  approvedAddition.subdomains.push({ id: 'delivery', code: 'DLV', title: 'Delivery', description: 'Coding delivery decisions and practices.', status: 'accepted', origin: 'research' })
  const approvedAdditionBag = new DiagnosticBag()
  const approvedAdditionGates = validateTaxonomyTransition([{ value: before }], [{ value: approvedAddition }], approvedAdditionBag)
  assert.equal(approvedAdditionBag.errorCount, 0)
  assert.ok(approvedAdditionGates.has('taxonomy-addition'))

  const replaced = structuredClone(added)
  replaced.subdomains[0].status = 'deprecated'
  const replacementGates = validateTaxonomyTransition([{ value: before }], [{ value: replaced }], new DiagnosticBag())
  assert.ok(replacementGates.has('taxonomy-addition'))
  assert.ok(replacementGates.has('taxonomy-deprecation'))

  const split = structuredClone(before)
  split.subdomains[0].status = 'deprecated'
  split.subdomains.push(
    { id: 'api-design', code: 'API', title: 'API Design', description: 'API design decisions and practices.', status: 'proposed', origin: 'research' },
    { id: 'data-design', code: 'DAT', title: 'Data Design', description: 'Data design decisions and practices.', status: 'proposed', origin: 'research' }
  )
  const splitGates = validateTaxonomyTransition([{ value: before }], [{ value: split }], new DiagnosticBag())
  assert.ok(splitGates.has('taxonomy-addition'))
  assert.ok(splitGates.has('taxonomy-deprecation'))

  const merged = structuredClone(before)
  merged.subdomains.push({ id: 'modularity', code: 'MOD', title: 'Modularity', description: 'Coding modularity decisions and practices.', status: 'accepted', origin: 'research' })
  const mergedAfter = structuredClone(merged)
  mergedAfter.subdomains[1].status = 'deprecated'
  assert.ok(validateTaxonomyTransition([{ value: merged }], [{ value: mergedAfter }], new DiagnosticBag()).has('taxonomy-deprecation'))
})

test('required subdomain definition changes also classify protected intent', () => {
  const before = manifest({ taxonomy_status: 'accepted' })
  before.subdomains[0].status = 'accepted'
  before.human_intent.required_subdomains = ['design']
  const after = structuredClone(before)
  after.subdomains[0].description = 'Materially reframed design scope.'
  const gates = validateTaxonomyTransition([{ value: before }], [{ value: after }], new DiagnosticBag())
  assert.ok(gates.has('taxonomy-definition-change'))
  assert.ok(gates.has('protected-intent-change'))
})
