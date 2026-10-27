import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import canonicalize from 'canonicalize'
import { createPrincipleDossierService } from '../src/principle-dossier.js'
import { applyPrincipleEntryRetirement, planPrincipleEntryRetirement } from '../src/mutation.js'
import { validateRepository } from '../src/validator.js'
import { fileSha256 } from '../src/transaction.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const hash = (value) => createHash('sha256').update(value).digest('hex')
const canonicalHash = (value) => createHash('sha256').update(canonicalize(value)).digest('hex')

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
    applicability: 'Use when learners can act on feedback through a subsequent revision.',
    exceptions: ['Do not require an immediate revision when safety or access needs make that impractical.'],
    examples: ['Name the next revision to try.'],
    limits: ['This does not establish long-term learning transfer.'],
    valueAssumptions: ['Learners should have a meaningful opportunity to revise their work.'],
    counterevidence: [{ text: 'Generic praise alone may not guide a revision.', evidenceIds: ['citation:synthetic-1'] }],
    selectedEvidenceIds: ['citation:synthetic-1'],
  }
}

function contextualCritiqueRef() {
  return {
    schema: 'principles.contextual-critique-reference/1', decisionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', version: 1, versionSha256: hash('atlas-version'),
    principleId: 'PRN-000001', field: 'statement', index: 0, claimSha256: hash('authored-claim'), claimText: 'A synthetic authored claim.', sourceIds: ['SRC-000001'],
    category: 'exception', text: 'A human-authored exception for one boundary case.', corpusRevision: hash('atlas-corpus'), ownerRevision: 'a'.repeat(40), currentnessAtAppend: 'current',
    qualification: 'The exact canonical claim was current at append time; SRC IDs are registry metadata, not Research citations or proof of external content.'
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
  assert.equal(created.proposal.applicability, proposal().applicability)
  assert.deepEqual(created.proposal.exceptions, proposal().exceptions)
  const legacyId = '99999999-9999-4999-8999-999999999999'
  await service.propose({ proposal: proposal(), research: researchAnswer(), dossierId: legacyId })
  const legacyPath = join(store, `${legacyId}.json`)
  const legacyRecord = JSON.parse(readFileSync(legacyPath, 'utf8'))
  delete legacyRecord.versions[0].proposal.applicability
  delete legacyRecord.versions[0].proposal.exceptions
  legacyRecord.versions[0].version_sha256 = canonicalHash({ proposal: legacyRecord.versions[0].proposal, research: legacyRecord.versions[0].research })
  legacyRecord.events[0].version_sha256 = legacyRecord.versions[0].version_sha256
  const { event_sha256: _oldEventDigest, ...legacyEventPayload } = legacyRecord.events[0]
  legacyRecord.events[0].event_sha256 = canonicalHash(legacyEventPayload)
  writeFileSync(legacyPath, JSON.stringify(legacyRecord))
  const reopenedLegacy = service.read(legacyId)
  assert.equal(Object.hasOwn(reopenedLegacy.proposal, 'applicability'), false)
  assert.equal(Object.hasOwn(reopenedLegacy.proposal, 'exceptions'), false)
  const freshResearch = researchAnswer()
  freshResearch.studyId = '55555555-5555-4555-8555-555555555555'
  freshResearch.studySha256 = hash('fresh-study')
  freshResearch.questionId = 'study-question:66666666-6666-4666-8666-666666666666'
  freshResearch.questionSha256 = hash('fresh-question')
  freshResearch.citations[0].sourceDigest = hash('fresh-source-revision')
  freshResearch.provenance = { planDigest: hash('fresh-plan'), resultContentSha256: hash('fresh-result') }
  await assert.rejects(
    service.propose({ proposal: proposal(), research: researchAnswer(), supersedes: { id: created.id, version: created.version, versionSha256: created.versionSha256 }, dossierId: '77777777-7777-4777-8777-777777777777' }),
    /distinct retained Research answer or source revision/u,
  )
  const successor = await service.propose({
    proposal: { ...proposal(), rationale: created.proposal.rationale },
    research: freshResearch,
    supersedes: { id: created.id, version: created.version, versionSha256: created.versionSha256 },
    dossierId: '88888888-8888-4888-8888-888888888888',
  })
  assert.deepEqual(successor.supersedes, { id: created.id, version: created.version, versionSha256: created.versionSha256 })
  assert.equal(successor.proposal.rationale, created.proposal.rationale)
  assert.equal(service.read(created.id).proposal.rationale, created.proposal.rationale)
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
  assert.match(adoptedText, /Use when learners can act on feedback/u)
  assert.match(adoptedText, /Exception: Do not require an immediate revision/u)
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

test('Atlas critique references are retained metadata and preserve absent-field dossier digests', async (t) => {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'principle-atlas-dossier-ref-')))
  t.after(() => rmSync(temporary, { recursive: true, force: true }))
  const syntheticRoot = join(temporary, 'repo')
  copySyntheticRepository(syntheticRoot)
  const store = join(temporary, 'dossiers')
  const service = createPrincipleDossierService({ root: syntheticRoot, store, adoptionTargets: [{ id: 'teaching-classroom', path: 'domains/teaching/classroom.md' }] })
  const ref = contextualCritiqueRef()
  const withRef = await service.propose({ proposal: { ...proposal(), contextualCritiqueRefs: [ref] }, research: researchAnswer(), dossierId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' })
  assert.deepEqual(withRef.proposal.contextualCritiqueRefs, [ref])
  const cold = service.read(withRef.id)
  assert.deepEqual(cold.proposal.contextualCritiqueRefs, [ref])
  assert.match(cold.proposal.contextualCritiqueRefs[0].qualification, /registry metadata/)
  const exported = service.export({ id: withRef.id })
  assert.deepEqual(exported.dossier.proposal.contextualCritiqueRefs, [ref])
  const reviewed = service.review({ id: withRef.id, version: withRef.version, versionSha256: withRef.versionSha256, disposition: 'accept', reviewer: 'Synthetic dossier reviewer', reviewerKind: 'human', supportOutcome: 'strong', counterevidenceReviewed: true, limitsReviewed: true, valueAssumptionsReviewed: true })
  const adopted = service.adopt({ id: reviewed.id, version: reviewed.version, versionSha256: reviewed.versionSha256, targetId: 'teaching-classroom', sourceMap: [{ researchCitationId: 'citation:synthetic-1', sourceId: 'SRC-000001' }] })
  const adoptedText = readFileSync(join(syntheticRoot, adopted.canonical.path), 'utf8')
  assert.equal(adoptedText.includes(ref.text), false)
  assert.equal(adoptedText.includes(ref.claimText), false)
  await assert.rejects(service.propose({ proposal: { ...proposal(), contextualCritiqueRefs: [{ ...ref, sourceIds: ['citation:synthetic-1'] }] }, research: researchAnswer(), dossierId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }), /SRC IDs/u)

  const withoutRef = await service.propose({ proposal: proposal(), research: researchAnswer(), dossierId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' })
  const path = join(store, `${withoutRef.id}.json`)
  const before = JSON.parse(readFileSync(path, 'utf8'))
  assert.equal(Object.hasOwn(before.versions[0].proposal, 'contextualCritiqueRefs'), false)
  assert.equal(service.read(withoutRef.id).versionSha256, before.versions[0].version_sha256)
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
