import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SchemaValidator } from '../../../src/schema.js'
import { parseCorpusFile } from '../../../src/markdown.js'
import { DiagnosticBag } from '../../../src/diagnostics.js'

export function fixtureSources() {
  return new Map([1, 2].map((number) => {
    const id = `SRC-00000${number}`
    const value = { schema_version: 4, id, publisher: 'Synthetic fixture', evidence_kind: 'official-documentation', published_or_version: null, first_retrieved: '2026-10-20', last_reviewed: '2026-10-21', superseded_by: null, title: `Example Source ${number === 1 ? 'One' : 'Two'}`, status: number === 1 ? 'active' : 'withdrawn', canonical_url: `https://example.com/${number === 1 ? 'one' : 'two'}`, url_aliases: [] }
    return [id, { path: `sources/${id}.yaml`, inputSha256: createHash('sha256').update(JSON.stringify(value)).digest('hex'), value }]
  }))
}

// Real parser output, with independent file-local label 1 in each document.
export function fixtureRequest() {
  const root = mkdtempSync(join(tmpdir(), 'principles-context-'))
  const sources = fixtureSources()
  const manifests = new Map([['coding', { value: { id: 'coding', taxonomy_status: 'accepted', subdomains: [] } }]])
  const text = readFileSync(new URL('../corpus/valid.md', import.meta.url), 'utf8')
  const bag = new DiagnosticBag()
  const schema = new SchemaValidator(fileURLToPath(new URL('../../../', import.meta.url)), bag)
  for (const source of sources.values()) schema.validate('source_record', source.value, source.path)
  mkdirSync(join(root, 'domains/coding'), { recursive: true })
  const parse = (path, contents) => {
    writeFileSync(join(root, path), contents)
    return parseCorpusFile(root, path, schema, manifests, sources, bag)
  }
  try {
    const draft = parse('domains/coding/principles.md', text)
    const activeDraftText = text
      .replaceAll('coding.principles', 'coding.personal-growth')
      .replaceAll('Coding Principles', 'Coding Personal Growth')
      .replace('type: principles', 'type: personal-growth')
      .replaceAll('PRN-000001', 'PRN-000002')
      .replace('[Example Source One][1] — `SRC-000001`', '[Example Source Two][1] — `SRC-000002`')
      .replace('[Example Source Two][2] — `SRC-000002`', '[Example Source One][2] — `SRC-000001`')
      .replace('[1]: https://example.com/one', '[1]: https://example.com/two')
      .replace('[2]: https://example.com/two', '[2]: https://example.com/one')
    const activeDraft = parse('domains/coding/personal-growth.md', activeDraftText)
    const active = parse('domains/coding/personal-growth.md', activeDraftText
      .replace('status: draft', 'status: active')
      .replace('last_reviewed: null', 'last_reviewed: 2026-10-21')
      .replace('reviewed_content_sha256: null', `reviewed_content_sha256: ${activeDraft.semanticSha256}`))
    assert.equal(bag.errorCount, 0, JSON.stringify(bag.items))
    const documents = [draft, active]
    return {
      documents, entryById: new Map(documents.flatMap((document) => document.entries.map((entry) => [entry.id, { document, entry }]))),
      sourceById: sources, evidenceByEntryId: new Map(), profile: 'standard', fileIds: documents.map((document) => document.frontmatter.id), revision: 'fixture-revision-1'
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
}

// Producer-side contract probe only. C04 must qualify the actual Context consumer.
export function consumeOperational(context, expectedDigest) {
  if (context.schema_version !== 2) throw new Error('Unsupported export version')
  if (context.input_sha256 !== expectedDigest) throw new Error('Stale selection')
  if (context.usage === 'reference-only' || context.omitted_sections.includes('applicability')) throw new Error('Lossy reference-only input')
  for (const entry of context.entries) {
    if (!['draft', 'active'].includes(entry.status)) throw new Error('Unknown lifecycle')
    assert.ok(Array.isArray(entry.applicability))
    for (const id of entry.source_ids) assert.ok(entry.source_inputs.some((source) => source.id === id))
  }
  return context.entries
}
