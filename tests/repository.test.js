import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { safeResolve } from '../src/repository.js'

test('safe path handling rejects traversal, absolute paths, and symlink escape', () => {
  const root = mkdtempSync(join(tmpdir(), 'principles-path-'))
  mkdirSync(join(root, 'inside'))
  writeFileSync(join(root, 'inside', 'file'), 'ok')
  symlinkSync(tmpdir(), join(root, 'escape'))
  assert.throws(() => safeResolve(root, '../outside'))
  assert.throws(() => safeResolve(root, '/etc/passwd'))
  assert.throws(() => safeResolve(root, 'escape'))
  assert.equal(safeResolve(root, 'inside/file'), realpathSync(join(root, 'inside', 'file')))
  rmSync(root, { recursive: true, force: true })
})
