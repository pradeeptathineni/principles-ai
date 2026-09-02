import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DiagnosticBag } from '../src/diagnostics.js'
import { loadSources } from '../src/sources.js'
import { loadManifests } from '../src/taxonomy.js'

const schema = { validate() { return true } }

test('canonical source symlink escape is diagnosed instead of disappearing', () => {
  const root = mkdtempSync(join(tmpdir(), 'principles-source-symlink-'))
  const outside = mkdtempSync(join(tmpdir(), 'principles-source-outside-'))
  mkdirSync(join(root, 'sources'))
  writeFileSync(join(outside, 'SRC-000001.yaml'), 'schema_version: 3\nid: SRC-000001\n')
  symlinkSync(join(outside, 'SRC-000001.yaml'), join(root, 'sources', 'SRC-000001.yaml'))
  const bag = new DiagnosticBag()
  assert.equal(loadSources(root, schema, bag).length, 0)
  assert.ok(bag.items.some((item) => item.code === 'PATH_UNSAFE'))
  rmSync(root, { recursive: true, force: true })
  rmSync(outside, { recursive: true, force: true })
})

test('nested domain manifests violate the exact manifest path contract', () => {
  const root = mkdtempSync(join(tmpdir(), 'principles-nested-manifest-'))
  const fixture = readFileSync(fileURLToPath(new URL('../domains/coding/domain.yaml', import.meta.url)), 'utf8')
  mkdirSync(join(root, 'domains', 'coding', 'nested'), { recursive: true })
  writeFileSync(join(root, 'domains', 'coding', 'nested', 'domain.yaml'), fixture)
  const bag = new DiagnosticBag()
  assert.equal(loadManifests(root, schema, bag).length, 0)
  assert.ok(bag.items.some((item) => item.code === 'MANIFEST_PATH'))
  rmSync(root, { recursive: true, force: true })
})

test('off-pattern canonical registry YAML is rejected rather than ignored', () => {
  const root = mkdtempSync(join(tmpdir(), 'principles-source-path-'))
  mkdirSync(join(root, 'sources'))
  writeFileSync(join(root, 'sources', 'source.yaml'), 'schema_version: 3\n')
  const bag = new DiagnosticBag()
  assert.equal(loadSources(root, schema, bag).length, 0)
  assert.ok(bag.items.some((item) => item.code === 'SOURCE_PATH'))
  rmSync(root, { recursive: true, force: true })
})

test('top-level domain directories require a direct manifest', () => {
  const root = mkdtempSync(join(tmpdir(), 'principles-missing-manifest-'))
  mkdirSync(join(root, 'domains', 'orphan'), { recursive: true })
  const bag = new DiagnosticBag()
  assert.equal(loadManifests(root, schema, bag).length, 0)
  assert.ok(bag.items.some((item) => item.code === 'MANIFEST_MISSING'))
  rmSync(root, { recursive: true, force: true })
})
