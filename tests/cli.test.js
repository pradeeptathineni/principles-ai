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
