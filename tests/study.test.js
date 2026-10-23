import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createStudyService, loadStudyCatalog } from '../src/study.js'
import { writeSyntheticStudyRepository, syntheticStudyText } from './fixtures/study-repository.js'

const project = dirname(dirname(fileURLToPath(import.meta.url)))
const baseFixture = syntheticStudyText

function fixture(t) {
  const parent = mkdtempSync(join(tmpdir(), 'principles-study-'))
  const root = join(parent, 'corpus')
  const generated = writeSyntheticStudyRepository(root)
  let count = 0
  const store = join(parent, 'private')
  const options = { root, store, revision: 'synthetic-source-1', clock: () => '2026-10-23T12:00:00.000Z', idFactory: () => `fixture-${++count}` }
  t.after(() => rmSync(parent, { recursive: true, force: true }))
  return { parent, root, file: generated.file, store, options, activate: generated.activate, service: createStudyService(options) }
}

test('practice completes explanation/reveal/self-report, reopens and exports exact source without corpus mutation', (t) => {
  const f = fixture(t)
  const before = readFileSync(f.file, 'utf8')
  const list = f.service.list('reviewable')
  assert.equal(list.principles.length, 1)
  assert.match(list.principles[0].exact_entry_markdown, /^### PRN-000001/)
  assert.match(list.principles[0].context.entries[0].applicability[0].text, /Emergency mitigation/)
  const session = f.service.start({ name: 'Synthetic review practice', principleIds: ['PRN-000001'] })
  assert.match(session.cards[0].cue, /Keep changes reviewable/)
  assert.ok(!JSON.stringify(session).includes('Emergency mitigation'))
  assert.equal(session.cards[0].source_state.status, 'current')
  assert.throws(() => f.service.attempt(session.id, 'PRN-000001', '  '), /Explanation/)
  f.service.cue(session.id, 'PRN-000001', 'What makes a change reviewable?')
  const attempted = f.service.attempt(session.id, 'PRN-000001', 'My synthetic explanation before seeing the source.')
  const attemptId = attempted.cards[0].attempts[0].id
  assert.ok(!attempted.cards[0].attempts[0].source)
  assert.throws(() => f.service.rate(session.id, 'PRN-000001', attemptId, { rating: 'comfortable', example: 'Synthetic example', revisitOn: '2026-10-25' }), /Reveal/)
  assert.throws(() => f.service.attempt(session.id, 'PRN-000001', 'Second explanation'), /pending/)
  const revealed = f.service.reveal(session.id, 'PRN-000001', attemptId)
  assert.equal(revealed.cards[0].attempts[0].source.input_sha256, list.principles[0].input_sha256)
  assert.match(revealed.cards[0].attempts[0].source.exact_entry_markdown, /Emergency mitigation/)
  f.service.rate(session.id, 'PRN-000001', attemptId, { rating: 'partial', example: 'I split a synthetic unrelated refactor from a bug fix.', revisitOn: '2026-10-25' })
  assert.throws(() => f.service.rate(session.id, 'PRN-000001', attemptId, { rating: 'again', example: 'Another example', revisitOn: '2026-10-25' }), /immutable/)
  f.service.revisit(session.id, 'PRN-000001', '2026-10-26')
  const reopened = createStudyService(f.options).show(session.id)
  assert.equal(reopened.cards[0].revisit_on, '2026-10-26')
  assert.equal(reopened.cards[0].cue_history.length, 2)
  assert.equal(reopened.cards[0].attempts[0].rating, 'partial')
  const notes = f.service.exportSession(session.id, 'markdown')
  assert.match(notes, /not measured mastery or empirical efficacy/)
  assert.match(notes, /Synthetic explanation|synthetic explanation/)
  assert.match(notes, /Revision: synthetic-source-1/)
  assert.match(notes, /\[1\]: https:\/\/example.com\/one/)
  assert.equal(readFileSync(f.file, 'utf8'), before)
  assert.equal(statSync(join(f.store, 'sessions.json')).mode & 0o777, 0o600)
  assert.equal(statSync(f.store).mode & 0o777, 0o700)
})

test('source revisions and changed content require explicit refresh; old attempts retain bound source and cue', (t) => {
  const f = fixture(t)
  const session = f.service.start({ name: 'Source history', principleIds: ['PRN-000001'] })
  const pending = f.service.attempt(session.id, 'PRN-000001', 'A synthetic explanation.')
  const attemptId = pending.cards[0].attempts[0].id
  f.activate(baseFixture.replace('Prefer bounded changes', 'Prefer narrowly bounded changes'))
  assert.equal(f.service.show(session.id).cards[0].source_state.status, 'changed')
  const revealed = f.service.reveal(session.id, 'PRN-000001', attemptId)
  assert.match(revealed.cards[0].attempts[0].source.exact_entry_markdown, /Prefer bounded changes/)
  assert.throws(() => f.service.refresh(session.id, 'PRN-000001'), /pending/)
  f.service.rate(session.id, 'PRN-000001', attemptId, { rating: 'again', example: 'A synthetic own example.', revisitOn: '2026-10-24' })
  assert.throws(() => f.service.attempt(session.id, 'PRN-000001', 'A new explanation.'), /explicitly refresh/)
  const refreshed = f.service.refresh(session.id, 'PRN-000001')
  assert.equal(refreshed.cards[0].source_state.status, 'current')
  const full = f.service.exportSession(session.id)
  assert.equal(full.cards[0].source_history.length, 2)
  assert.equal(full.cards[0].attempts[0].source_index, 0)
  assert.match(full.cards[0].source_history[1].exact_entry_markdown, /narrowly bounded/)
  const next = createStudyService({ ...f.options, revision: 'synthetic-source-2' })
  assert.equal(next.show(session.id).cards[0].source_state.status, 'changed')
  next.refresh(session.id, 'PRN-000001')
  assert.equal(next.exportSession(session.id).cards[0].source_history[2].source_revision, 'synthetic-source-2')
})

test('inactive/missing/unavailable source comparisons preserve saved sessions and never admit draft or invalid sources', (t) => {
  const f = fixture(t)
  const session = f.service.start({ name: 'Availability', principleIds: ['PRN-000001'] })
  writeFileSync(f.file, baseFixture)
  assert.equal(f.service.list().principles.length, 0)
  assert.equal(f.service.show(session.id).cards[0].source_state.status, 'inactive')
  assert.throws(() => f.service.start({ name: 'Cannot select draft', principleIds: ['PRN-000001'] }), /inactive/)
  assert.throws(() => f.service.refresh(session.id, 'PRN-000001'), /inactive/)
  unlinkSync(f.file)
  assert.equal(f.service.show(session.id).cards[0].source_state.status, 'missing')
  const ledgerFile = join(f.root, 'config/identity-ledger.yaml')
  const ledger = readFileSync(ledgerFile, 'utf8')
  writeFileSync(ledgerFile, ledger.replace('  retired: []', '  retired:\n    - PRN-000001'))
  assert.equal(f.service.show(session.id).cards[0].source_state.status, 'inactive')
  writeFileSync(ledgerFile, ledger)
  writeFileSync(f.file, 'invalid corpus\n')
  assert.equal(f.service.show(session.id).cards[0].source_state.status, 'unavailable')
  assert.throws(() => f.service.list(), /source unavailable/)
  renameSync(f.root, `${f.root}-offline`)
  const offline = createStudyService(f.options)
  assert.equal(offline.show(session.id).cards[0].source_state.status, 'unavailable')
  assert.match(offline.exportSession(session.id, 'markdown'), /Keep changes reviewable/)
})

test('private store rejects corpus paths, symlink escapes, concurrent writers, corrupt versions and invalid dates', (t) => {
  const f = fixture(t)
  const choose = (store) => createStudyService({ ...f.options, store }).start({ name: 'Privacy', principleIds: ['PRN-000001'] })
  assert.throws(() => choose(join(f.root, 'private')), /outside the public corpus/)
  symlinkSync(f.root, join(f.parent, 'alias'))
  assert.throws(() => choose(join(f.parent, 'alias/private')), /outside the public corpus/)
  const session = f.service.start({ name: 'Private', principleIds: ['PRN-000001'] })
  assert.throws(() => f.service.revisit(session.id, 'PRN-000001', '2026-02-30'), /valid YYYY-MM-DD/)
  writeFileSync(join(f.store, '.study.lock'), 'other writer')
  assert.throws(() => f.service.cue(session.id, 'PRN-000001', 'New cue'), /busy/)
  unlinkSync(join(f.store, '.study.lock'))
  const file = join(f.store, 'sessions.json')
  const before = readFileSync(file, 'utf8')
  writeFileSync(file, before.replace('"schema_version": 1', '"schema_version": 99'))
  assert.throws(() => f.service.sessions(), /unsupported/)
  writeFileSync(file, before.replace('Prefer bounded changes', 'Tampered source text'))
  assert.throws(() => f.service.sessions(), /Malformed/)
  unlinkSync(file)
  symlinkSync(f.file, file)
  assert.throws(() => f.service.sessions(), /regular file/)
})

test('Signals export is explicit, exact, deterministic and excludes private sessions by default', (t) => {
  const f = fixture(t)
  const session = f.service.start({ name: 'Private synthetic study', principleIds: ['PRN-000001'] })
  f.service.cue(session.id, 'PRN-000001', 'A'.repeat(3000))
  const first = f.service.knowledgeExport('synthetic-owner')
  assert.equal(first.records.length, 1)
  assert.equal(first.exported_at, '2026-10-23T12:00:00.000Z')
  assert.match(first.freshness, /Frozen export/)
  assert.equal(first.records[0].ref.kind, 'principle')
  const all = f.service.knowledgeExport('synthetic-owner', { includeSessions: true })
  assert.equal(all.records.length, 2)
  assert.equal(all.records[1].ref.kind, 'study-session')
  assert.equal(all.records[1].ref.id, session.id)
  assert.equal(all.records[1].summary.length, 2000)
  assert.equal(JSON.parse(all.records[1].content).cards[0].cue.length, 3000)
  for (const record of all.records) {
    const sha = createHash('sha256').update(record.content, 'utf8').digest('hex')
    assert.equal(record.ref.digest, sha)
    assert.equal(record.ref.revision, `sha256:${sha}`)
  }
  assert.deepEqual(all, f.service.knowledgeExport('synthetic-owner', { includeSessions: true }))
})

test('CLI persists across separate processes, validates flags, and exports readable notes', (t) => {
  const f = fixture(t)
  const run = (command, flags = [], expect = 0) => {
    const result = spawnSync(process.execPath, [...process.execArgv.filter((arg) => !arg.startsWith('--test')), join(project, 'bin/principles-study.js'), command, '--root', f.root, '--revision', 'fixture-cli-1', '--store', f.store, ...flags], { encoding: 'utf8' })
    assert.equal(result.status, expect, result.stderr)
    return expect ? JSON.parse(result.stderr) : command === 'export' && flags.includes('markdown') ? result.stdout : JSON.parse(result.stdout)
  }
  const start = run('start', ['--name', 'CLI synthetic practice', '--principles', 'PRN-000001'])
  const args = ['--session', start.id, '--principle', 'PRN-000001']
  const attempt = run('attempt', [...args, '--text', 'Synthetic CLI explanation.'])
  const attemptArgs = [...args, '--attempt', attempt.cards[0].attempts[0].id]
  run('reveal', attemptArgs)
  run('rate', [...attemptArgs, '--rating', 'comfortable', '--example', 'A synthetic own example.', '--revisit', '2026-10-24'])
  assert.equal(run('show', ['--session', start.id]).cards[0].attempts[0].rating, 'comfortable')
  assert.match(run('export', ['--session', start.id, '--format', 'markdown']), /Synthetic CLI explanation/)
  assert.match(run('show', ['--unknown', 'x'], 1).error, /Invalid/)
  assert.ok(existsSync(join(f.store, 'sessions.json')))
})

test('actual owner reader selects only current accepted active reviewed Principles and preserves source qualification', () => {
  const result = loadStudyCatalog({ root: project, revision: 'actual-source-consumer-demo' })
  const eligible = [...result.records.values()].filter((record) => record.eligible)
  assert.ok(eligible.length > 0)
  for (const record of eligible) {
    assert.equal(record.status, 'active')
    assert.equal(record.taxonomy.status, 'accepted')
    assert.equal(record.context.profile, 'verification')
    assert.ok(record.context.entries[0].source_inputs.length > 0)
    assert.match(record.exact_entry_markdown, new RegExp(`^### ${record.id}`))
  }
})
