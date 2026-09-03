import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { architectureReviewGates, classifyArchitectureChanges } from '../src/architecture.js'
import { DiagnosticBag } from '../src/diagnostics.js'

function roots() {
  const before = mkdtempSync(join(tmpdir(), 'principles-architecture-before-'))
  const after = mkdtempSync(join(tmpdir(), 'principles-architecture-after-'))
  return { before, after, cleanup() { rmSync(before, { recursive: true, force: true }); rmSync(after, { recursive: true, force: true }) } }
}

function put(root, path, text) {
  mkdirSync(join(root, path, '..'), { recursive: true })
  writeFileSync(join(root, path), text)
}

const validationPolicy = {
  architecture_review: {
    trigger_groups: {
      routing: ['AGENTS.md'],
      workflows: ['docs/workflows/'],
      tooling: ['src/']
    },
    excluded_paths: ['docs/reviews/'],
    minimum_context: ['AGENTS.md']
  }
}

test('architecture classification reports changed surfaces and deterministic context cost', () => {
  const fixture = roots()
  put(fixture.before, 'AGENTS.md', 'old\n')
  put(fixture.after, 'AGENTS.md', 'new\n')
  put(fixture.before, 'docs/workflows/content.md', 'same\n')
  put(fixture.after, 'docs/workflows/content.md', 'same\n')
  const result = classifyArchitectureChanges(fixture.after, fixture.before, validationPolicy, new DiagnosticBag())
  assert.equal(result.required, true)
  assert.deepEqual(result.categories, ['routing'])
  assert.deepEqual(result.changed_paths, ['AGENTS.md'])
  assert.deepEqual(result.context, { files: ['AGENTS.md'], utf8_bytes: 4 })
  assert.deepEqual([...architectureReviewGates(result)].sort(), ['architecture-review', 'governance-or-ci-change'])
  fixture.cleanup()
})

test('ordinary corpus-only changes do not trigger architecture review', () => {
  const fixture = roots()
  put(fixture.before, 'AGENTS.md', 'same\n')
  put(fixture.after, 'AGENTS.md', 'same\n')
  put(fixture.before, 'domains/coding/design.md', 'old\n')
  put(fixture.after, 'domains/coding/design.md', 'new\n')
  const result = classifyArchitectureChanges(fixture.after, fixture.before, validationPolicy, new DiagnosticBag())
  assert.equal(result.required, false)
  assert.deepEqual(result.changed_paths, [])
  fixture.cleanup()
})

test('new and removed workflow files trigger review while excluded historical records do not', () => {
  const fixture = roots()
  put(fixture.before, 'AGENTS.md', 'same\n')
  put(fixture.after, 'AGENTS.md', 'same\n')
  put(fixture.after, 'docs/workflows/new.md', '# New\n')
  put(fixture.before, 'docs/workflows/removed.md', '# Removed\n')
  put(fixture.before, 'docs/reviews/old.md', '# Old\n')
  put(fixture.after, 'docs/reviews/old.md', '# Revised\n')
  const result = classifyArchitectureChanges(fixture.after, fixture.before, validationPolicy, new DiagnosticBag())
  assert.deepEqual(result.categories, ['workflows'])
  assert.deepEqual(result.changed_paths, ['docs/workflows/new.md', 'docs/workflows/removed.md'])
  fixture.cleanup()
})
