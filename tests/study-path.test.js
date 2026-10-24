import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs'
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
  const generic = f.service.attempt(path.id, 'PRN-000001', 'Generic explanation before reveal.')
  const genericId = generic.cards[0].attempts[0].id
  assert.throws(() => f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 1, attempt_id: genericId }), /finished attempt/)
  f.service.reveal(path.id, 'PRN-000001', genericId)
  f.service.rate(path.id, 'PRN-000001', genericId, { rating: 'partial', example: 'My generic practice example.', revisitOn: '2026-10-30' })
  assert.throws(() => f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 1, attempt_id: genericId }), /exact step prompt/)
  assert.deepEqual(f.service.pathView(path.id).steps[0].available_attempt_ids, [])
  const attempt = f.service.pathAttempt(path.id, 'explain-one', { expected_revision: 1, text: 'My explanation before reveal.' })
  const attemptId = attempt.cards[0].attempts.at(-1).id
  assert.equal(attempt.cards[0].attempts.at(-1).cue, steps[0].prompt)
  f.service.reveal(path.id, 'PRN-000001', attemptId)
  f.service.rate(path.id, 'PRN-000001', attemptId, { rating: 'partial', example: 'My own example.', revisitOn: '2026-10-30' })
  f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 1, attempt_id: attemptId })
  assert.throws(() => f.service.recordPathStep(path.id, 'explain-two', { expected_revision: 1, attempt_id: attemptId }), /exact step prompt/)
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
  const attempt = f.service.pathAttempt(path.id, 'explain-one', { expected_revision: 1, text: 'Explanation' })
  const attemptId = attempt.cards[0].attempts[0].id
  f.service.reveal(path.id, 'PRN-000001', attemptId)
  f.service.rate(path.id, 'PRN-000001', attemptId, { rating: 'comfortable', example: 'My example', revisitOn: '2026-10-30' })
  f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 1, attempt_id: attemptId })
  const changed = [{ ...steps[0], prompt: 'Explain a changed decision and its limits.' }]
  const revised = f.service.revisePath(path.id, { expected_revision: 1, goal: 'Explain the changed principle', steps: changed })
  assert.equal(revised.learning_path.revision, 2)
  assert.equal(revised.learning_path.steps[0].status, 'review')
  assert.equal(revised.learning_path.steps[0].prior_evidence.length, 1)
  assert.throws(() => f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 2, attempt_id: attemptId }), /exact step prompt/)
  const beforeNewAttempt = readFileSync(join(f.store, 'sessions.json'), 'utf8')
  assert.throws(() => f.service.pathAttempt(path.id, 'explain-one', { expected_revision: 1, text: 'Stale prompt' }), /Stale learning path revision/)
  assert.equal(readFileSync(join(f.store, 'sessions.json'), 'utf8'), beforeNewAttempt)
  const newAttempt = f.service.pathAttempt(path.id, 'explain-one', { expected_revision: 2, text: 'Explanation of the changed prompt' })
  const newAttemptId = newAttempt.cards[0].attempts.at(-1).id
  f.service.reveal(path.id, 'PRN-000001', newAttemptId)
  f.service.rate(path.id, 'PRN-000001', newAttemptId, { rating: 'partial', example: 'My updated example', revisitOn: '2026-10-30' })
  f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 2, attempt_id: newAttemptId })
  assert.equal(f.service.pathView(path.id).steps[0].status, 'recorded')
  const before = readFileSync(join(f.store, 'sessions.json'), 'utf8')
  assert.throws(() => f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 1, attempt_id: attemptId }), /Stale learning path revision/)
  assert.equal(readFileSync(join(f.store, 'sessions.json'), 'utf8'), before)
  assert.throws(() => f.service.revisePath(path.id, { expected_revision: 2, goal: 'bad', steps: [{ ...steps[0], prerequisites: ['later'] }] }), /earlier existing steps/)
  assert.equal(f.service.exportSession(path.id).learning_path.completions.length, 2)
})

test('dependent application evidence binds the exact prerequisite completion it followed', (t) => {
  const f = fixture(t)
  const path = f.service.createPath({ name: 'Bound progression', goal: 'Explain then apply', principleIds: ['PRN-000001'], steps: steps.slice(0, 2) })
  const completeExplanation = (text) => {
    const attempt = f.service.pathAttempt(path.id, 'explain-one', { expected_revision: f.service.pathView(path.id).revision, text })
    const attemptId = attempt.cards[0].attempts.at(-1).id
    f.service.reveal(path.id, 'PRN-000001', attemptId)
    f.service.rate(path.id, 'PRN-000001', attemptId, { rating: 'partial', example: 'My explanation example.', revisitOn: '2026-10-30' })
    f.service.recordPathStep(path.id, 'explain-one', { expected_revision: f.service.pathView(path.id).revision, attempt_id: attemptId })
  }
  completeExplanation('First explanation.')
  f.service.recordPathStep(path.id, 'apply-one', { expected_revision: 1, observation: 'I applied the first explanation in a disposable case.' })
  const first = f.service.pathView(path.id)
  const firstA = first.steps[0].evidence.id
  const oldB = first.steps[1].evidence.id
  assert.deepEqual(first.completions.find((item) => item.id === oldB).prerequisite_bindings, [{
    step_id: 'explain-one', completion_id: firstA,
    step_sha256: first.completions.find((item) => item.id === firstA).step_sha256,
    source_sha256: first.completions.find((item) => item.id === firstA).source_sha256
  }])
  const changedSteps = [{ ...steps[0], prompt: 'Explain the decision again under a changed condition.' }, steps[1]]
  f.service.revisePath(path.id, { expected_revision: 1, goal: 'Explain and apply again', steps: changedSteps })
  completeExplanation('Second explanation.')
  const afterA = f.service.pathView(path.id)
  assert.equal(afterA.steps[0].status, 'recorded')
  assert.equal(afterA.steps[1].status, 'review')
  assert.equal(afterA.steps[1].evidence, null)
  assert.equal(afterA.steps[1].prior_evidence[0].id, oldB)
  f.service.recordPathStep(path.id, 'apply-one', { expected_revision: 2, observation: 'I repeated the application after the changed explanation.' })
  const completed = f.service.pathView(path.id)
  assert.equal(completed.steps[1].status, 'recorded')
  assert.equal(completed.steps[1].prior_evidence.length, 2)
  assert.equal(completed.completions.find((item) => item.id === completed.steps[1].evidence.id).prerequisite_bindings[0].completion_id, completed.steps[0].evidence.id)
})

test('changed source keeps path evidence historical until explicit source refresh and repetition', (t) => {
  const f = fixture(t)
  const path = f.service.createPath({ name: 'Source binding', goal: 'Explain current source', principleIds: ['PRN-000001'], steps: [steps[0]] })
  const attempt = f.service.pathAttempt(path.id, 'explain-one', { expected_revision: 1, text: 'My first explanation.' })
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

test('unavailable source preserves already recorded progress but refuses new path actions', (t) => {
  const f = fixture(t)
  const path = f.service.createPath({ name: 'Offline source', goal: 'Explain then apply', principleIds: ['PRN-000001'], steps })
  const attempt = f.service.pathAttempt(path.id, 'explain-one', { expected_revision: 1, text: 'My explanation.' })
  const attemptId = attempt.cards[0].attempts[0].id
  f.service.reveal(path.id, 'PRN-000001', attemptId)
  f.service.rate(path.id, 'PRN-000001', attemptId, { rating: 'again', example: 'My own report.', revisitOn: '2026-10-30' })
  f.service.recordPathStep(path.id, 'explain-one', { expected_revision: 1, attempt_id: attemptId })
  renameSync(f.root, `${f.root}-offline`)
  const offline = f.service.pathView(path.id)
  assert.equal(offline.steps[0].status, 'recorded')
  assert.equal(offline.steps[0].evidence.attempt_id, attemptId)
  assert.equal(offline.steps[0].source_state.status, 'unavailable')
  assert.equal(offline.steps[1].status, 'unavailable')
  assert.deepEqual(offline.steps[1].blocked_by, undefined)
  assert.equal(offline.steps[2].status, 'unavailable')
  assert.throws(() => f.service.pathAttempt(path.id, 'explain-two', { expected_revision: 1, text: 'Cannot start offline.' }), /unavailable/)
  assert.throws(() => f.service.recordPathStep(path.id, 'apply-one', { expected_revision: 1, observation: 'Cannot record offline.' }), /unavailable/)
  assert.match(f.service.exportSession(path.id, 'markdown'), /My explanation/)
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
  const attempt = run('path-attempt', ['--session', created.id, '--step', 'explain-one', '--expected-revision', '1', '--text', 'CLI explanation before reveal.'])
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
