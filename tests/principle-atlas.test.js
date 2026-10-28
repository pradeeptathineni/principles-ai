import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { createPrincipleAtlasService } from '../src/principle-atlas.js'
import { validateRepository } from '../src/validator.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const revision = 'a'.repeat(40)
const ids = {
  create: '12121212-1212-4121-8121-121212121212',
  successor: '23232323-2323-4232-8232-232323232323',
  staleSave: '34343434-3434-4343-8343-343434343434',
}

function copySyntheticRepository(destination) {
  cpSync(root, destination, {
    recursive: true,
    filter(source) {
      const relative = source.startsWith(`${root}/`) ? source.slice(root.length + 1) : ''
      return relative !== '.git' && !relative.startsWith('.git/') && relative !== 'node_modules' && !relative.endsWith('/node_modules') && !relative.startsWith('.local/')
    },
  })
  const modules = process.env.PRINCIPLES_ATLAS_TEST_NODE_MODULES || join(root, 'node_modules')
  if (existsSync(modules)) symlinkSync(modules, join(destination, 'node_modules'), 'dir')
}

function choicePair(repository) {
  const validated = validateRepository(repository)
  assert.equal(validated.bag.errorCount, 0, validated.bag.sorted().slice(0, 5).map((item) => `${item.path}: ${item.code}`).join('\n'))
  for (const document of validated.state.corpus.documents) {
    for (let left = 0; left < document.entries.length; left += 1) {
      for (let right = left + 1; right < document.entries.length; right += 1) {
        const sourceByLabel = new Map(document.references.map((reference) => [reference.label, reference.sourceId]))
        const sourceIds = (entry) => [...new Set(entry.claims.flatMap((claim) => claim.citationLabels.map((label) => sourceByLabel.get(label)).filter(Boolean)))].sort()
        const shared = sourceIds(document.entries[left]).filter((id) => sourceIds(document.entries[right]).includes(id))
        const activeShared = shared.find((id) => validated.state.sourceById.get(id)?.value.status === 'active')
        if (activeShared) return { ids: [document.entries[left].id, document.entries[right].id], sourceId: activeShared, document }
      }
    }
  }
  throw new Error('Synthetic fixture needs two principles with a shared current source identity.')
}

function decisionInput(principleIds, expectedCorpusRevision, extra = {}) {
  return {
    title: 'Synthetic contextual comparison',
    reviewer: 'Synthetic reviewer',
    context: 'A small synthetic decision where a temporary response may limit later assessment.',
    applicability: 'Apply the first principle only when the immediate risk is time-sensitive; apply the second when follow-up review is available.',
    exceptions: ['If immediate harm is likely, defer the slower review step and document why.'],
    valueAssumptions: ['Protecting people from immediate harm takes priority over completeness in the first response.'],
    tradeoffs: ['Immediate response speed may reduce the evidence available for later assessment.'],
    judgment: 'Use a proportionate first response, then reassess using the retained follow-up evidence.',
    principleIds,
    expectedCorpusRevision,
    ...extra,
  }
}

test('atlas search, contextual decision, cold reopen, source-change revisit and successor use exact owner identities', (t) => {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'principle-atlas-')))
  t.after(() => rmSync(temporary, { recursive: true, force: true }))
  const syntheticRoot = join(temporary, 'corpus')
  copySyntheticRepository(syntheticRoot)
  const pair = choicePair(syntheticRoot)
  const store = join(temporary, 'private-atlas')
  const service = createPrincipleAtlasService({ root: syntheticRoot, store, ownerRevision: revision, idFactory: () => ids.create, clock: () => '2026-10-27T12:00:00.000Z' })

  const search = service.search({ query: pair.document.entries[0].title })
  assert.equal(search.schema, 'principles.domain-atlas/1')
  assert.ok(search.matches.some((match) => match.principleId === pair.ids[0]))
  assert.equal(search.matchMethod, 'literal-substring')
  assert.match(search.qualification, /do not establish semantic applicability, conflict, truth, or entailment/)

  const shown = service.show({ entryId: pair.ids[0] })
  assert.equal(shown.entry.principleId, pair.ids[0])
  assert.ok(shown.entry.why.length > 0 || shown.entry.practices.length > 0)
  assert.ok([shown.entry.statement, ...shown.entry.why, ...shown.entry.practices, ...shown.entry.applicability, ...shown.entry.goals].some((claim) => claim?.sources.some((item) => item.sourceId === pair.sourceId)))
  const sourceRecord = service.source({ sourceId: pair.sourceId })
  assert.equal(sourceRecord.source.sourceId, pair.sourceId)
  assert.match(sourceRecord.qualification, /No source was fetched/)

  const comparison = service.compare({ entryIds: pair.ids })
  assert.ok(comparison.structuralSignals.some((item) => item.kind === 'shared-source-identity' && item.sourceIds.includes(pair.sourceId)))
  assert.match(comparison.qualification, /No automatic semantic conflict/)
  const created = service.createDecision({ requestId: ids.create, input: decisionInput(pair.ids, comparison.corpusRevision) })
  assert.equal(created.status, 'confirmed')
  const payload = created.result.versions[0].payload
  assert.equal(payload.reviewerKind, 'caller_asserted_human')
  assert.equal(payload.basis.principles.length, 2)
  assert.equal(payload.basis.sources.find((source) => source.sourceId === pair.sourceId).status, 'active')
  assert.ok(payload.comparisonSignals.some((item) => item.kind === 'shared-source-identity'))
  assert.equal(payload.predecessor, undefined)
  assert.match(payload.qualification, /not evidence of truth/)

  const coldService = createPrincipleAtlasService({ root: syntheticRoot, store, ownerRevision: revision })
  const cold = coldService.readDecision({ decisionId: ids.create })
  assert.equal(cold.decision.versions[0].sha256, created.result.versions[0].sha256)
  assert.equal(cold.currentness.status, 'current')
  assert.equal(coldService.recoverMutation({ requestId: ids.create }).status, 'confirmed')
  assert.equal(coldService.createDecision({ requestId: ids.create, input: decisionInput(pair.ids, comparison.corpusRevision, { judgment: 'Different exact input.' }) }).status, 'rejected')

  const sourcePath = join(syntheticRoot, `sources/${pair.sourceId}.yaml`)
  const sourceBefore = readFileSync(sourcePath, 'utf8')
  assert.match(sourceBefore, /status: active/)
  writeFileSync(sourcePath, sourceBefore.replace('status: active', 'status: withdrawn'))
  const stale = coldService.revisit({ decisionId: ids.create })
  assert.equal(stale.currentness.status, 'changed')
  assert.ok(stale.currentness.changedSources.includes(pair.sourceId))

  const oldBasisWrite = coldService.createDecision({ requestId: ids.staleSave, input: decisionInput(pair.ids, comparison.corpusRevision) })
  assert.equal(oldBasisWrite.status, 'rejected')
  assert.equal(coldService.recoverMutation({ requestId: ids.staleSave }).status, 'not_seen')
  const freshComparison = coldService.compare({ entryIds: pair.ids })
  const blockedSuccessor = coldService.createSuccessor({ requestId: ids.successor, input: decisionInput(pair.ids, freshComparison.corpusRevision, { predecessorDecisionId: ids.create, acknowledgedChangedBasis: false }) })
  assert.equal(blockedSuccessor.status, 'rejected')
  const successorId = '45454545-4545-4454-8454-454545454545'
  const successor = coldService.createSuccessor({ requestId: successorId, input: decisionInput(pair.ids, freshComparison.corpusRevision, { predecessorDecisionId: ids.create, acknowledgedChangedBasis: true, judgment: 'Fresh judgment after the source registry changed.' }) })
  assert.equal(successor.status, 'confirmed')
  assert.equal(successor.result.versions[0].payload.predecessor.decisionId, ids.create)
  assert.equal(successor.result.versions[0].payload.acknowledgedChangedBasis, true)
  assert.equal(successor.result.versions[0].payload.judgment, 'Fresh judgment after the source registry changed.')
  assert.equal(successor.result.versions[0].payload.basis.sources.find((source) => source.sourceId === pair.sourceId).status, 'withdrawn')
  assert.equal(coldService.readDecision({ decisionId: successorId }).currentness.status, 'current')
  assert.equal(validateRepository(syntheticRoot).bag.errorCount, 0)
})

test('reviewed experience evidence is closed on a contextual successor and remains readable by the accepted prior owner', async (t) => {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'principle-experience-evidence-')))
  t.after(() => rmSync(temporary, { recursive: true, force: true }))
  const syntheticRoot = join(temporary, 'corpus')
  copySyntheticRepository(syntheticRoot)
  const pair = choicePair(syntheticRoot)
  const store = join(temporary, 'private-atlas')
  const service = createPrincipleAtlasService({ root: syntheticRoot, store, ownerRevision: revision })
  const compared = service.compare({ entryIds: pair.ids })
  const predecessorId = '78787878-7878-4878-8878-787878787878'
  const predecessor = service.createDecision({ requestId: predecessorId, input: decisionInput(pair.ids, compared.corpusRevision) })
  assert.equal(predecessor.status, 'confirmed', predecessor.message)

  const experienceEvidence = {
    schema: 'principles.experience-guidance-evidence/1',
    planningReflection: {
      owner: 'planning-ai', ownerRevision: '8f1ccf3a79e1720c3714681438264f6d0db0821a',
      kind: 'reflection', id: '89898989-8989-4898-8898-898989898989', revision: 1, sha256: 'a'.repeat(64)
    },
    sandboxComparison: {
      owner: 'sandbox-ai', ownerRevision: '00daf57159c179a2c2d80b20541d8649e96526d4',
      kind: 'paired-comparison', id: '90909090-9090-4909-8909-909090909090', revision: 'packet', sha256: 'b'.repeat(64),
      pairedStatus: 'descriptive-only', pairCount: 1, denominator: 1, adoptionAuthority: 'no-authority-granted'
    },
    applicationScope: 'case-specific', trialEvidenceStatus: 'descriptive-only', generalizationStatus: 'not-established',
    causalStatus: 'not-established', adoptionStatus: 'not-authorized',
    qualification: 'One user-authored Planning reflection and one descriptive-only Sandbox paired-comparison packet are retained as case-specific references. They do not establish truth, entailment, causality, representativeness, generality, authority, adoption, or activation.'
  }
  const invalidFirstDecision = service.createDecision({
    requestId: '91919191-9191-4919-8919-919191919191',
    input: decisionInput(pair.ids, compared.corpusRevision, { experienceEvidence })
  })
  assert.equal(invalidFirstDecision.status, 'rejected')
  assert.match(invalidFirstDecision.message, /explicit contextual decision successor/)
  const invalidEvidence = structuredClone(experienceEvidence)
  invalidEvidence.generalizationStatus = 'established'
  const invalidSuccessor = service.createSuccessor({
    requestId: '92929292-9292-4929-8929-929292929292',
    input: decisionInput(pair.ids, compared.corpusRevision, {
      predecessorDecisionId: predecessorId, acknowledgedChangedBasis: false, experienceEvidence: invalidEvidence
    })
  })
  assert.equal(invalidSuccessor.status, 'rejected')
  assert.match(invalidSuccessor.message, /case-specific/)

  const successorId = '93939393-9393-4939-8939-939393939393'
  const successor = service.createSuccessor({
    requestId: successorId,
    input: decisionInput(pair.ids, compared.corpusRevision, {
      predecessorDecisionId: predecessorId, acknowledgedChangedBasis: false,
      judgment: 'For this reviewed case, keep the lesson bounded to the observed conditions and reopen its evidence before reuse.',
      experienceEvidence
    })
  })
  assert.equal(successor.status, 'confirmed', successor.message)
  const saved = successor.result.versions[0].payload
  assert.deepEqual(saved.experienceEvidence, experienceEvidence)
  assert.equal(saved.predecessor.decisionId, predecessorId)
  assert.equal(saved.judgment.includes('For this reviewed case'), true)
  const cold = createPrincipleAtlasService({ root: syntheticRoot, store, ownerRevision: revision })
  const reopened = cold.readDecision({ decisionId: successorId })
  assert.equal(reopened.currentness.status, 'current')
  assert.deepEqual(reopened.decision.versions[0].payload.experienceEvidence, experienceEvidence)
  assert.equal(cold.readDecision({ decisionId: predecessorId }).decision.versions[0].payload.experienceEvidence, undefined)
  assert.equal(cold.listDecisions().decisions.find((item) => item.id === successorId).reviewKind, 'experience-guidance')

  const legacyRoot = process.env.PRINCIPLES_ATLAS_LEGACY_SOURCE
  if (legacyRoot) {
    const legacy = await import(pathToFileURL(join(legacyRoot, 'src/principle-atlas.js')).href)
    const oldReader = legacy.createPrincipleAtlasService({ root: syntheticRoot, store, ownerRevision: revision })
    const oldColdRead = oldReader.readDecision({ decisionId: successorId })
    assert.equal(oldColdRead.currentness.status, 'current')
    assert.deepEqual(oldColdRead.decision.versions[0].payload.experienceEvidence, experienceEvidence)
  }
})

test('standalone CLI can create and cold-read a contextual decision using the same canonical service', (t) => {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'principle-atlas-cli-')))
  t.after(() => rmSync(temporary, { recursive: true, force: true }))
  const syntheticRoot = join(temporary, 'corpus')
  copySyntheticRepository(syntheticRoot)
  const pair = choicePair(syntheticRoot)
  const store = join(temporary, 'private-atlas')
  const bin = join(root, 'bin/principle-atlas.js')
  const run = (args, input = null) => spawnSync(process.execPath, [bin, ...args], { cwd: syntheticRoot, encoding: 'utf8', input })
  const common = ['--root', syntheticRoot, '--owner-revision', revision]
  const search = run(['search', ...common, '--query', pair.document.entries[0].title])
  assert.equal(search.status, 0, search.stderr)
  assert.ok(JSON.parse(search.stdout).matches.some((item) => item.principleId === pair.ids[0]))
  const comparison = JSON.parse(run(['compare', ...common, '--entry-ids', pair.ids.join(',')]).stdout)
  const requestId = '56565656-5656-4565-8565-565656565656'
  const input = decisionInput(pair.ids, comparison.corpusRevision)
  const saved = run(['decision', 'create', ...common, '--store', store, '--request-id', requestId, '--input', '-'], JSON.stringify(input))
  assert.equal(saved.status, 0, saved.stderr)
  const read = run(['decision', 'read', ...common, '--store', store, '--id', requestId])
  assert.equal(read.status, 0, read.stderr)
  assert.equal(JSON.parse(read.stdout).currentness.status, 'current')
})

test('one-claim critique is exact, recoverable and revised against a fresh basis without carrying old wording', (t) => {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'principle-claim-critique-')))
  t.after(() => rmSync(temporary, { recursive: true, force: true }))
  const syntheticRoot = join(temporary, 'corpus')
  copySyntheticRepository(syntheticRoot)
  const selected = choicePair(syntheticRoot)
  const store = join(temporary, 'private-atlas')
  const entry = createPrincipleAtlasService({ root: syntheticRoot, store, ownerRevision: revision })
  const shown = entry.show({ entryId: selected.ids[0] }).entry
  const claim = [shown.statement, ...shown.why, ...shown.practices, ...shown.applicability, ...shown.goals].find((item) => item.sources.some((source) => source.sourceId === selected.sourceId))
  assert.ok(claim)
  const critiqueInput = (expectedCorpusRevision, text) => ({
    title: 'Bounded claim critique', reviewer: 'Synthetic reviewer', context: 'A synthetic exception review.', principleIds: [shown.principleId], expectedCorpusRevision,
    claimReview: { principleId: shown.principleId, field: claim.field, index: claim.index, claimSha256: claim.claimSha256, claimText: claim.text, sourceIds: claim.sources.map((item) => item.sourceId), category: 'exception', text }
  })
  const current = entry.compare({ entryIds: selected.ids }).corpusRevision
  const firstId = '67676767-6767-4676-8676-676767676767'
  const firstInput = critiqueInput(current, 'This authored statement needs an exception for the synthetic boundary case.')
  const saved = entry.createDecision({ requestId: firstId, input: firstInput })
  assert.equal(saved.status, 'confirmed', saved.message)
  const oldVersion = saved.result.versions[0]
  assert.equal(oldVersion.payload.claimReview.claimText, claim.text)
  assert.equal(oldVersion.payload.applicability, undefined)
  assert.match(oldVersion.payload.claimReview.qualification, /not external source text/)
  const cold = createPrincipleAtlasService({ root: syntheticRoot, store, ownerRevision: revision })
  assert.equal(cold.readDecision({ decisionId: firstId }).currentness.status, 'current')
  assert.equal(cold.createDecision({ requestId: firstId, input: firstInput }).result.versions[0].sha256, oldVersion.sha256)

  const sourcePath = join(syntheticRoot, `sources/${selected.sourceId}.yaml`)
  const sourceBefore = readFileSync(sourcePath, 'utf8')
  writeFileSync(sourcePath, sourceBefore.replace('status: active', 'status: withdrawn'))
  assert.equal(cold.revisit({ decisionId: firstId }).currentness.status, 'changed')
  const changedBasis = cold.compare({ entryIds: selected.ids }).corpusRevision
  const newClaim = cold.show({ entryId: shown.principleId }).entry
  const reopenedClaim = [newClaim.statement, ...newClaim.why, ...newClaim.practices, ...newClaim.applicability, ...newClaim.goals].find((item) => item.field === claim.field && item.index === claim.index)
  const successorId = '78787878-7878-4787-8787-787878787878'
  const successor = cold.createSuccessor({ requestId: successorId, input: {
    ...critiqueInput(changedBasis, 'A fresh exception critique after source registry status changed.'),
    claimReview: { principleId: shown.principleId, field: reopenedClaim.field, index: reopenedClaim.index, claimSha256: reopenedClaim.claimSha256, claimText: reopenedClaim.text, sourceIds: reopenedClaim.sources.map((item) => item.sourceId), category: 'exception', text: 'A fresh exception critique after source registry status changed.' },
    predecessorDecisionId: firstId, acknowledgedChangedBasis: true
  } })
  assert.equal(successor.status, 'confirmed')
  assert.equal(successor.result.versions[0].payload.predecessor.sha256, oldVersion.sha256)
  assert.equal(successor.result.versions[0].payload.claimReview.text, 'A fresh exception critique after source registry status changed.')
  assert.notEqual(successor.result.versions[0].payload.claimReview.text, oldVersion.payload.claimReview.text)
  assert.equal(cold.readDecision({ decisionId: firstId }).decision.versions[0].payload.claimReview.text, 'This authored statement needs an exception for the synthetic boundary case.')
})
