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

function copySyntheticRepository(destination) {
  cpSync(root, destination, {
    recursive: true,
    filter(source) {
      const relative = source.startsWith(`${root}/`) ? source.slice(root.length + 1) : ''
      return relative !== '.git' && !relative.startsWith('.git/') && relative !== 'node_modules' && !relative.endsWith('/node_modules') && !relative.startsWith('.local/')
    }
  })
  const modules = process.env.PRINCIPLES_ATLAS_TEST_NODE_MODULES || join(root, 'node_modules')
  if (existsSync(modules)) symlinkSync(modules, join(destination, 'node_modules'), 'dir')
}

function pairIn(repository) {
  const validation = validateRepository(repository)
  assert.equal(validation.bag.errorCount, 0, validation.bag.sorted().slice(0, 5).map((item) => `${item.path}: ${item.code}`).join('\n'))
  const document = validation.state.corpus.documents.find((candidate) => candidate.frontmatter.status === 'active' && candidate.entries.length >= 2)
  assert.ok(document, 'synthetic repository has an active file with two principles')
  const ids = document.entries.slice(0, 2).map((entry) => entry.id)
  const atlas = createPrincipleAtlasService({ root: repository, ownerRevision: revision })
  const citedLabel = document.entries[0].statement.citationLabels[0]
  const sourceId = document.references.find((reference) => reference.label === citedLabel)?.sourceId
  assert.ok(sourceId, 'selected principle has an exact cited source identity')
  return { ids, corpusRevision: atlas.compare({ entryIds: ids }).corpusRevision, sourceId }
}

function request(pair) {
  return {
    task: 'Synthetic review task with two scoped considerations.',
    selectionRationale: 'Both principles affect the requested decision, with different operating conditions.',
    principleIds: pair.ids,
    expectedCorpusRevision: pair.corpusRevision,
    conflictReview: 'Caller reviewed this selected pair; semantic conflict remains a human judgment.',
    conflicts: [{ principleIds: pair.ids, description: 'Speed and completeness can pull in different directions.', resolutionStatus: 'conditional', precedence: 'Use conditional precedence.', rationale: 'The immediate risk determines the order of work.', conditions: 'Escalate urgent risk first; otherwise preserve the complete review path.' }],
    exceptionNotes: [{ principleId: pair.ids[0], exception: 'Defer the slower step during immediate risk.', scope: 'Urgent response only; document and resume review afterward.' }],
    coverageUnknowns: [{ area: 'Unrepresented operating conditions', reason: 'No separate semantic coverage review was supplied.' }]
  }
}

test('field guide is a cold-readable, source-bound standard export and refuses changed corpus input', (t) => {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'principles-field-guide-')))
  t.after(() => rmSync(temporary, { recursive: true, force: true }))
  const corpus = join(temporary, 'corpus')
  copySyntheticRepository(corpus)
  const selected = pairIn(corpus)
  const spec = request(selected)
  const requestPath = join(temporary, 'request.json')
  const guidePath = join(temporary, 'guide.json')
  writeFileSync(requestPath, JSON.stringify(spec))
  const bin = join(root, 'bin/field-guide.js')
  const common = ['--root', corpus, '--owner-revision', revision]
  const create = spawnSync(process.execPath, [bin, 'create', ...common, '--input', requestPath, '--output', guidePath], { cwd: corpus, encoding: 'utf8' })
  assert.equal(create.status, 0, create.stderr)
  const guide = JSON.parse(readFileSync(guidePath, 'utf8'))
  assert.equal(guide.schema, 'principles.field-guide/1')
  assert.equal(guide.context.profile, 'standard')
  assert.equal(guide.context.usage, 'qualified-guidance')
  assert.ok(guide.context.entries.every((entry) => entry.status === 'active' && Array.isArray(entry.why) && Array.isArray(entry.practices) && Array.isArray(entry.applicability)))
  assert.ok(guide.context.entries.every((entry) => entry.source_ids.every((id) => entry.source_inputs.some((source) => source.id === id))))
  assert.equal(guide.conflicts.declared[0].provenance, 'caller-asserted')
  assert.equal(guide.conflicts.declared[0].resolutionStatus, 'conditional')
  assert.equal(guide.exceptions.callerNotes[0].scope, 'Urgent response only; document and resume review afterward.')
  assert.ok(guide.exceptions.authoredApplicability.every((entry) => Array.isArray(entry.claims)))
  assert.equal(guide.comparison.semanticConflicts.startsWith('unknown'), true)
  assert.equal(guide.coverage.semanticCoverage.startsWith('unknown'), true)
  assert.equal(guide.authority.activated, false)

  const coldRead = spawnSync(process.execPath, [bin, 'read', ...common, '--input', guidePath], { cwd: corpus, encoding: 'utf8' })
  assert.equal(coldRead.status, 0, coldRead.stderr)
  assert.equal(JSON.parse(coldRead.stdout).status, 'current')

  const unresolved = request(selected)
  unresolved.conflicts[0] = { ...unresolved.conflicts[0], resolutionStatus: 'unresolved', precedence: null }
  const unresolvedPath = join(temporary, 'unresolved.json')
  writeFileSync(unresolvedPath, JSON.stringify(unresolved))
  const unresolvedCreate = spawnSync(process.execPath, [bin, 'create', ...common, '--input', unresolvedPath], { cwd: corpus, encoding: 'utf8' })
  assert.equal(unresolvedCreate.status, 0, unresolvedCreate.stderr)
  assert.equal(JSON.parse(unresolvedCreate.stdout).conflicts.declared[0].precedence, null)

  const sourcePath = join(corpus, 'sources', `${selected.sourceId}.yaml`)
  const source = readFileSync(sourcePath, 'utf8')
  const changedSource = source.replace(/last_reviewed: '[^']+'/, "last_reviewed: '2026-11-02'")
  assert.notEqual(changedSource, source, 'selected source record has a reviewed date to revise synthetically')
  writeFileSync(sourcePath, changedSource)
  const stale = spawnSync(process.execPath, [bin, 'read', ...common, '--input', guidePath], { cwd: corpus, encoding: 'utf8' })
  assert.equal(stale.status, 2)
  assert.match(stale.stderr, /Stale field guide selection/)

  // A source-title edit breaks the bibliography contract. Validation must also
  // refuse that invalid corpus without returning an apparently current guide.
  writeFileSync(sourcePath, changedSource.replace(/title: ([^\n]+)/, 'title: Synthetic updated source title'))
  const invalid = spawnSync(process.execPath, [bin, 'read', ...common, '--input', guidePath], { cwd: corpus, encoding: 'utf8' })
  assert.equal(invalid.status, 2)
  assert.match(invalid.stderr, /Principles repository does not currently validate/)
})
