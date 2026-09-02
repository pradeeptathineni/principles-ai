import test from 'node:test'
import assert from 'node:assert/strict'
import { DiagnosticBag } from '../src/diagnostics.js'
import { parseYamlText } from '../src/yaml.js'

test('YAML 1.2 core preserves date-looking scalars as strings', () => {
  const bag = new DiagnosticBag()
  const value = parseYamlText('date: 2026-09-01\ntruth: true\n', 'fixture.yaml', bag)
  assert.equal(bag.errorCount, 0)
  assert.equal(value.date, '2026-09-01')
  assert.equal(value.truth, true)
})

for (const [name, yaml, code] of [
  ['duplicate keys', 'a: 1\na: 2\n', 'YAML_PARSE'],
  ['anchors and aliases', 'a: &value 1\nb: *value\n', 'YAML_ANCHOR'],
  ['merge keys', 'a: {x: 1}\nb: {<<: {x: 2}}\n', 'YAML_MERGE'],
  ['explicit tags', 'a: !!str value\n', 'YAML_TAG'],
  ['non-string keys', '? [a, b]\n: value\n', 'YAML_KEY_TYPE']
]) {
  test(`safe YAML rejects ${name}`, () => {
    const bag = new DiagnosticBag()
    parseYamlText(yaml, 'fixture.yaml', bag)
    assert.ok(bag.items.some((item) => item.code === code), bag.items.map((item) => item.code).join(', '))
  })
}
