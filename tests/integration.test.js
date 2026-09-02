import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateRepository } from '../src/validator.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

test('current repository passes offline deterministic snapshot validation', () => {
  const first = validateRepository(root)
  const second = validateRepository(root)
  assert.equal(first.bag.errorCount, 0, first.bag.items.map((item) => `${item.path} ${item.code} ${item.message}`).join('\n'))
  assert.equal(first.transitionStatus, 'not_evaluated')
  assert.equal(first.generated.taxonomy, second.generated.taxonomy)
})

test('identical trusted state evaluates transition checks without claiming snapshot-only proof', () => {
  const result = validateRepository(root, { baselineRoot: root })
  assert.equal(result.bag.errorCount, 0, result.bag.items.map((item) => `${item.path} ${item.code} ${item.message}`).join('\n'))
  assert.equal(result.transitionStatus, 'evaluated')
})

test('a pre-tooling empty trusted baseline is handled as an explicit no-data migration', () => {
  const baseline = mkdtempSync(join(tmpdir(), 'principles-empty-baseline-'))
  const result = validateRepository(root, { baselineRoot: baseline })
  assert.equal(result.bag.errorCount, 0, result.bag.items.map((item) => `${item.path} ${item.code} ${item.message}`).join('\n'))
  assert.equal(result.transitionStatus, 'evaluated')
  rmSync(baseline, { recursive: true, force: true })
})
