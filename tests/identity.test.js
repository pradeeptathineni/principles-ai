import test from 'node:test'
import assert from 'node:assert/strict'
import { DiagnosticBag } from '../src/diagnostics.js'
import { validateIdentityLedger, validateIdentityTransition } from '../src/identity.js'

function ledger(principles, relationships = []) {
  return {
    schema_version: 2,
    principles,
    sources: { next_sequence: 1, allocated: [], retired: [] },
    principle_relationships: relationships
  }
}

test('identity snapshot accepts a directed split with retired original', () => {
  const value = ledger(
    { next_sequence: 4, allocated: ['PRN-000001', 'PRN-000002', 'PRN-000003'], retired: ['PRN-000001'] },
    [
      { type: 'derived_from', from: 'PRN-000002', to: 'PRN-000001' },
      { type: 'derived_from', from: 'PRN-000003', to: 'PRN-000001' }
    ]
  )
  const bag = new DiagnosticBag()
  validateIdentityLedger(value, bag)
  assert.equal(bag.errorCount, 0)
})

test('identity transition proves split children are new and original was active', () => {
  const before = ledger({ next_sequence: 2, allocated: ['PRN-000001'], retired: [] })
  const after = ledger(
    { next_sequence: 4, allocated: ['PRN-000001', 'PRN-000002', 'PRN-000003'], retired: ['PRN-000001'] },
    [
      { type: 'derived_from', from: 'PRN-000002', to: 'PRN-000001' },
      { type: 'derived_from', from: 'PRN-000003', to: 'PRN-000001' }
    ]
  )
  const bag = new DiagnosticBag()
  validateIdentityTransition(before, after, bag)
  assert.equal(bag.errorCount, 0)
})

test('identity transition rejects allocation removal and a newly invented merge survivor', () => {
  const before = ledger({ next_sequence: 3, allocated: ['PRN-000001', 'PRN-000002'], retired: [] })
  const after = ledger(
    { next_sequence: 4, allocated: ['PRN-000001', 'PRN-000003'], retired: ['PRN-000001'] },
    [{ type: 'replaced_by', from: 'PRN-000001', to: 'PRN-000003' }]
  )
  const bag = new DiagnosticBag()
  validateIdentityTransition(before, after, bag)
  assert.ok(bag.items.some((item) => item.code === 'IDENTITY_ALLOCATION_REMOVED'))
  assert.ok(bag.items.some((item) => item.code === 'MERGE_SURVIVOR_BASELINE'))
})

test('identity snapshot rejects relationship cycles', () => {
  const value = ledger(
    { next_sequence: 3, allocated: ['PRN-000001', 'PRN-000002'], retired: ['PRN-000001', 'PRN-000002'] },
    [
      { type: 'replaced_by', from: 'PRN-000001', to: 'PRN-000002' },
      { type: 'replaced_by', from: 'PRN-000002', to: 'PRN-000001' }
    ]
  )
  const bag = new DiagnosticBag()
  validateIdentityLedger(value, bag)
  assert.ok(bag.items.some((item) => item.code === 'RELATIONSHIP_CYCLE'))
})
