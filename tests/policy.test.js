import test from 'node:test'
import assert from 'node:assert/strict'
import { DiagnosticBag } from '../src/diagnostics.js'
import { policyShapeFingerprint, policyValueFingerprint, validatePolicyTransition } from '../src/policy.js'

test('policy shape fingerprint changes for nested unknown fields without depending on values', () => {
  const original = { version: 1, nested: { enabled: true } }
  const changedValue = { version: 2, nested: { enabled: false } }
  const unknownField = { version: 1, nested: { enabled: true, bypass: true } }
  assert.equal(policyShapeFingerprint(original), policyShapeFingerprint(changedValue))
  assert.notEqual(policyShapeFingerprint(original), policyShapeFingerprint(unknownField))
})

test('policy values are exact and same-version trusted policy changes are rejected', () => {
  const baseline = { version: 4, markdown: { raw_html_allowed: false } }
  const weakened = { version: 4, markdown: { raw_html_allowed: true } }
  assert.notEqual(policyValueFingerprint(baseline), policyValueFingerprint(weakened))
  const bag = new DiagnosticBag()
  validatePolicyTransition({ 'content-policy': baseline }, { 'content-policy': weakened }, bag)
  assert.ok(bag.items.some((item) => item.code === 'POLICY_CHANGE_WITHOUT_VERSION'))
})

test('versioned policy migrations cannot remove trusted deterministic checks', () => {
  const bag = new DiagnosticBag()
  validatePolicyTransition(
    { validation: { version: 4, classes: { deterministic: { checks: ['identity_transition'] } } } },
    { validation: { version: 5, classes: { deterministic: { checks: [] } } } },
    bag
  )
  assert.ok(bag.items.some((item) => item.code === 'TRUSTED_CHECK_REMOVED'))
})
