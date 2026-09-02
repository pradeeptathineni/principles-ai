import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DiagnosticBag } from '../src/diagnostics.js'
import { loadSources, normalizeStoredUrl, validateSourceTransition } from '../src/sources.js'

test('bounded URL normalization preserves unlisted path and query octets', () => {
  assert.equal(normalizeStoredUrl('HTTPS://EXAMPLE.COM:443/a/../b/%2f?q=%2F'), 'https://example.com/a/../b/%2f?q=%2F')
  assert.equal(normalizeStoredUrl('http://Example.com'), 'http://example.com/')
})

test('bounded URL normalization rejects userinfo, fragments, and Unicode hosts', () => {
  assert.equal(normalizeStoredUrl('https://user@example.com/'), null)
  assert.equal(normalizeStoredUrl('https://example.com/#fragment'), null)
  assert.equal(normalizeStoredUrl('https://例.example/'), null)
})

function record(canonical_url, status = 'active', url_aliases = []) {
  return { path: 'sources/SRC-000001.yaml', value: { id: 'SRC-000001', canonical_url, status, url_aliases } }
}

test('source URL move transition preserves identity, old canonical URL, and aliases', () => {
  const before = [record('https://example.com/old', 'active', ['https://example.com/older'])]
  const after = [record('https://example.com/new', 'moved', ['https://example.com/old', 'https://example.com/older'])]
  const ledger = { sources: { retired: [] } }
  const bag = new DiagnosticBag()
  validateSourceTransition(before, after, ledger, ledger, bag)
  assert.equal(bag.errorCount, 0)
})

test('source URL move transition rejects status bypass and alias removal', () => {
  const before = [record('https://example.com/old', 'active', ['https://example.com/older'])]
  const after = [record('https://example.com/new', 'active', [])]
  const ledger = { sources: { retired: [] } }
  const bag = new DiagnosticBag()
  validateSourceTransition(before, after, ledger, ledger, bag)
  for (const code of ['SOURCE_MOVE_STATUS', 'SOURCE_MOVE_ALIAS', 'SOURCE_ALIAS_REMOVED']) assert.ok(bag.items.some((item) => item.code === code), code)
})

test('schema-invalid source records are not passed to cross-file validation', () => {
  const root = mkdtempSync(join(tmpdir(), 'principles-invalid-source-'))
  mkdirSync(join(root, 'sources'))
  writeFileSync(join(root, 'sources', 'SRC-000001.yaml'), 'schema_version: 3\nid: SRC-000001\nstatus: active\n')
  const bag = new DiagnosticBag()
  const schema = { validate() { bag.error('SCHEMA_INVALID', 'invalid fixture', 'sources/SRC-000001.yaml'); return false } }
  assert.deepEqual(loadSources(root, schema, bag), [])
  assert.equal(bag.errorCount, 1)
  rmSync(root, { recursive: true, force: true })
})

test('new supersession targets must be active or moved', () => {
  const before = [record('https://example.com/old'), { path: 'sources/SRC-000002.yaml', value: { id: 'SRC-000002', canonical_url: 'https://example.com/new', status: 'active', url_aliases: [] } }]
  const after = [
    { path: 'sources/SRC-000001.yaml', value: { ...before[0].value, status: 'superseded', superseded_by: 'SRC-000002' } },
    { path: 'sources/SRC-000002.yaml', value: { ...before[1].value, status: 'withdrawn' } }
  ]
  const ledger = { sources: { retired: [] } }
  const bag = new DiagnosticBag()
  validateSourceTransition(before, after, ledger, ledger, bag)
  assert.ok(bag.items.some((item) => item.code === 'SOURCE_SUPERSESSION_TARGET_STATUS'))
})
