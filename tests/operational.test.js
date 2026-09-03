import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DiagnosticBag } from '../src/diagnostics.js'
import { runOperationalChecks } from '../src/operational.js'

test('operational checks compare explicit content hashes and report review due without claiming staleness', async () => {
  const root = mkdtempSync(join(tmpdir(), 'principles-operational-'))
  writeFileSync(join(root, 'AGENTS.md'), '# Agent\n')
  writeFileSync(join(root, 'README.md'), '# Readme\n\n[Other](https://other.example/)\n')
  const source = {
    path: 'sources/SRC-000001.yaml',
    value: {
      id: 'SRC-000001',
      canonical_url: 'https://example.com/',
      url_aliases: [],
      last_reviewed: '2025-01-01'
    }
  }
  const bag = new DiagnosticBag()
  const currentHash = 'b'.repeat(64)
  const result = await runOperationalChecks({
    root,
    sources: [source],
    sourcePolicy: { lifecycle: { dates: { review_due_after_days: 365 } } },
    bag,
    baseline: { version: 1, observations: { 'https://example.com/': { sha256: 'a'.repeat(64) } } },
    asOf: '2026-09-01',
    includeRepositoryLinks: false,
    externalOptions: {
      resolveHost: async () => [{ address: '93.184.216.34', family: 4 }],
      request: async (_url, _address, _family, method) => ({ status: 200, headers: {}, bytes: 1, contentSha256: method === 'GET' ? currentHash : null })
    }
  })
  assert.ok(bag.items.some((item) => item.code === 'SOURCE_CONTENT_CHANGED'))
  assert.ok(bag.items.some((item) => item.code === 'SOURCE_REVIEW_DUE' && /does not prove semantic staleness/.test(item.message)))
  assert.equal(result.snapshot.observations['https://example.com/'].sha256, currentHash)
  assert.equal(result.results.some((item) => item.url === 'https://other.example/'), false)
  assert.equal(result.reviewDue[0].id, 'SRC-000001')
  rmSync(root, { recursive: true, force: true })
})
