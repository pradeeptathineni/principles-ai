import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

function lifecycleFixture() {
  const temporary = mkdtempSync(join(tmpdir(), 'principles-cli-fixture-'))
  const fixture = join(temporary, 'repository')
  cpSync(root, fixture, {
    recursive: true,
    filter: (source) => !['.git', 'node_modules'].includes(source.split('/').at(-1))
  })
  for (const name of readdirSync(join(fixture, 'domains', 'coding'))) if (name.endsWith('.md')) unlinkSync(join(fixture, 'domains', 'coding', name))
  for (const name of readdirSync(join(fixture, 'evidence', 'claims'))) if (name.endsWith('.yaml')) unlinkSync(join(fixture, 'evidence', 'claims', name))
  writeFileSync(join(fixture, 'domains', 'coding', 'domain.yaml'), `schema_version: 6
id: coding
code: COD
title: Coding
taxonomy_status: accepted
description: Fixture coding domain.
human_intent:
  required_subdomains: []
  priorities: []
  exclusions: []
  scope_notes: []
subdomains:
- id: design
  code: DES
  title: Design
  description: Fixture design scope.
  status: accepted
  origin: research
- id: legacy
  code: LEG
  title: Legacy
  description: Fixture deprecated scope.
  status: deprecated
  origin: research
`)
  return { fixture, cleanup: () => rmSync(temporary, { recursive: true, force: true }) }
}

test('CLI rejects missing option values and unknown options without a stack trace', () => {
  const missing = spawnSync(process.execPath, ['bin/principles.js', 'validate', '--baseline-ref'], { cwd: root, encoding: 'utf8' })
  assert.equal(missing.status, 2)
  assert.match(missing.stderr, /--baseline-ref requires a value/)
  assert.doesNotMatch(missing.stderr, /\n\s+at /)

  const missingAuthorization = spawnSync(process.execPath, ['bin/principles.js', 'validate', '--authorized-taxonomy-target'], { cwd: root, encoding: 'utf8' })
  assert.equal(missingAuthorization.status, 2)
  assert.match(missingAuthorization.stderr, /--authorized-taxonomy-target requires a value/)

  const invalidAuthorization = spawnSync(process.execPath, ['bin/principles.js', 'validate', '--authorized-taxonomy-target', '../coding'], { cwd: root, encoding: 'utf8' })
  assert.equal(invalidAuthorization.status, 2)
  assert.match(invalidAuthorization.stderr, /Invalid authorized taxonomy target/)

  const unknown = spawnSync(process.execPath, ['bin/principles.js', 'validate', '--bypass'], { cwd: root, encoding: 'utf8' })
  assert.equal(unknown.status, 2)
  assert.match(unknown.stderr, /Unknown option --bypass/)
})

test('workflow CLI reports fixture lifecycle state without depending on canonical corpus state', () => {
  const isolated = lifecycleFixture()
  const result = spawnSync(process.execPath, ['bin/principles.js', 'workflow', '--root', isolated.fixture, '--target', 'domains/coding/design.md', '--json'], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const status = JSON.parse(result.stdout)
  assert.equal(status.next_action, 'research-and-create-content-draft')
  assert.deepEqual(status.human_gates, [])
  assert.equal(status.schema_version, 3)
  isolated.cleanup()
})

test('workflow CLI inventories a fixture domain furnishing outcome', () => {
  const isolated = lifecycleFixture()
  const result = spawnSync(process.execPath, ['bin/principles.js', 'workflow', '--root', isolated.fixture, '--domain', 'coding', '--json'], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const status = JSON.parse(result.stdout)
  assert.equal(status.outcome, 'fully-furnish-domain')
  assert.equal(status.target, 'coding')
  assert.ok(status.content.targets.some((target) => target.path === 'domains/coding/principles.md'))
  assert.ok(status.content.targets.some((target) => target.path === 'domains/coding/personal-growth.md'))
  assert.ok(status.content.targets.some((target) => target.path === 'domains/coding/design.md' && target.state === 'absent'))
  assert.deepEqual(status.content.summary, { absent: 3, draft: 0, active: 0 })
  assert.deepEqual(status.taxonomy.proposed_candidates, [])
  assert.deepEqual(status.taxonomy.deprecated_scopes, ['legacy'])
  assert.deepEqual(status.human_gates, [])
  assert.equal(status.next_action, 'run-create-content-for-missing-furnishing-targets')
  isolated.cleanup()
})

test('workflow CLI accepts resolved outcome classes and rejects invalid selector combinations', () => {
  const architecture = spawnSync(process.execPath, ['bin/principles.js', 'workflow', '--outcome', 'review-architecture', '--json'], { cwd: root, encoding: 'utf8' })
  assert.equal(architecture.status, 0, architecture.stderr)
  assert.equal(JSON.parse(architecture.stdout).route, 'docs/workflows/review-architecture.md')

  const newDomain = spawnSync(process.execPath, ['bin/principles.js', 'workflow', '--outcome', 'create-domain', '--domain', 'psychology', '--json'], { cwd: root, encoding: 'utf8' })
  assert.equal(newDomain.status, 0, newDomain.stderr)
  assert.deepEqual(JSON.parse(newDomain.stdout).human_gates, ['taxonomy-addition'])

  const refinement = spawnSync(process.execPath, ['bin/principles.js', 'workflow', '--outcome', 'refine-domain-content', '--domain', 'coding', '--json'], { cwd: root, encoding: 'utf8' })
  assert.equal(refinement.status, 0, refinement.stderr)
  const refinementStatus = JSON.parse(refinement.stdout)
  assert.equal(refinementStatus.outcome, 'refine-domain-content')
  assert.equal(refinementStatus.delegated_content_workflow, 'docs/workflows/update-content.md')
  assert.ok(refinementStatus.autonomous_steps.includes('run-substantive-update-content-for-all-domain-targets'))

  const neither = spawnSync(process.execPath, ['bin/principles.js', 'workflow'], { cwd: root, encoding: 'utf8' })
  assert.equal(neither.status, 2)
  assert.match(neither.stderr, /requires --outcome, --target, or --domain/)

  const both = spawnSync(process.execPath, ['bin/principles.js', 'workflow', '--domain', 'coding', '--target', 'domains/coding/design.md'], { cwd: root, encoding: 'utf8' })
  assert.equal(both.status, 2)
  assert.match(both.stderr, /at most one of --target or --domain/)
})

test('CLI creates disposable checkpoints and derives activation manifests without inferring approval', () => {
  const isolated = lifecycleFixture()
  const sourceBatch = `version: 2
sources:
  - title: Batch one
    publisher: Publisher
    evidence_kind: official-documentation
    canonical_url: https://batch-one.example/
    url_aliases: []
    published_or_version: null
    first_retrieved: '2026-09-02'
    last_reviewed: '2026-09-02'
    status: active
    superseded_by: null
  - title: Batch two
    publisher: Publisher
    evidence_kind: official-documentation
    canonical_url: https://batch-two.example/
    url_aliases: []
    published_or_version: null
    first_retrieved: '2026-09-02'
    last_reviewed: '2026-09-02'
    status: active
    superseded_by: null
`
  const registered = spawnSync(process.execPath, ['bin/principles.js', 'source', 'register', '--root', isolated.fixture, '--input', '-'], { cwd: root, encoding: 'utf8', input: sourceBatch })
  assert.equal(registered.status, 0, `${registered.stdout}\n${registered.stderr}`)
  assert.equal(JSON.parse(registered.stdout).registered.length, 2)

  writeFileSync(join(isolated.fixture, 'generated', 'checkpoint-plan.yaml'), `version: 1
retrieved_sources: []
evidence_gaps: []
reviewed_artifacts: []
domain_review_complete: false
activation_package_path: null
`)
  const checkpoint = spawnSync(process.execPath, ['bin/principles.js', 'run', 'checkpoint', '--root', isolated.fixture, '--domain', 'coding', '--input', 'generated/checkpoint-plan.yaml'], { cwd: root, encoding: 'utf8' })
  assert.equal(checkpoint.status, 0, checkpoint.stderr)
  assert.equal(JSON.parse(checkpoint.stdout).authority.includes('not evidence'), true)

  writeFileSync(join(isolated.fixture, 'generated', 'activation-package.json'), JSON.stringify({
    version: 2,
    artifacts: [{ path: 'domains/coding/principles.md', diagnostics: { reviewed_state_sha256: 'a'.repeat(64) } }]
  }) + '\n')
  const manifest = spawnSync(process.execPath, ['bin/principles.js', 'activation', 'manifest', '--root', isolated.fixture, '--input', 'generated/activation-package.json', '--reviewed-at', '2026-09-02', '--all'], { cwd: root, encoding: 'utf8' })
  assert.equal(manifest.status, 0, `${manifest.stdout}\n${manifest.stderr}`)
  assert.match(manifest.stdout, /reviewed_at: 2026-09-02/)
  assert.match(manifest.stdout, /reviewed_state_sha256: a{64}/)

  const ambiguous = spawnSync(process.execPath, ['bin/principles.js', 'citations', 'sync', '--root', isolated.fixture, '--domain', 'coding', '--target', 'domains/coding/principles.md'], { cwd: root, encoding: 'utf8' })
  assert.equal(ambiguous.status, 2)
  assert.match(ambiguous.stderr, /exactly one of --target or --domain/)
  isolated.cleanup()
})
