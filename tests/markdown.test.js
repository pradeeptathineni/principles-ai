import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DiagnosticBag } from '../src/diagnostics.js'
import { parseCorpusFile } from '../src/markdown.js'

const fixture = readFileSync(fileURLToPath(new URL('fixtures/corpus/valid.md', import.meta.url)), 'utf8')
const sources = new Map([
  ['SRC-000001', { value: { id: 'SRC-000001', title: 'Example Source One', canonical_url: 'https://example.com/one', url_aliases: [] } }],
  ['SRC-000002', { value: { id: 'SRC-000002', title: 'Example Source Two', canonical_url: 'https://example.com/two', url_aliases: [] } }]
])
const manifests = new Map([['coding', { value: { id: 'coding', taxonomy_status: 'accepted', subdomains: [] } }]])
const schema = { validate() { return true } }

function parse(text) {
  const root = mkdtempSync(join(tmpdir(), 'principles-markdown-'))
  mkdirSync(join(root, 'domains', 'coding'), { recursive: true })
  writeFileSync(join(root, 'domains', 'coding', 'principles.md'), text)
  const bag = new DiagnosticBag()
  const document = parseCorpusFile(root, 'domains/coding/principles.md', schema, manifests, sources, bag)
  rmSync(root, { recursive: true, force: true })
  return { document, bag }
}

test('structured GFM fixture normalizes claims, references, and cited goals', () => {
  const { document, bag } = parse(fixture)
  assert.equal(bag.errorCount, 0, bag.items.map((item) => `${item.code}: ${item.message}`).join('\n'))
  assert.equal(document.entries[0].claims.length, 6)
  assert.equal(document.entries[0].statement.text, 'Prefer bounded changes with visible intent.')
  assert.match(document.entries[0].statement.claimSha256, /^[a-f0-9]{64}$/)
  assert.deepEqual(document.entries[0].why[0].citationLabels, ['1', '2'])
  assert.equal(document.references[1].sourceId, 'SRC-000002')
})

test('adjacent citations are rejected as a GFM full reference link', () => {
  const { bag } = parse(fixture.replace('Reviewers can reason more precisely about a bounded change. [1], [2]', 'Reviewers can reason more precisely about a bounded change. [1][2]'))
  assert.ok(bag.items.some((item) => item.code === 'CITATION_ADJACENT'))
})

test('claim link titles are rejected', () => {
  const { bag } = parse(fixture.replace('Prefer bounded changes with visible intent. [1]', 'Prefer [bounded](https://example.com "hidden") changes with visible intent. [1]'))
  assert.ok(bag.items.some((item) => item.code === 'CLAIM_LINK_TITLE'))
})

test('unknown optional sections and nested practices are rejected', () => {
  const unknown = fixture.replace('#### Practices', '#### Unknown\n\nText. [1]\n\n#### Practices')
  assert.ok(parse(unknown).bag.items.some((item) => item.code === 'ENTRY_SECTION_UNKNOWN'))
  const nested = fixture.replace('- Separate unrelated changes. [1]', '- Separate unrelated changes. [1]\n  - Nested item. [1]')
  assert.ok(parse(nested).bag.items.some((item) => item.code === 'ENTRY_LIST_ITEM_SHAPE'))
})

test('canonical heading source markers are exact', () => {
  assert.ok(parse(fixture.replace('# Coding Principles', '#   Coding Principles')).bag.items.some((item) => item.code === 'DOCUMENT_H1'))
  assert.ok(parse(fixture.replace('## Principles', '##    Principles')).bag.items.some((item) => item.code === 'DOCUMENT_SECTIONS'))
  assert.ok(parse(fixture.replace('### PRN-000001', '###   PRN-000001')).bag.items.some((item) => item.code === 'ENTRY_HEADING'))
  assert.ok(parse(fixture.replace('#### Why', '####   Why')).bag.items.some((item) => item.code === 'ENTRY_SECTION_UNKNOWN'))
})

test('entry tags are unique', () => {
  const { bag } = parse(fixture.replace('- code-review', '- code-review\n- code-review'))
  assert.ok(bag.items.some((item) => item.code === 'ENTRY_TAG_DUPLICATE'))
})
