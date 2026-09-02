import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DiagnosticBag } from '../src/diagnostics.js'
import { loadEvaluatorConfigurations, validateEvidence } from '../src/evidence.js'

function state(record) {
  const claim = { role: 'statement', claimSha256: 'a'.repeat(64), citationLabels: ['1'] }
  const document = {
    path: 'domains/coding/principles.md',
    frontmatter: { status: 'draft' },
    references: [{ label: '1', sourceId: 'SRC-000001' }]
  }
  return {
    records: [{ path: 'evidence/claims/PRN-000001.yaml', value: record }],
    entries: new Map([['PRN-000001', { document, entry: { claims: [claim] } }]])
  }
}

function validRecord() {
  return {
    schema_version: 4,
    entry_id: 'PRN-000001',
    reviewed_at: '2026-09-01',
    reviewer: { type: 'human', identity: 'Reviewer', configuration: null },
    claims: [{
      role: 'statement',
      claim_sha256: 'a'.repeat(64),
      sources: [{ source_id: 'SRC-000001', locators: ['Section 1'] }],
      outcome: 'strong'
    }]
  }
}

test('complete evidence validates exact role, hash, source order, and locators', () => {
  const record = validRecord()
  const { records, entries } = state(record)
  const bag = new DiagnosticBag()
  validateEvidence('/', records, entries, new Map(), new Map([['SRC-000001', { value: { id: 'SRC-000001' } }]]), bag)
  assert.equal(bag.errorCount, 0)
})

test('evidence rejects stale hashes and source disagreement', () => {
  const record = validRecord()
  record.claims[0].claim_sha256 = 'b'.repeat(64)
  record.claims[0].sources = [{ source_id: 'SRC-000002', locators: ['Section 2'] }]
  const { records, entries } = state(record)
  const bag = new DiagnosticBag()
  validateEvidence('/', records, entries, new Map(), new Map(), bag)
  for (const code of ['EVIDENCE_CLAIM_HASH', 'EVIDENCE_SOURCE_SEQUENCE', 'EVIDENCE_SOURCE_MISSING']) assert.ok(bag.items.some((item) => item.code === code), code)
})

test('one entry-level evaluator hash binds every claim review', () => {
  const record = validRecord()
  record.reviewer = {
    type: 'ai',
    identity: 'Evaluator',
    configuration: { configuration_ref: 'evals/configurations/test.yaml', configuration_sha256: 'b'.repeat(64) }
  }
  const { records, entries } = state(record)
  const bag = new DiagnosticBag()
  const configs = new Map([['evals/configurations/test.yaml', { inputSha256: 'a'.repeat(64) }]])
  validateEvidence('/', records, entries, configs, new Map([['SRC-000001', { value: { id: 'SRC-000001' } }]]), bag)
  assert.ok(bag.items.some((item) => item.code === 'EVALUATOR_HASH'))
})

test('invalid evidence shape is contained as a diagnostic', () => {
  const bag = new DiagnosticBag()
  assert.doesNotThrow(() => validateEvidence('/', [{ path: 'evidence/claims/PRN-000001.yaml', value: { entry_id: 'PRN-000001' } }], new Map(), new Map(), new Map(), bag))
  assert.ok(bag.items.some((item) => item.code === 'EVIDENCE_INVALID_RECORD'))
})

test('normal max_tokens settings are allowed and evaluator metadata is canonical', () => {
  const root = mkdtempSync(join(tmpdir(), 'principles-evaluator-'))
  mkdirSync(join(root, 'evals', 'configurations'), { recursive: true })
  writeFileSync(join(root, 'evals', 'configurations', 'test.yaml'), 'schema_version: 2\nid: test\nsystem: local\nmodel: test\nprompt: test\nsettings:\n  max_tokens: 100\n')
  const bag = new DiagnosticBag()
  const loaded = loadEvaluatorConfigurations(root, { validate() { return true } }, bag)
  assert.equal(loaded.size, 1)
  assert.equal(bag.errorCount, 0)

  writeFileSync(join(root, 'evals', 'configurations', 'test.yaml'), 'schema_version: 2\nid: test\nsystem: local\nmodel: " test"\nprompt: test\nsettings: {}\n')
  const invalidBag = new DiagnosticBag()
  loadEvaluatorConfigurations(root, { validate() { return true } }, invalidBag)
  assert.ok(invalidBag.items.some((item) => item.code === 'METADATA_STRING'))
  rmSync(root, { recursive: true, force: true })
})
