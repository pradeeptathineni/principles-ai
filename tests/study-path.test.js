import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createStudyService } from '../src/study.js'
import { syntheticStudyText, writeSyntheticStudyRepository } from './fixtures/study-repository.js'

const project = dirname(dirname(fileURLToPath(import.meta.url)))
const steps = [
  { id: 'explain-one', title: 'Explain the principle', kind: 'explain', principle_id: 'PRN-000001', prompt: 'State the decision and its limits.', prerequisites: [] },
  { id: 'apply-one', title: 'Apply the principle', kind: 'apply', principle_id: 'PRN-000001', prompt: 'Describe an application and what happened.', prerequisites: ['explain-one'] },
  { id: 'explain-two', title: 'Explain another angle', kind: 'explain', principle_id: 'PRN-000001', prompt: 'Describe another aspect of the decision.', prerequisites: [] }
]

function fixture(t) {
  const parent = mkdtempSync(join(tmpdir(), 'principles-path-'))
  const root = join(parent, 'corpus')
  const generated = writeSyntheticStudyRepository(root)
  const store = join(parent, 'private')
  let count = 0
  const options = { root, store, revision: 'path-fixture-1', clock: () => '2026-10-24T12:00:00.000Z', idFactory: () => `path-${++count}` }
  t.after(() => rmSync(parent, { recursive: true, force: true }))
  return { parent, root, store, options, service: createStudyService(options), activate: generated.activate }
}

test('private learning path records rated explanation and learner-reported application, then reopens', (t) => {
  const f = fixture(t)
  const path = f.service.createPath({ name: 'Reversible changes', goal: 'Explain and apply reversible changes', principleIds: ['PRN-000001'], steps })
  assert.equal(path.learning_path.revision, 1)
  assert.deepEqual(path.learning_path.steps.map((step) => step.status), ['available', 'blocked', 'available'])
  assert.throws(() => f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 1, attempt_id: 'fake' }), /Unknown attempt/)
  assert.throws(() => f.service.recordPathStep(path.id, 'apply-one', { expected_revision: 1, observation: 'did it' }), /blocked/)
  const attempt = f.service.attempt(path.id, 'PRN-000001', 'My explanation before reveal.')
  const attemptId = attempt.cards.find((card) => card.principle_id === 'PRN-000001').attempts[0].id
  assert.throws(() => f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 1, attempt_id: attemptId }), /finished attempt bound/)
  f.service.reveal(path.id, 'PRN-000001', attemptId)
  f.service.rate(path.id, 'PRN-000001', attemptId, { rating: 'partial', example: 'My own example.', revisitOn: '2026-10-30' })
  f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 1, attempt_id: attemptId })
  assert.deepEqual(f.service.pathView(path.id).steps.map((step) => step.status), ['recorded', 'available', 'available'])
  f.service.recordPathStep(path.id, 'apply-one', { expected_revision: 1, observation: 'I used a disposable restore preview and retained an unrelated file.' })
  const reopened = createStudyService(f.options).pathView(path.id)
  assert.equal(reopened.goal, 'Explain and apply reversible changes')
  assert.equal(reopened.steps[1].evidence.observation, 'I used a disposable restore preview and retained an unrelated file.')
  assert.equal(reopened.steps[1].evidence.attempt_id, null)
  assert.match(reopened.qualification, /learner-reported/)
})

test('revisions reject stale writes, retain old evidence, and changed step meaning needs review', (t) => {
  const f = fixture(t)
  const path = f.service.createPath({ name: 'Revision test', goal: 'Explain the principle', principleIds: ['PRN-000001'], steps: [steps[0]] })
  const attempt = f.service.attempt(path.id, 'PRN-000001', 'Explanation')
  const attemptId = attempt.cards[0].attempts[0].id
  f.service.reveal(path.id, 'PRN-000001', attemptId)
  f.service.rate(path.id, 'PRN-000001', attemptId, { rating: 'comfortable', example: 'My example', revisitOn: '2026-10-30' })
  f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 1, attempt_id: attemptId })
  const changed = [{ ...steps[0], prompt: 'Explain a changed decision and its limits.' }]
  const revised = f.service.revisePath(path.id, { expected_revision: 1, goal: 'Explain the changed principle', steps: changed })
  assert.equal(revised.learning_path.revision, 2)
  assert.equal(revised.learning_path.steps[0].status, 'review')
  assert.equal(revised.learning_path.steps[0].prior_evidence.length, 1)
  const before = readFileSync(join(f.store, 'sessions.json'), 'utf8')
  assert.throws(() => f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 1, attempt_id: attemptId }), /Stale learning path revision/)
  assert.equal(readFileSync(join(f.store, 'sessions.json'), 'utf8'), before)
  assert.throws(() => f.service.revisePath(path.id, { expected_revision: 2, goal: 'bad', steps: [{ ...steps[0], prerequisites: ['later'] }] }), /earlier existing steps/)
  assert.equal(f.service.exportSession(path.id).learning_path.completions.length, 1)
})

test('changed source keeps path evidence historical until explicit source refresh and repetition', (t) => {
  const f = fixture(t)
  const path = f.service.createPath({ name: 'Source binding', goal: 'Explain current source', principleIds: ['PRN-000001'], steps: [steps[0]] })
  const attempt = f.service.attempt(path.id, 'PRN-000001', 'My first explanation.')
  const attemptId = attempt.cards[0].attempts[0].id
  f.service.reveal(path.id, 'PRN-000001', attemptId)
  f.service.rate(path.id, 'PRN-000001', attemptId, { rating: 'partial', example: 'My example', revisitOn: '2026-10-30' })
  f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 1, attempt_id: attemptId })
  f.activate(syntheticStudyText.replace('Prefer bounded changes', 'Prefer carefully bounded changes'))
  const changed = f.service.pathView(path.id).steps[0]
  assert.equal(changed.status, 'unavailable')
  assert.equal(changed.source_state.status, 'changed')
  assert.equal(changed.prior_evidence.length, 1)
  f.service.refresh(path.id, 'PRN-000001')
  assert.equal(f.service.pathView(path.id).steps[0].status, 'review')
})

test('standalone CLI creates, reads, and reopens a path in separate processes', (t) => {
  const f = fixture(t)
  const run = (command, flags = [], status = 0) => {
    const result = spawnSync(process.execPath, [...process.execArgv.filter((arg) => !arg.startsWith('--test')), join(project, 'bin/principles-study.js'), command, '--root', f.root, '--revision', 'path-cli-1', '--store', f.store, ...flags], { encoding: 'utf8' })
    assert.equal(result.status, status, result.stderr)
    return status ? JSON.parse(result.stderr) : JSON.parse(result.stdout)
  }
  const created = run('path-create', ['--name', 'CLI path', '--goal', 'Explain and apply a principle', '--principles', 'PRN-000001', '--steps', JSON.stringify(steps.slice(0, 2))])
  const reopened = run('path-view', ['--session', created.id])
  assert.equal(reopened.goal, 'Explain and apply a principle')
  assert.equal(reopened.steps[0].status, 'available')
  const args = ['--session', created.id, '--principle', 'PRN-000001']
  const attempt = run('attempt', [...args, '--text', 'CLI explanation before reveal.'])
  const attemptId = attempt.cards[0].attempts[0].id
  run('reveal', [...args, '--attempt', attemptId])
  run('rate', [...args, '--attempt', attemptId, '--rating', 'partial', '--example', 'CLI learner example.', '--revisit', '2026-10-30'])
  run('path-record', ['--session', created.id, '--step', 'explain-one', '--expected-revision', '1', '--attempt', attemptId])
  const afterRestart = run('path-view', ['--session', created.id])
  assert.equal(afterRestart.steps[0].status, 'recorded')
  assert.equal(afterRestart.steps[1].status, 'available')
  run('path-record', ['--session', created.id, '--step', 'apply-one', '--expected-revision', '1', '--observation', 'CLI learner reported a result in a disposable example.'])
  assert.equal(run('path-view', ['--session', created.id]).steps[1].evidence.observation, 'CLI learner reported a result in a disposable example.')
  const exported = run('export', ['--session', created.id])
  assert.equal(exported.learning_path.revision, 1)
  assert.match(run('path-record', ['--session', created.id, '--step', 'explain-one', '--expected-revision', '0', '--attempt', 'missing'], 1).error, /Stale learning path revision/)
})
