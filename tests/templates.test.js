import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { DiagnosticBag } from '../src/diagnostics.js'
import { parseCorpusFile } from '../src/markdown.js'
import { SchemaValidator } from '../src/schema.js'

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const sourceById = new Map([
  ['SRC-000001', { value: { title: 'Example', canonical_url: 'https://example.com/source-one', url_aliases: [] } }],
  ['SRC-000002', { value: { title: 'Example', canonical_url: 'https://example.com/source-two', url_aliases: [] } }]
])
const manifests = new Map([['coding', { value: { taxonomy_status: 'accepted', subdomains: [{ id: 'design', status: 'accepted' }] } }]])

function instantiate(template) {
  return template
    .replaceAll('<domain>', 'coding')
    .replaceAll('<Domain>', 'Coding')
    .replaceAll('<subdomain>', 'design')
    .replaceAll('<Subdomain>', 'Design')
    .replaceAll('<normalized-retrieval-tag>', 'example')
    .replace(/<[^>]+>/g, 'Example')
}

for (const [templateName, outputName] of [
  ['principles.md', 'principles.md'],
  ['personal-growth.md', 'personal-growth.md'],
  ['subdomain.md', 'design.md']
]) {
  test(`${templateName} instantiates to the executable schema and GFM grammar`, () => {
    const root = mkdtempSync(join(tmpdir(), 'principles-template-'))
    mkdirSync(join(root, 'domains', 'coding'), { recursive: true })
    const template = readFileSync(join(repositoryRoot, 'config', 'templates', templateName), 'utf8')
    writeFileSync(join(root, 'domains', 'coding', outputName), instantiate(template))
    const bag = new DiagnosticBag()
    const schema = new SchemaValidator(repositoryRoot, bag)
    parseCorpusFile(root, `domains/coding/${outputName}`, schema, manifests, sourceById, bag)
    assert.equal(bag.errorCount, 0, bag.items.map((item) => `${item.code}: ${item.message}`).join('\n'))
    rmSync(root, { recursive: true, force: true })
  })
}
