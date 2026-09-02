import test from 'node:test'
import assert from 'node:assert/strict'
import { buildContext } from '../src/context.js'

test('context profiles include complete selected blocks and namespace local citations', () => {
  const claim = (role, text, labels) => ({ role, text, citationLabels: labels, claimSha256: role.padEnd(64, '0').slice(0, 64) })
  const entry = {
    id: 'PRN-000001',
    title: 'Example',
    statement: claim('statement', 'Statement.', ['1']),
    why: [claim('why-1', 'Why.', ['1'])],
    practices: [claim('practice-1', 'Practice.', ['2'])],
    applicability: [claim('applicability-1', 'Condition.', ['1'])],
    goals: [claim('goal-1', 'Goal.', [])],
    tags: ['example']
  }
  entry.claims = [entry.statement, ...entry.why, ...entry.practices, ...entry.applicability]
  const document = {
    path: 'domains/example/principles.md',
    frontmatter: { id: 'example.principles' },
    inputSha256: 'a'.repeat(64),
    entries: [entry],
    references: [{ label: '1', sourceId: 'SRC-000001', title: 'One' }, { label: '2', sourceId: 'SRC-000002', title: 'Two' }]
  }
  const request = {
    documents: [document],
    entryById: new Map([[entry.id, { document, entry }]]),
    sourceById: new Map(),
    evidenceByEntryId: new Map(),
    profile: 'standard',
    principleIds: [entry.id],
    revision: 'abc123'
  }
  const context = buildContext(request)
  assert.equal(context.entries[0].why.length, 1)
  assert.equal(context.entries[0].practices.length, 1)
  assert.match(context.entries[0].statement.text, /\[example\.principles:1\]$/)
  assert.equal(context.source_revision, 'abc123')
  assert.deepEqual(context.filters, { files: [], principles: ['PRN-000001'] })
  assert.deepEqual(context.inputs, [{ path: document.path, sha256: document.inputSha256 }])
  assert.deepEqual(context, buildContext(request))
})

test('verification context hashes source, evidence, and evaluator configuration inputs', () => {
  const statement = { role: 'statement', text: 'Statement.', citationLabels: ['1'], claimSha256: 'c'.repeat(64) }
  const entry = { id: 'PRN-000001', title: 'Example', statement, why: [], practices: [], applicability: [], goals: [], tags: [], claims: [statement] }
  const document = {
    path: 'domains/example/principles.md',
    frontmatter: { id: 'example.principles' },
    inputSha256: 'a'.repeat(64),
    entries: [entry],
    references: [{ label: '1', sourceId: 'SRC-000001', title: 'One' }]
  }
  const evidence = {
    path: 'evidence/claims/PRN-000001.yaml',
    inputSha256: 'e'.repeat(64),
    value: { claims: [{ reviewer: { configuration: { configuration_ref: 'evals/configurations/test.yaml' } } }] }
  }
  const context = buildContext({
    documents: [document],
    entryById: new Map([[entry.id, { document, entry }]]),
    sourceById: new Map([['SRC-000001', { path: 'sources/SRC-000001.yaml', inputSha256: 's'.repeat(64), value: { id: 'SRC-000001' } }]]),
    evidenceByEntryId: new Map([[entry.id, evidence]]),
    evaluatorConfigs: new Map([['evals/configurations/test.yaml', { path: 'evals/configurations/test.yaml', inputSha256: 'f'.repeat(64) }]]),
    profile: 'verification',
    fileIds: ['example.principles'],
    revision: 'abc123'
  })
  assert.deepEqual(context.inputs.map((input) => input.path), [
    'domains/example/principles.md',
    'evals/configurations/test.yaml',
    'evidence/claims/PRN-000001.yaml',
    'sources/SRC-000001.yaml'
  ])
})
