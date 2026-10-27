import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const node = process.execPath
const hash = (value) => createHash('sha256').update(value).digest('hex')
const ids = {
  proposal: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  revise: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  successor: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  review: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  adopt: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  activate: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
}

function research(suffix) {
  return {
    studyId: `11111111-1111-4111-8111-11111111111${suffix}`,
    studySha256: hash(`study-${suffix}`),
    revision: `synthetic-r03-revision-${suffix}`,
    questionId: `study-question:22222222-2222-4222-8222-22222222222${suffix}`,
    questionSha256: hash(`question-${suffix}`),
    resultStatus: 'completed',
    coverage: 'adequate',
    answer: [{ text: `Synthetic retained finding ${suffix}.`, evidenceIds: [`citation:synthetic-${suffix}`] }],
    gaps: ['No claim is made about long-term transfer.'],
    citations: [{ id: `citation:synthetic-${suffix}`, documentId: `synthetic-document-${suffix}`, page: 1, start: 0, end: 30, quote: `Synthetic finding ${suffix}.`, quoteTruncated: false, notebookId: `synthetic-notebook-${suffix}`, recordId: `synthetic-record-${suffix}`, version: '1', sourceDigest: hash(`source-${suffix}`), sourceTitle: `Synthetic report ${suffix}` }],
    provenance: { planDigest: hash(`plan-${suffix}`), resultContentSha256: hash(`result-${suffix}`) },
  }
}

function proposal(title = 'Make feedback actionable') {
  return {
    placement: { domain: 'teaching', scope: 'classroom' },
    title,
    assertion: 'Give learners feedback that identifies a concrete next step.',
    rationale: 'Specific next steps make the intended adjustment understandable.',
    applicability: 'Use when learners can act on feedback through a subsequent revision.',
    exceptions: ['Do not require an immediate revision when safety or access needs make that impractical.'],
    examples: ['Name the next revision to try.'],
    limits: ['This does not establish long-term learning transfer.'],
    valueAssumptions: ['Learners should have a meaningful opportunity to revise their work.'],
    counterevidence: [{ text: 'Generic praise alone may not guide a revision.', evidenceIds: ['citation:synthetic-1'] }],
    selectedEvidenceIds: ['citation:synthetic-1'],
  }
}

function copyRepository(destination) {
  cpSync(repo, destination, {
    recursive: true,
    filter(source) {
      const relative = source.startsWith(`${repo}/`) ? source.slice(repo.length + 1) : ''
      return relative !== '.git' && !relative.startsWith('.git/') && relative !== 'node_modules' && !relative.endsWith('/node_modules')
    },
  })
  symlinkSync(join(repo, 'node_modules'), join(destination, 'node_modules'), 'dir')
}

test('standalone dossier CLI recovers, revises, succeeds, adopts, activates and cold-reads one synthetic lifecycle', (t) => {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'principle-dossier-cli-')))
  t.after(() => rmSync(temporary, { recursive: true, force: true }))
  const syntheticRoot = join(temporary, 'repo')
  copyRepository(syntheticRoot)
  const store = join(temporary, 'dossiers')
  const targets = join(temporary, 'targets.json')
  writeFileSync(targets, JSON.stringify([{ id: 'teaching-classroom', path: 'domains/teaching/classroom.md' }]))
  const call = (command, input = undefined, requestId = undefined, extras = []) => {
    const args = [join(repo, 'bin/principle-dossier.js'), command, '--root', syntheticRoot, '--store', store, '--targets', targets, ...extras]
    if (requestId) args.push('--request-id', requestId)
    let inputPath
    if (input !== undefined) {
      inputPath = join(temporary, `${requestId}.json`)
      writeFileSync(inputPath, JSON.stringify(input))
      args.push('--input', inputPath)
    }
    const result = spawnSync(node, args, { cwd: repo, encoding: 'utf8' })
    return { code: result.status, stdout: result.stdout, stderr: result.stderr, value: result.stdout ? JSON.parse(result.stdout) : undefined }
  }

  const duplicateOption = spawnSync(node, [join(repo, 'bin/principle-dossier.js'), 'list', '--root', syntheticRoot, '--root', syntheticRoot, '--store', store, '--targets', targets], { cwd: repo, encoding: 'utf8' })
  assert.equal(duplicateOption.status, 2)
  assert.match(duplicateOption.stderr, /Duplicate option --root/u)
  const unknownOption = spawnSync(node, [join(repo, 'bin/principle-dossier.js'), 'list', '--root', syntheticRoot, '--store', store, '--targets', targets, '--typo'], { cwd: repo, encoding: 'utf8' })
  assert.equal(unknownOption.status, 2)
  assert.match(unknownOption.stderr, /Unknown option/u)
  const missingRoot = spawnSync(node, [join(repo, 'bin/principle-dossier.js'), 'list', '--store', store, '--targets', targets], { cwd: repo, encoding: 'utf8' })
  assert.equal(missingRoot.status, 2)
  assert.match(missingRoot.stderr, /explicit --root/u)

  const initial = { proposal: proposal(), research: research('1') }
  const created = call('propose', initial, ids.proposal)
  assert.equal(created.code, 0, created.stderr)
  assert.equal(created.value.status, 'confirmed')
  assert.equal(created.value.result.research.verification.status, 'caller_asserted')
  assert.equal(created.value.result.proposal.applicability, initial.proposal.applicability)
  assert.deepEqual(created.value.result.proposal.exceptions, initial.proposal.exceptions)

  const requestPath = join(store, 'requests', `${ids.proposal}.json`)
  const journal = JSON.parse(readFileSync(requestPath, 'utf8'))
  journal.status = 'unknown'
  delete journal.result
  delete journal.completed_at
  writeFileSync(requestPath, `${JSON.stringify(journal, null, 2)}\n`)
  assert.equal(call('recover', undefined, ids.proposal).value.status, 'confirmed')
  const conflict = call('propose', { ...initial, proposal: proposal('Conflicting replay') }, ids.proposal)
  assert.equal(conflict.value.status, 'rejected')
  assert.equal(conflict.code, 1)
  const unseen = '12121212-1212-4121-8121-121212121212'
  const fenced = call('recover', undefined, unseen)
  assert.equal(fenced.value.status, 'not_seen')
  assert.equal(fenced.code, 1)
  const fencedReuse = call('propose', initial, unseen)
  assert.equal(fencedReuse.value.status, 'not_seen')
  assert.equal(fencedReuse.code, 1)

  const malformed = '13131313-1313-4131-8131-131313131313'
  writeFileSync(join(store, 'requests', `${malformed}.json`), '{malformed journal\n')
  const unknown = call('recover', undefined, malformed)
  assert.equal(unknown.value.status, 'unknown')
  assert.equal(unknown.code, 3)

  const revisedInput = {
    id: ids.proposal,
    expectedVersion: 1,
    proposal: { ...proposal(), rationale: 'A clearer synthetic rationale retained with the revision.' },
  }
  const revised = call('revise', revisedInput, ids.revise)
  assert.equal(revised.code, 0, revised.stderr)
  assert.equal(revised.value.result.version, 2)

  const nextResearch = research('2')
  const successorInput = {
    proposal: { ...proposal('Make feedback actionable after review'), counterevidence: [{ text: 'Generic praise alone may not guide a revision.', evidenceIds: ['citation:synthetic-2'] }], selectedEvidenceIds: ['citation:synthetic-2'] },
    research: nextResearch,
    supersedes: { id: ids.proposal, version: 2, versionSha256: revised.value.result.versionSha256 },
  }
  const successor = call('propose', successorInput, ids.successor)
  assert.equal(successor.code, 0, successor.stderr)
  assert.deepEqual(successor.value.result.supersedes, successorInput.supersedes)
  assert.deepEqual(call('show', undefined, undefined, ['--id', ids.proposal]).value.proposal.exceptions, initial.proposal.exceptions)

  const base = { id: ids.successor, version: 1, versionSha256: successor.value.result.versionSha256 }
  const reviewed = call('review', {
    ...base,
    disposition: 'accept',
    reviewer: 'Synthetic human reviewer',
    supportOutcome: 'strong',
    counterevidenceReviewed: true,
    limitsReviewed: true,
    valueAssumptionsReviewed: true,
  }, ids.review)
  assert.equal(reviewed.code, 0, reviewed.stderr)
  const adopted = call('adopt', {
    ...base,
    targetId: 'teaching-classroom',
    sourceMap: [{ researchCitationId: 'citation:synthetic-2', sourceId: 'SRC-000001' }],
  }, ids.adopt)
  assert.equal(adopted.code, 0, adopted.stderr)
  const reviewEvent = reviewed.value.result.events.find((event) => event.kind === 'reviewed')
  const activated = call('activate', {
    ...base,
    reviewEventSha256: reviewEvent.event_sha256,
    reviewedAt: '2026-10-27',
  }, ids.activate)
  assert.equal(activated.code, 0, activated.stderr)
  assert.equal(activated.value.result.status, 'canonical_active')
  assert.equal(call('list').value.some((item) => item.id === ids.successor && item.status === 'canonical_active'), true)
  const cold = call('show', undefined, undefined, ['--id', ids.successor])
  assert.equal(cold.code, 0, cold.stderr)
  assert.equal(cold.value.proposal.applicability, successorInput.proposal.applicability)
  assert.equal(cold.value.events.some((event) => event.kind === 'activated'), true)
})
