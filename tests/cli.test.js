import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

test('CLI rejects missing option values and unknown options without a stack trace', () => {
  const missing = spawnSync(process.execPath, ['bin/principles.js', 'validate', '--baseline-ref'], { cwd: root, encoding: 'utf8' })
  assert.equal(missing.status, 2)
  assert.match(missing.stderr, /--baseline-ref requires a value/)
  assert.doesNotMatch(missing.stderr, /\n\s+at /)

  const unknown = spawnSync(process.execPath, ['bin/principles.js', 'validate', '--bypass'], { cwd: root, encoding: 'utf8' })
  assert.equal(unknown.status, 2)
  assert.match(unknown.stderr, /Unknown option --bypass/)
})

test('workflow CLI reports an active natural-language target as satisfied', () => {
  const result = spawnSync(process.execPath, ['bin/principles.js', 'workflow', '--target', 'domains/coding/design.md', '--json'], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const status = JSON.parse(result.stdout)
  assert.equal(status.next_action, 'outcome-satisfied')
  assert.deepEqual(status.human_gates, [])
})

test('workflow CLI inventories a complete domain furnishing outcome', () => {
  const result = spawnSync(process.execPath, ['bin/principles.js', 'workflow', '--domain', 'coding', '--json'], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const status = JSON.parse(result.stdout)
  assert.equal(status.outcome, 'fully-furnish-domain')
  assert.equal(status.target, 'coding')
  assert.ok(status.content.targets.some((target) => target.path === 'domains/coding/principles.md'))
  assert.ok(status.content.targets.some((target) => target.path === 'domains/coding/personal-growth.md'))
  assert.ok(status.content.targets.some((target) => target.path === 'domains/coding/design.md' && target.state === 'active'))
  assert.deepEqual(status.content.summary, { absent: 0, draft: 0, active: 14 })
  assert.deepEqual(status.human_gates, [])
  assert.equal(status.next_action, 'evaluate-registered-proposed-subdomains-for-safe-unchanged-acceptance-or-skip')
})

test('workflow CLI requires exactly one target kind', () => {
  const neither = spawnSync(process.execPath, ['bin/principles.js', 'workflow'], { cwd: root, encoding: 'utf8' })
  assert.equal(neither.status, 2)
  assert.match(neither.stderr, /exactly one of --target or --domain/)

  const both = spawnSync(process.execPath, ['bin/principles.js', 'workflow', '--domain', 'coding', '--target', 'domains/coding/design.md'], { cwd: root, encoding: 'utf8' })
  assert.equal(both.status, 2)
  assert.match(both.stderr, /exactly one of --target or --domain/)
})
