import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { DETERMINISTIC_CHECK_IMPLEMENTATIONS, validateCheckRegistry } from '../src/checks.js'
import { DiagnosticBag } from '../src/diagnostics.js'

test('every configured deterministic check has exactly one implementation owner', () => {
  const policy = parse(readFileSync('config/validation.yaml', 'utf8'))
  const bag = new DiagnosticBag()
  validateCheckRegistry(policy, bag)
  assert.equal(bag.errorCount, 0, bag.items.map((item) => `${item.code}: ${item.message}`).join('\n'))
  assert.deepEqual([...policy.classes.deterministic.checks].sort(), Object.keys(DETERMINISTIC_CHECK_IMPLEMENTATIONS).sort())
})
