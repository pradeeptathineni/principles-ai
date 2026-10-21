import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fixtureRequest, fixtureSources, consumeOperational } from './fixtures/context/selection.js'
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
    frontmatter: { id: 'example.principles', status: 'draft', last_reviewed: null, reviewed_content_sha256: null },
    inputSha256: 'a'.repeat(64),
    entries: [entry],
    references: [{ label: '1', sourceId: 'SRC-000001', title: 'One' }, { label: '2', sourceId: 'SRC-000002', title: 'Two' }]
  }
  const request = {
    documents: [document],
    entryById: new Map([[entry.id, { document, entry }]]),
    sourceById: fixtureSources(),
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
  assert.deepEqual(context.inputs.map((input) => input.path), [document.path, 'sources/SRC-000001.yaml', 'sources/SRC-000002.yaml'])
  assert.deepEqual(context, buildContext(request))
})

test('verification context hashes source, evidence, and evaluator configuration inputs', () => {
  const statement = { role: 'statement', text: 'Statement.', citationLabels: ['1'], claimSha256: 'c'.repeat(64) }
  const entry = { id: 'PRN-000001', title: 'Example', statement, why: [], practices: [], applicability: [], goals: [], tags: [], claims: [statement] }
  const document = {
    path: 'domains/example/principles.md',
    frontmatter: { id: 'example.principles', status: 'draft', last_reviewed: null, reviewed_content_sha256: null },
    inputSha256: 'a'.repeat(64),
    entries: [entry],
    references: [{ label: '1', sourceId: 'SRC-000001', title: 'One' }]
  }
  const evidence = {
    path: 'evidence/claims/PRN-000001.yaml',
    inputSha256: 'e'.repeat(64),
    value: { reviewer: { configuration: { configuration_ref: 'evals/configurations/test.yaml' } }, claims: [] }
  }
  const context = buildContext({
    documents: [document],
    entryById: new Map([[entry.id, { document, entry }]]),
    sourceById: new Map([['SRC-000001', { path: 'sources/SRC-000001.yaml', inputSha256: 'b'.repeat(64), value: { id: 'SRC-000001', status: 'active' } }]]),
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

test('all profiles preserve mixed file lifecycle, native source status, identity and bound inputs', () => {
  const request = fixtureRequest()
  const before = structuredClone(request)
  const outputs = ['minimal', 'standard', 'learning', 'verification'].map((profile) => buildContext({ ...request, profile }))
  for (const context of outputs) {
    assert.equal(context.schema_version, 2)
    assert.deepEqual(context.entries.map((entry) => entry.status), ['draft', 'active'])
    assert.deepEqual(context.entries.map((entry) => entry.file_id), ['coding.principles', 'coding.personal-growth'])
    assert.deepEqual(context.entries[0].source_ids, ['SRC-000001', 'SRC-000002'])
    assert.deepEqual(context.entries[0].source_inputs.map((source) => source.status), ['active', 'withdrawn'])
    assert.equal(context.entries[1].reviewed_content_sha256, request.documents[1].semanticSha256)
    assert.equal(context.entries[0].last_reviewed, null)
    assert.match(context.input_sha256, /^[a-f0-9]{64}$/)
    assert.equal(context.input_sha256, outputs[0].input_sha256)
    assert.equal(context.source_revision, request.revision)
  }
  assert.deepEqual(request, before)
})

test('minimal requires bound full-scope fetch; qualified profiles preserve complete exceptions and sources', () => {
  const request = fixtureRequest()
  const minimal = buildContext({ ...request, profile: 'minimal' })
  assert.equal(minimal.usage, 'reference-only')
  assert.ok(minimal.omitted_sections.includes('applicability'))
  assert.throws(() => consumeOperational(minimal, minimal.input_sha256), /Lossy/)
  for (const profile of ['standard', 'learning', 'verification']) {
    const full = buildContext({ ...request, profile, expectedInputSha256: minimal.input_sha256 })
    const entries = consumeOperational(full, minimal.input_sha256)
    assert.equal(entries[0].applicability[0].text, 'Emergency mitigation can require a different initial tradeoff. [coding.principles:2]')
    assert.equal(entries[0].applicability.length, request.documents[0].entries[0].applicability.length)
    assert.equal(entries[0].why.length, request.documents[0].entries[0].why.length)
    assert.equal(entries[0].practices.length, request.documents[0].entries[0].practices.length)
    assert.equal(entries[0].references[1].source_id, 'SRC-000002')
    assert.equal(entries[0].source_inputs[1].status, 'withdrawn')
    if (profile === 'verification') assert.deepEqual(entries[0].sources, [...request.sourceById.values()].map((source) => source.value))
  }
})

test('stale refetch rejects content, source lifecycle and source revision changes', () => {
  const request = fixtureRequest()
  const minimal = buildContext({ ...request, profile: 'minimal' })
  for (const mutate of [
    (next) => { next.documents[0].inputSha256 = 'f'.repeat(64) },
    (next) => { next.sourceById.get('SRC-000001').value.status = 'superseded'; next.sourceById.get('SRC-000001').inputSha256 = 'f'.repeat(64) },
    (next) => { next.revision = 'fixture-revision-2' }
  ]) {
    const next = structuredClone(request)
    mutate(next)
    assert.throws(() => buildContext({ ...next, profile: 'verification', expectedInputSha256: minimal.input_sha256 }), /Stale context input digest/)
    const changed = buildContext(next)
    assert.throws(() => consumeOperational(changed, minimal.input_sha256), /Stale/)
  }
})

test('namespaced citations resolve to the correct source across mixed files', () => {
  const context = buildContext(fixtureRequest())
  for (const [index, entry] of context.entries.entries()) {
    assert.ok(entry.statement.text.endsWith(`[${entry.file_id}:1]`))
    assert.deepEqual(entry.statement.source_ids, [index === 0 ? 'SRC-000001' : 'SRC-000002'])
    assert.equal(entry.references[0].label, `${entry.file_id}:1`)
    assert.equal(entry.references[0].source_id, index === 0 ? 'SRC-000001' : 'SRC-000002')
  }
  assert.notEqual(context.entries[0].references[0].label, context.entries[1].references[0].label)
})

test('unsupported corpus lifecycle, missing sources and unresolved citations fail explicitly', () => {
  for (const status of [undefined, 'deprecated', 'unknown']) {
    const request = fixtureRequest()
    request.documents[0].frontmatter.status = status
    assert.throws(() => buildContext(request), /Unsupported corpus status/)
  }
  const missing = fixtureRequest()
  missing.sourceById.delete('SRC-000002')
  assert.throws(() => buildContext(missing), /Missing context source SRC-000002/)
  const unresolved = fixtureRequest()
  unresolved.documents[0].entries[0].statement.citationLabels = ['99']
  assert.throws(() => buildContext(unresolved), /Unresolved context citation/)
  const unknownSource = fixtureRequest()
  unknownSource.sourceById.get('SRC-000001').value.status = 'unknown'
  assert.throws(() => buildContext(unknownSource), /Unsupported source status/)
})

test('input binding rejects absent hashes, source identity mismatch and unknown selections', () => {
  const missingHash = fixtureRequest()
  missingHash.documents[0].inputSha256 = null
  assert.throws(() => buildContext(missingHash), /Missing or invalid context input/)
  const mismatched = fixtureRequest()
  mismatched.sourceById.get('SRC-000001').value.id = 'SRC-000099'
  assert.throws(() => buildContext(mismatched), /Context source identity mismatch/)
  assert.throws(() => buildContext({ ...fixtureRequest(), fileIds: ['unknown.file'] }), /Unknown context file/)
  assert.throws(() => buildContext({ ...fixtureRequest(), principleIds: ['PRN-999999'] }), /Unknown principle ID/)
  assert.throws(() => buildContext({ ...fixtureRequest(), revision: '' }), /explicit source revision/)
  assert.throws(() => buildContext({ ...fixtureRequest(), profile: 'unknown' }), /Unsupported context profile/)
})

test('every native source lifecycle travels without gaining active authority', () => {
  for (const status of ['active', 'moved', 'superseded', 'withdrawn', 'unavailable']) {
    const request = fixtureRequest()
    request.sourceById.get('SRC-000001').value.status = status
    const context = buildContext({ ...request, profile: 'verification' })
    assert.equal(context.entries[0].source_inputs[0].status, status)
    assert.equal(context.entries[0].sources[0].status, status)
    assert.equal(context.entries[0].status, 'draft')
  }
})

test('CLI defaults to standard and supports digest-bound full fetch with fail-before-write', () => {
  const cwd = new URL('../', import.meta.url)
  const args = ['bin/principles.js', 'context', '--file', 'coding.principles', '--revision', 'fixture-cli-revision']
  const run = (extra) => spawnSync(process.execPath, [...args, ...extra], { cwd, encoding: 'utf8' })
  const standard = run([])
  assert.equal(standard.status, 0, standard.stderr)
  const minimal = run(['--profile', 'minimal'])
  assert.equal(minimal.status, 0, minimal.stderr)
  const reference = JSON.parse(minimal.stdout)
  const full = run(['--profile', 'verification', '--expected-input-sha256', reference.input_sha256])
  assert.equal(full.status, 0, full.stderr)
  const qualified = JSON.parse(full.stdout)
  assert.equal(JSON.parse(standard.stdout).profile, 'standard')
  assert.deepEqual(JSON.parse(standard.stdout).entries.map((entry) => entry.id), qualified.entries.map((entry) => entry.id))
  assert.equal(qualified.input_sha256, reference.input_sha256)
  const stale = run(['--expected-input-sha256', '0'.repeat(64)])
  assert.equal(stale.status, 2)
  assert.equal(stale.stdout, '')
  assert.match(stale.stderr, /Stale context input digest/)
})

test('digest binds the selected identities while ignoring profile, generation time and selector spelling', () => {
  const request = fixtureRequest()
  const original = buildContext(request)
  const byPrinciple = buildContext({ ...request, fileIds: [], principleIds: ['PRN-000002', 'PRN-000001', 'PRN-000001'], generatedAt: '2026-10-21T00:00:00Z' })
  assert.equal(byPrinciple.input_sha256, original.input_sha256)
  assert.notEqual(buildContext({ ...request, fileIds: [], principleIds: ['PRN-000001'] }).input_sha256, original.input_sha256)
  const withEvidence = structuredClone(request)
  withEvidence.evidenceByEntryId.set('PRN-000001', { path: 'evidence/claims/PRN-000001.yaml', inputSha256: 'e'.repeat(64), value: { claims: [] } })
  const reference = buildContext({ ...withEvidence, profile: 'minimal' })
  assert.notEqual(reference.input_sha256, original.input_sha256)
  assert.equal(buildContext({ ...withEvidence, profile: 'verification' }).input_sha256, reference.input_sha256)
  withEvidence.evidenceByEntryId.get('PRN-000001').inputSha256 = 'f'.repeat(64)
  assert.throws(() => buildContext({ ...withEvidence, expectedInputSha256: reference.input_sha256 }), /Stale context input digest/)
})
