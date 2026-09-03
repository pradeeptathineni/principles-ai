import test from 'node:test'
import assert from 'node:assert/strict'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DiagnosticBag } from '../src/diagnostics.js'
import { SchemaValidator } from '../src/schema.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

function source(overrides = {}) {
  return {
    schema_version: 4,
    id: 'SRC-000001',
    title: 'Source',
    publisher: 'Publisher',
    evidence_kind: 'normative-authority',
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

test('source records use explicit evidence kinds instead of scalar authority ranks', () => {
  const bag = new DiagnosticBag()
  const schema = new SchemaValidator(root, bag)
  schema.validate('source_record', source({ evidence_kind: 'A' }), 'source.yaml')
  assert.ok(bag.items.some((item) => item.code === 'SCHEMA_INVALID' && item.details?.keyword === 'enum'))
})

test('domain lifecycle is independent from review sidecars', () => {
  const bag = new DiagnosticBag()
  const schema = new SchemaValidator(root, bag)
  const value = {
    schema_version: 6,
    id: 'coding', code: 'COD', title: 'Coding', taxonomy_status: 'proposed', description: 'Coding guidance.',
    human_intent: { required_subdomains: [], priorities: [], exclusions: [], scope_notes: [] },
    subdomains: [{ id: 'design', code: 'DES', title: 'Design', description: 'Coding design decisions and practices.', status: 'proposed', origin: 'research' }]
  }
  assert.equal(schema.validate('domain_manifest', value, 'domain.yaml'), true)
  value.taxonomy_status = 'accepted'
  value.subdomains[0].status = 'accepted'
  assert.equal(schema.validate('domain_manifest', value, 'domain.yaml'), true)
})

test('every subdomain requires a canonical scope description', () => {
  const bag = new DiagnosticBag()
  const schema = new SchemaValidator(root, bag)
  const value = {
    schema_version: 6,
    id: 'coding', code: 'COD', title: 'Coding', taxonomy_status: 'proposed', description: 'Coding guidance.',
    human_intent: { required_subdomains: [], priorities: [], exclusions: [], scope_notes: [] },
    subdomains: [{ id: 'design', code: 'DES', title: 'Design', status: 'proposed', origin: 'research' }]
  }
  assert.equal(schema.validate('domain_manifest', value, 'domain.yaml'), false)
  assert.ok(bag.items.some((item) => item.code === 'SCHEMA_INVALID' && item.details?.keyword === 'required'))
})
