import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  allocatePrincipleIdentities,
  applyActivationManifest,
  buildActivationManifest,
  buildActivationPackage,
  buildActivationReview,
  buildDomainPreparation,
  buildEvidenceScaffold,
  buildRunCheckpoint,
  buildSourceUsage,
  materializeContent,
  materializeContents,
  registerSource,
  registerSources,
  synchronizeCitations,
  synchronizeDomainCitations,
  verifyRunCheckpoint,
  yaml
} from '../src/mutation.js'
import { applyRepositoryTransaction } from '../src/transaction.js'
import { DiagnosticBag } from '../src/diagnostics.js'

function temporaryRoot() {
  const root = mkdtempSync(join(tmpdir(), 'principles-mutation-'))
  mkdirSync(join(root, 'config'), { recursive: true })
  mkdirSync(join(root, 'sources'), { recursive: true })
  mkdirSync(join(root, 'domains', 'coding'), { recursive: true })
  return root
}

function validResult() {
  return { bag: new DiagnosticBag() }
}

function ledger() {
  return {
    schema_version: 2,
    principles: { next_sequence: 2, allocated: ['PRN-000001'], retired: [] },
    sources: { next_sequence: 2, allocated: ['SRC-000001'], retired: [] },
    principle_relationships: []
  }
}

test('repository transaction restores every file when post-write validation fails', () => {
  const root = temporaryRoot()
  writeFileSync(join(root, 'one.txt'), 'before\n')
  assert.throws(() => applyRepositoryTransaction(root, [
    { path: 'one.txt', content: 'after\n' },
    { path: 'two.txt', content: 'created\n' }
  ], () => {
    const bag = new DiagnosticBag()
    bag.error('EXPECTED', 'fail', 'two.txt')
    return { bag }
  }), /failed repository validation/)
  assert.equal(readFileSync(join(root, 'one.txt'), 'utf8'), 'before\n')
  assert.throws(() => readFileSync(join(root, 'two.txt')), /ENOENT/)
  rmSync(root, { recursive: true, force: true })
})

test('repository transaction rejects a concurrent canonical writer and releases its own lock', () => {
  const root = temporaryRoot()
  writeFileSync(join(root, 'one.txt'), 'before\n')
  writeFileSync(join(root, '.principles-write.lock'), 'other\n')
  assert.throws(() => applyRepositoryTransaction(root, [{ path: 'one.txt', content: 'after\n' }], validResult), /Another canonical repository mutation/)
  assert.equal(readFileSync(join(root, 'one.txt'), 'utf8'), 'before\n')
  unlinkSync(join(root, '.principles-write.lock'))
  applyRepositoryTransaction(root, [{ path: 'one.txt', content: 'after\n' }], validResult)
  assert.equal(readFileSync(join(root, 'one.txt'), 'utf8'), 'after\n')
  assert.throws(() => readFileSync(join(root, '.principles-write.lock')), /ENOENT/)
  rmSync(root, { recursive: true, force: true })
})

test('source registration allocates identity and record in one validated transaction', () => {
  const root = temporaryRoot()
  const current = ledger()
  writeFileSync(join(root, 'config', 'identity-ledger.yaml'), yaml(current))
  const validation = { state: { ledger: current } }
  const result = registerSource(root, validation, {
    version: 1,
    source: {
      title: 'Example', publisher: 'Publisher', evidence_kind: 'official-documentation',
      canonical_url: 'https://example.com/', url_aliases: [], published_or_version: null,
      first_retrieved: '2026-09-02', last_reviewed: '2026-09-02', status: 'active', superseded_by: null
    }
  }, validResult)
  assert.equal(result.id, 'SRC-000002')
  assert.match(readFileSync(join(root, result.path), 'utf8'), /id: SRC-000002/)
  assert.match(readFileSync(join(root, 'config', 'identity-ledger.yaml'), 'utf8'), /next_sequence: 3/)
  rmSync(root, { recursive: true, force: true })
})

test('source registration batches contiguous identities in one validated transaction', () => {
  const root = temporaryRoot()
  const current = ledger()
  writeFileSync(join(root, 'config', 'identity-ledger.yaml'), yaml(current))
  let validations = 0
  const result = registerSources(root, { state: { ledger: current } }, {
    version: 2,
    sources: ['one', 'two'].map((name) => ({
      title: name, publisher: 'Publisher', evidence_kind: 'official-documentation',
      canonical_url: `https://${name}.example/`, url_aliases: [], published_or_version: null,
      first_retrieved: '2026-09-02', last_reviewed: '2026-09-02', status: 'active', superseded_by: null
    }))
  }, () => { validations += 1; return validResult() })
  assert.deepEqual(result.registered.map((item) => item.id), ['SRC-000002', 'SRC-000003'])
  assert.equal(validations, 1)
  assert.match(readFileSync(join(root, 'config', 'identity-ledger.yaml'), 'utf8'), /next_sequence: 4/)
  assert.throws(() => registerSources(root, { state: { ledger: current } }, { version: 2, sources: [] }, validResult), /non-empty sources array/)
  rmSync(root, { recursive: true, force: true })
})

test('principle identity allocation reserves a contiguous validated suffix', () => {
  const root = temporaryRoot()
  const current = ledger()
  writeFileSync(join(root, 'config', 'identity-ledger.yaml'), yaml(current))
  const result = allocatePrincipleIdentities(root, { state: { ledger: current } }, 2, validResult)
  assert.deepEqual(result.allocated, ['PRN-000002', 'PRN-000003'])
  const updated = readFileSync(join(root, 'config', 'identity-ledger.yaml'), 'utf8')
  assert.match(updated, /next_sequence: 4/)
  assert.match(updated, /PRN-000002[\s\S]*PRN-000003/)
  rmSync(root, { recursive: true, force: true })
})

test('content materialization replaces auto identities and updates the ledger transactionally', () => {
  const root = temporaryRoot()
  const current = ledger()
  writeFileSync(join(root, 'config', 'identity-ledger.yaml'), yaml(current))
  const result = materializeContent(root, { state: { ledger: current } }, {
    version: 1,
    target: 'domains/coding/testing.md',
    content: '### PRN-AUTO — First\n\n### PRN-AUTO — Second\n'
  }, validResult)
  assert.deepEqual(result.allocated, ['PRN-000002', 'PRN-000003'])
  assert.match(readFileSync(join(root, result.path), 'utf8'), /PRN-000002[\s\S]*PRN-000003/)
  rmSync(root, { recursive: true, force: true })
})

test('content materialization batches files and identities in one validated transaction', () => {
  const root = temporaryRoot()
  const current = ledger()
  writeFileSync(join(root, 'config', 'identity-ledger.yaml'), yaml(current))
  let validations = 0
  const result = materializeContents(root, { state: { ledger: current } }, {
    version: 2,
    documents: [
      { target: 'domains/coding/one.md', content: '### PRN-AUTO — One\n' },
      { target: 'domains/coding/two.md', content: '### PRN-AUTO — Two\n\n### PRN-AUTO — Three\n' }
    ]
  }, () => { validations += 1; return validResult() })
  assert.deepEqual(result.materialized.map((item) => item.allocated), [['PRN-000002'], ['PRN-000003', 'PRN-000004']])
  assert.equal(validations, 1)
  assert.match(readFileSync(join(root, 'config', 'identity-ledger.yaml'), 'utf8'), /next_sequence: 5/)
  assert.throws(() => materializeContents(root, { state: { ledger: current } }, { version: 2, documents: [{ target: 'same', content: 'PRN-AUTO' }, { target: 'same', content: 'PRN-AUTO' }] }, validResult), /repeats a target/)
  rmSync(root, { recursive: true, force: true })
})

test('citation synchronization uses source first-use order and evidence scaffolding invalidates changed review', () => {
  const root = temporaryRoot()
  const path = 'domains/coding/test.md'
  writeFileSync(join(root, path), `---\nstatus: draft\n---\n\n# Test\n\nIntro.\n\n## Principles\n\nClaim. [2], [1]\n\n## References\n\n1. [One][1] — \`SRC-000001\`\n2. [Two][2] — \`SRC-000002\`\n\n[1]: https://one.example/\n[2]: https://two.example/\n`)
  const entry = {
    id: 'PRN-000001',
    title: 'Test',
    statement: { role: 'statement', text: 'Current meaning.', citationLabels: ['2', '1'], claimSha256: 'a'.repeat(64) },
    why: [], practices: [], applicability: [], goals: [], tags: [],
    claims: [{ role: 'statement', claimSha256: 'a'.repeat(64), citationLabels: ['2', '1'] }]
  }
  const document = {
    path,
    frontmatter: { status: 'draft', domain: 'coding' },
    title: 'Test',
    introduction: 'Introduction.',
    entries: [entry],
    references: [{ label: '1', sourceId: 'SRC-000001' }, { label: '2', sourceId: 'SRC-000002' }],
    semanticSha256: 'b'.repeat(64)
  }
  const sourceById = new Map([
    ['SRC-000001', { value: { title: 'One', publisher: 'One Publisher', evidence_kind: 'official-documentation', canonical_url: 'https://one.example/' } }],
    ['SRC-000002', { value: { title: 'Two', publisher: 'Two Publisher', evidence_kind: 'official-documentation', canonical_url: 'https://two.example/' } }]
  ])
  const entryById = new Map([['PRN-000001', { document, entry }]])
  const validation = { state: { corpus: { documents: [document], entryById }, sourceById, evidenceByEntryId: new Map(), manifests: [] } }
  const sync = synchronizeCitations(root, validation, path, validResult)
  assert.deepEqual(sync.source_order, ['SRC-000002', 'SRC-000001'])
  assert.match(sync.content, /Claim\. \[1\], \[2\]/)
  const scaffold = buildEvidenceScaffold(validation, 'PRN-000001')
  assert.equal(scaffold.claims[0].review_required, true)
  assert.equal(scaffold.claims[0].retained_review, null)
  const baselineEntry = structuredClone(entry)
  baselineEntry.statement.text = 'Prior meaning.'
  const baselineDocument = { ...document, entries: [baselineEntry], frontmatter: { status: 'active' } }
  const baselineState = {
    corpus: { documents: [baselineDocument] }, sourceById, evidenceByEntryId: new Map(), manifests: []
  }
  const packageResult = buildActivationPackage(validation, null, baselineState)
  assert.equal(packageResult.version, 2)
  assert.equal(packageResult.decision.gate, 'principle-activation')
  assert.equal(packageResult.artifacts[0].semantic_changes.principles[0].kind, 'modified')
  assert.equal(packageResult.artifacts[0].semantic_changes.principles[0].before.statement.text, 'Prior meaning.')
  assert.equal(packageResult.artifacts[0].reviewed_state.content.principles[0].statement.text, 'Current meaning.')
  assert.match(packageResult.artifacts[0].diagnostics.reviewed_state_sha256, /^[a-f0-9]{64}$/)
  const domainSync = synchronizeDomainCitations(root, validation, 'coding', validResult)
  assert.equal(domainSync.checked, 1)
  assert.equal(domainSync.changed, 1)
  const usage = buildSourceUsage(validation.state, [document])
  assert.equal(usage.attribution_count, 2)
  assert.equal(usage.unique_sources, 2)
  assert.match(usage.interpretation, /do not establish source fitness/)
  rmSync(root, { recursive: true, force: true })
})

test('domain preparation separates task, repository-wide, and unrelated gate effects and checkpoints invalidate changed inputs', () => {
  const root = temporaryRoot()
  const path = 'domains/coding/principles.md'
  writeFileSync(join(root, 'domains', 'coding', 'domain.yaml'), 'domain\n')
  writeFileSync(join(root, path), 'content\n')
  writeFileSync(join(root, 'sources', 'SRC-000001.yaml'), 'source\n')
  const entry = { id: 'PRN-000001', title: 'Test', claims: [{ citationLabels: ['1'] }] }
  const document = {
    path, frontmatter: { domain: 'coding', status: 'draft' }, semanticSha256: 'a'.repeat(64), entries: [entry],
    references: [{ label: '1', sourceId: 'SRC-000001' }]
  }
  const sourceById = new Map([['SRC-000001', { value: { id: 'SRC-000001', title: 'Source', publisher: 'Publisher', evidence_kind: 'official-documentation' } }]])
  const manifest = { id: 'coding', taxonomy_status: 'accepted', subdomains: [], human_intent: { required_subdomains: [] } }
  const validation = {
    bag: new DiagnosticBag(), transitionStatus: 'evaluated',
    humanGates: ['architecture-review', 'principle-activation', 'taxonomy-deprecation'],
    gateEffects: [
      { gate: 'architecture-review', path: 'src/cli.js' },
      { gate: 'principle-activation', path },
      { gate: 'taxonomy-deprecation', path: 'domains/other/domain.yaml' }
    ],
    architectureReview: { required: true },
    state: {
      manifests: [{ path: 'domains/coding/domain.yaml', value: manifest }],
      corpus: { documents: [document] }, sourceById, evidenceByEntryId: new Map(),
      ledger: ledger(), policies: { 'evidence-policy': { version: 4, adoption: { required_paths: [] } } }
    }
  }
  const preparation = buildDomainPreparation(root, validation, 'coding')
  assert.equal(preparation.version, 2)
  assert.deepEqual(preparation.validation.transition_gate_scope.task, [{ gate: 'principle-activation', path_count: 1, paths: [path] }])
  assert.equal(preparation.validation.transition_gate_scope.repository_wide[0].gate, 'architecture-review')
  assert.equal(preparation.validation.transition_gate_scope.unrelated[0].gate, 'taxonomy-deprecation')
  assert.deepEqual(preparation.validation.current_outcome, { next_action: 'run-create-content-for-missing-furnishing-targets', human_gates: ['principle-activation'] })
  assert.equal(preparation.source_usage.by_publisher[0].name, 'Publisher')
  const checkpoint = buildRunCheckpoint(root, validation, 'coding', {
    version: 1,
    retrieved_sources: [{ url: 'https://example.com/', source_id: 'SRC-000001', targets: [path] }],
    evidence_gaps: [{ target: path, description: 'Independent source still needed.' }],
    reviewed_artifacts: [path],
    domain_review_complete: false,
    activation_package_path: null
  })
  assert.equal(verifyRunCheckpoint(root, validation, checkpoint).valid, true)
  writeFileSync(join(root, path), 'changed\n')
  const invalidated = verifyRunCheckpoint(root, validation, checkpoint)
  assert.equal(invalidated.valid, false)
  assert.deepEqual(invalidated.changed, [{ path, kind: 'modified' }])
  assert.throws(() => buildRunCheckpoint(root, validation, 'coding', { version: 1, retrieved_sources: [], evidence_gaps: [], reviewed_artifacts: ['domains/other/no.md'], domain_review_complete: false }), /not a current furnishing target/)
  rmSync(root, { recursive: true, force: true })
})

test('activation binding covers meaningful content and relevant taxonomy, source, and evidence state without making hashes the decision', () => {
  const root = temporaryRoot()
  const path = 'domains/coding/test.md'
  writeFileSync(join(root, path), `---\nstatus: draft\nlast_reviewed: null\nreviewed_content_sha256: null\n---\n\nDraft.\n`)
  const entry = {
    id: 'PRN-000001', title: 'Test',
    statement: { role: 'statement', text: 'Meaning to approve.', citationLabels: ['1'] },
    why: [], practices: [], applicability: [], goals: [], tags: []
  }
  const document = {
    path,
    frontmatter: { status: 'draft', domain: 'coding', type: 'principles' },
    title: 'Test', introduction: 'Introduction.', entries: [entry],
    references: [{ label: '1', sourceId: 'SRC-000001' }], semanticSha256: 'b'.repeat(64)
  }
  const sourceById = new Map([['SRC-000001', { value: {
    id: 'SRC-000001', title: 'Source', publisher: 'Publisher', evidence_kind: 'official-documentation',
    published_or_version: null, status: 'active', superseded_by: null
  } }]])
  const evidence = { entry_id: 'PRN-000001', claims: [{ role: 'statement', outcome: 'strong' }] }
  const validation = { state: {
    corpus: { documents: [document] }, sourceById, evidenceByEntryId: new Map([['PRN-000001', { value: evidence }]]),
    manifests: [{ value: { id: 'coding', title: 'Coding', taxonomy_status: 'accepted', description: 'Code.', human_intent: {}, subdomains: [] } }]
  } }
  const packageResult = buildActivationPackage(validation)
  const artifact = packageResult.artifacts[0]
  assert.match(packageResult.decision.question, /Approve activation/)
  assert.match(packageResult.decision.fingerprints, /not hash values/)
  assert.equal(artifact.semantic_changes.principles[0].after.statement.text, 'Meaning to approve.')
  const review = buildActivationReview(packageResult)
  assert.equal(review.summary.artifacts, 1)
  assert.equal(review.artifacts[0].reviewed_state, undefined)
  assert.match(review.authority, /Human review aid only/)
  const manifest = buildActivationManifest(packageResult, '2026-09-02', [path])
  assert.equal(manifest.approved_artifacts[0].reviewed_state_sha256, artifact.diagnostics.reviewed_state_sha256)
  assert.throws(() => buildActivationManifest(packageResult, '2026-09-02', ['domains/coding/missing.md']), /does not contain/)

  sourceById.get('SRC-000001').value.status = 'superseded'
  assert.throws(() => applyActivationManifest(root, validation, {
    version: 2,
    reviewed_at: '2026-09-02',
    approved_artifacts: [{ path, reviewed_state_sha256: artifact.diagnostics.reviewed_state_sha256 }]
  }, validResult), /reviewed state changed after approval/)

  sourceById.get('SRC-000001').value.status = 'active'
  evidence.claims[0].outcome = 'partial'
  assert.throws(() => applyActivationManifest(root, validation, {
    version: 2,
    reviewed_at: '2026-09-02',
    approved_artifacts: [{ path, reviewed_state_sha256: artifact.diagnostics.reviewed_state_sha256 }]
  }, validResult), /reviewed state changed after approval/)

  evidence.claims[0].outcome = 'strong'
  validation.state.manifests[0].value.description = 'Changed taxonomy context.'
  assert.throws(() => applyActivationManifest(root, validation, {
    version: 2,
    reviewed_at: '2026-09-02',
    approved_artifacts: [{ path, reviewed_state_sha256: artifact.diagnostics.reviewed_state_sha256 }]
  }, validResult), /reviewed state changed after approval/)

  validation.state.manifests[0].value.description = 'Code.'
  applyActivationManifest(root, validation, {
    version: 2,
    reviewed_at: '2026-09-02',
    approved_artifacts: [{ path, reviewed_state_sha256: artifact.diagnostics.reviewed_state_sha256 }]
  }, validResult)
  const activated = readFileSync(join(root, path), 'utf8')
  assert.match(activated, /status: active/)
  assert.match(activated, /reviewed_content_sha256: b{64}/)
  rmSync(root, { recursive: true, force: true })
})
