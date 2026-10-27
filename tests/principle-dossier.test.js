import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { createPrincipleDossierService } from '../src/principle-dossier.js'
import { applyPrincipleEntryRetirement, planPrincipleEntryRetirement } from '../src/mutation.js'
import { validateRepository } from '../src/validator.js'
import { fileSha256 } from '../src/transaction.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const hash = (value) => createHash('sha256').update(value).digest('hex')

function researchAnswer() {
  return {
    studyId: '11111111-1111-4111-8111-111111111111',
    studySha256: hash('synthetic-study'),
    revision: 'synthetic-r03-revision-1',
    questionId: 'study-question:22222222-2222-4222-8222-222222222222',
    questionSha256: hash('synthetic-question'),
    resultStatus: 'completed',
    coverage: 'adequate',
    answer: [{ text: 'A synthetic answer about explicit learner feedback.', evidenceIds: ['citation:synthetic-1'] }],
    gaps: ['No claim is made about long-term transfer.'],
    citations: [{ id: 'citation:synthetic-1', documentId: 'synthetic-document-1', page: 1, start: 0, end: 44, quote: 'Learners benefit from specific feedback.', quoteTruncated: false, notebookId: 'synthetic-notebook', recordId: 'synthetic-record-1', version: '1', sourceDigest: hash('synthetic-source'), sourceTitle: 'Synthetic feedback report' }],
    provenance: { planDigest: hash('synthetic-plan'), resultContentSha256: hash('synthetic-result') },
  }
}

function proposal() {
  return {
    placement: { domain: 'teaching', scope: 'classroom' },
    title: 'Make feedback actionable',
    assertion: 'Give learners feedback that identifies a concrete next step.',
    rationale: 'Specific next steps make the intended adjustment understandable.',
    examples: ['Name the next revision to try.'],
    limits: ['This does not establish long-term learning transfer.'],
    valueAssumptions: ['Learners should have a meaningful opportunity to revise their work.'],
    counterevidence: [{ text: 'Generic praise alone may not guide a revision.', evidenceIds: ['citation:synthetic-1'] }],
    selectedEvidenceIds: ['citation:synthetic-1'],
  }
}

function copySyntheticRepository(directory) {
  cpSync(root, directory, {
    recursive: true,
    filter(source) {
      const relative = source.startsWith(`${root}/`) ? source.slice(root.length + 1) : ''
      return relative !== '.git' && !relative.startsWith('.git/') && relative !== 'node_modules' && !relative.endsWith('/node_modules')
    },
  })
  symlinkSync(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir')
}

test('proposal review adopts and activates only through canonical corpus owners; retirement is exact, transactional and scope-bounded', async (t) => {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'principle-lifecycle-')))
  t.after(() => rmSync(temporary, { recursive: true, force: true }))
  const syntheticRoot = join(temporary, 'repo')
  copySyntheticRepository(syntheticRoot)
  const store = join(temporary, 'dossiers')
  const service = createPrincipleDossierService({
    root: syntheticRoot,
    store,
    adoptionTargets: [{ id: 'teaching-classroom', path: 'domains/teaching/classroom.md' }],
    idFactory: () => '33333333-3333-4333-8333-333333333333',
    clock: () => '2026-10-27T12:00:00.000Z',
  })

  const created = await service.propose({ proposal: proposal(), research: researchAnswer() })
  assert.equal(created.status, 'proposed')
  assert.equal(created.research.verification.status, 'caller_asserted')
  assert.deepEqual(created.proposal.valueAssumptions, proposal().valueAssumptions)
  assert.throws(() => service.review({ id: created.id, version: created.version, versionSha256: created.versionSha256, disposition: 'accept', reviewer: 'Synthetic human reviewer', reviewerKind: 'human', supportOutcome: 'strong', counterevidenceReviewed: true, limitsReviewed: true }), /value assumptions/u)
  const review = service.review({ id: created.id, version: created.version, versionSha256: created.versionSha256, disposition: 'accept', reviewer: 'Synthetic human reviewer', reviewerKind: 'human', supportOutcome: 'strong', counterevidenceReviewed: true, limitsReviewed: true, valueAssumptionsReviewed: true })
  const reviewedEvent = review.events.find((event) => event.kind === 'reviewed')
  assert.ok(reviewedEvent)

  const adopted = service.adopt({ id: created.id, version: created.version, versionSha256: created.versionSha256, targetId: 'teaching-classroom', sourceMap: [{ researchCitationId: 'citation:synthetic-1', sourceId: 'SRC-000001' }] })
  assert.equal(adopted.status, 'canonical_draft')
  assert.equal(adopted.canonical.fileStatus, 'draft')
  const adoptedText = readFileSync(join(syntheticRoot, adopted.canonical.path), 'utf8')
  assert.match(adoptedText, /caller asserted[\s\S]*not evidence of truth/u)
  assert.match(adoptedText, /Value assumption/u)
  assert.match(adoptedText, /SRC-000001/u)
  assert.match(adoptedText, /PRN-\d{6} — Make feedback actionable/u)
  assert.equal(validateRepository(syntheticRoot).bag.errorCount, 0)

  const active = service.activate({ id: created.id, version: created.version, versionSha256: created.versionSha256, reviewEventSha256: reviewedEvent.event_sha256, reviewedAt: '2026-10-27' })
  assert.equal(active.status, 'canonical_active')
  assert.equal(active.canonical.fileStatus, 'active')
  assert.equal(validateRepository(syntheticRoot).bag.errorCount, 0)
  assert.throws(() => service.retire({ id: created.id, version: created.version, versionSha256: created.versionSha256, reviewer: 'Synthetic human reviewer', reason: 'Retire the synthetic proposal.', retiredAt: '2026-10-27', expectedFileSha256: fileSha256(syntheticRoot, active.canonical.path), expectedSemanticSha256: active.canonical.semanticSha256, demoteRemainingEntries: true }), /final entry in a corpus document/u)

  // Retirement on a multi-entry active file requires explicit agreement that
  // its remaining entries return to draft for a new whole-file review.
  const retirementPath = 'domains/coding/testing.md'
  const before = validateRepository(syntheticRoot)
  assert.equal(before.bag.errorCount, 0)
  const beforeDocument = before.state.corpus.documents.find((document) => document.path === retirementPath)
  const targetEntry = beforeDocument.entries[0]
  const plan = planPrincipleEntryRetirement(syntheticRoot, before, {
    path: retirementPath,
    entryId: targetEntry.id,
    expectedFileSha256: fileSha256(syntheticRoot, retirementPath),
    expectedSemanticSha256: beforeDocument.semanticSha256,
    demoteRemainingEntries: true,
  })
  assert.match(plan.entry_content, new RegExp(targetEntry.id))
  assert.equal(plan.demoted_active_file, true)
  assert.throws(() => applyPrincipleEntryRetirement(syntheticRoot, { ...plan, corpus_content: `${plan.corpus_content}\n` }, () => validateRepository(syntheticRoot)), /plan changed after review/u)
  applyPrincipleEntryRetirement(syntheticRoot, plan, () => validateRepository(syntheticRoot))
  const after = validateRepository(syntheticRoot)
  assert.equal(after.bag.errorCount, 0)
  const afterDocument = after.state.corpus.documents.find((document) => document.path === retirementPath)
  assert.equal(afterDocument.entries.some((entry) => entry.id === targetEntry.id), false)
  assert.equal(afterDocument.frontmatter.status, 'draft')
  assert.equal(after.state.ledger.principles.retired.includes(targetEntry.id), true)
  assert.equal(afterDocument.entries.length, beforeDocument.entries.length - 1)
  assert.deepEqual(afterDocument.entries.map((entry) => entry.id), beforeDocument.entries.slice(1).map((entry) => entry.id))
  assert.throws(() => planPrincipleEntryRetirement(syntheticRoot, before, { path: retirementPath, entryId: targetEntry.id, expectedFileSha256: plan.prior_file_sha256, expectedSemanticSha256: beforeDocument.semanticSha256, demoteRemainingEntries: true }), /file changed since retirement review/u)
})

test('owner mutation IDs survive cold replay and keep unprovable canonical crash windows unknown', async (t) => {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'principle-request-recovery-')))
  t.after(() => rmSync(temporary, { recursive: true, force: true }))
  const syntheticRoot = join(temporary, 'repo')
  copySyntheticRepository(syntheticRoot)
  const store = join(temporary, 'dossiers')
  const settings = {
    root: syntheticRoot,
    store,
    adoptionTargets: [{ id: 'teaching-classroom', path: 'domains/teaching/classroom.md' }],
    idFactory: () => '33333333-3333-4333-8333-333333333333',
    clock: () => '2026-10-27T12:00:00.000Z',
  }
  const createService = () => createPrincipleDossierService(settings)
  const initial = createService()
  const research = researchAnswer()
  const proposalRequest = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const proposalInput = { proposal: proposal(), research }
  const created = await initial.mutate({ requestId: proposalRequest, operation: 'propose', input: proposalInput })
  assert.equal(created.status, 'confirmed')
  assert.equal(created.result.id, proposalRequest)
  assert.deepEqual(await createService().mutate({ requestId: proposalRequest, operation: 'propose', input: proposalInput }), created)
  assert.equal((await createService().mutate({ requestId: proposalRequest, operation: 'propose', input: { ...proposalInput, proposal: { ...proposal(), title: 'Changed body' } } })).status, 'rejected')
  assert.deepEqual(await createService().recoverMutation({ requestId: proposalRequest }), created)

  const resetJournal = (requestId) => {
    const path = join(store, 'requests', `${requestId}.json`)
    const journal = JSON.parse(readFileSync(path, 'utf8'))
    journal.status = 'unknown'
    delete journal.result
    delete journal.completed_at
    writeFileSync(path, `${JSON.stringify(journal, null, 2)}\n`)
  }
  const removeCompletedEvent = (recordId, kind) => {
    const path = join(store, `${recordId}.json`)
    const record = JSON.parse(readFileSync(path, 'utf8'))
    assert.equal(record.events.at(-1)?.kind, kind)
    record.events.pop()
    writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`)
  }
  const reviewRequest = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const reviewInput = {
    id: created.result.id,
    version: created.result.version,
    versionSha256: created.result.versionSha256,
    disposition: 'accept',
    reviewer: 'Synthetic human reviewer',
    supportOutcome: 'strong',
    counterevidenceReviewed: true,
    limitsReviewed: true,
    valueAssumptionsReviewed: true,
  }
  const reviewed = await initial.mutate({ requestId: reviewRequest, operation: 'review', input: reviewInput })
  assert.equal(reviewed.status, 'confirmed')
  resetJournal(reviewRequest)
  const recoveredReview = await createService().recoverMutation({ requestId: reviewRequest })
  assert.equal(recoveredReview.status, 'confirmed')
  assert.equal(recoveredReview.result.events.at(-1).request_id, reviewRequest)

  const adoptRequest = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  const adoptInput = {
    id: created.result.id,
    version: 1,
    versionSha256: created.result.versionSha256,
    targetId: 'teaching-classroom',
    sourceMap: [{ researchCitationId: 'citation:synthetic-1', sourceId: 'SRC-000001' }],
  }
  const adopted = await createService().mutate({ requestId: adoptRequest, operation: 'adopt', input: adoptInput })
  assert.equal(adopted.status, 'confirmed')
  resetJournal(adoptRequest)
  const recordPath = join(store, `${created.result.id}.json`)
  const adoptedRecord = readFileSync(recordPath)
  removeCompletedEvent(created.result.id, 'adopted')
  const recoveredAdoption = await createService().recoverMutation({ requestId: adoptRequest })
  assert.equal(recoveredAdoption.status, 'unknown')
  assert.equal(validateRepository(syntheticRoot).state.corpus.documents.some((document) => document.path === 'domains/teaching/classroom.md' && document.frontmatter.status === 'draft'), true)
  assert.equal(createService().read(created.result.id).events.at(-1).kind, 'adoption_prepared')
  writeFileSync(recordPath, adoptedRecord)

  const activationRequest = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  const reviewEvent = reviewed.result.events.find((event) => event.kind === 'reviewed')
  const activationInput = {
    id: created.result.id,
    version: 1,
    versionSha256: created.result.versionSha256,
    reviewEventSha256: reviewEvent.event_sha256,
    reviewedAt: '2026-10-27',
  }
  const activated = await createService().mutate({ requestId: activationRequest, operation: 'activate', input: activationInput })
  assert.equal(activated.status, 'confirmed')
  resetJournal(activationRequest)
  const activatedRecord = readFileSync(recordPath)
  removeCompletedEvent(created.result.id, 'activated')
  const recoveredActivation = await createService().recoverMutation({ requestId: activationRequest })
  assert.equal(recoveredActivation.status, 'unknown')
  assert.equal(validateRepository(syntheticRoot).state.corpus.documents.some((document) => document.path === 'domains/teaching/classroom.md' && document.frontmatter.status === 'active'), true)
  assert.equal(createService().read(created.result.id).events.at(-1).kind, 'activation_prepared')
  writeFileSync(recordPath, activatedRecord)

  const fencedRequest = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  assert.equal((await createService().recoverMutation({ requestId: fencedRequest })).status, 'not_seen')
  const lateDelivery = await createService().mutate({ requestId: fencedRequest, operation: 'propose', input: proposalInput })
  assert.equal(lateDelivery.status, 'not_seen')
  assert.equal(existsSync(join(store, 'requests', `${fencedRequest}.json`)), true)
})
