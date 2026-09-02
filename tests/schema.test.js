import test from 'node:test'
import assert from 'node:assert/strict'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DiagnosticBag } from '../src/diagnostics.js'
import { SchemaValidator } from '../src/schema.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

function source(overrides = {}) {
  return {
    schema_version: 3,
    id: 'SRC-000001',
    title: 'Source',
    publisher: 'Publisher',
    source_type: 'standard',
    authority_class: 'A',
    canonical_url: 'https://example.com/',
    url_aliases: [],
    published_or_version: null,
    first_retrieved: '2026-09-01',
    last_reviewed: '2026-09-01',
    status: 'active',
    superseded_by: null,
    ...overrides
  }
}

test('Draft 2020-12 validation asserts URI/date formats and rejects unknown fields', () => {
  const bag = new DiagnosticBag()
  const schema = new SchemaValidator(root, bag)
  schema.validate('source_record', source({ canonical_url: 'not a URI', first_retrieved: '2026-99-99', unexpected: true }), 'source.yaml')
  assert.ok(bag.items.filter((item) => item.code === 'SCHEMA_INVALID').some((item) => item.details?.keyword === 'format'))
  assert.ok(bag.items.filter((item) => item.code === 'SCHEMA_INVALID').some((item) => item.details?.keyword === 'additionalProperties'))
})

test('schema lifecycle conditionals reject moved sources without aliases', () => {
  const bag = new DiagnosticBag()
  const schema = new SchemaValidator(root, bag)
  schema.validate('source_record', source({ status: 'moved' }), 'source.yaml')
  assert.ok(bag.items.some((item) => item.code === 'SCHEMA_INVALID' && item.details?.keyword === 'minItems'))
})
