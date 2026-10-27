import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
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
