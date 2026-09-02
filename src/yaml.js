import { isAlias, isMap, isNode, isPair, LineCounter, parseDocument, visit } from 'yaml'
import { LIMITS } from './constants.js'
import { DiagnosticBag } from './diagnostics.js'
import { assertMetadataStrings, readCanonicalText } from './repository.js'

function sourceLocation(lineCounter, offset) {
  if (!lineCounter || offset === undefined) return {}
  const position = lineCounter.linePos(offset)
  return { line: position.line, column: position.col }
}

function inspectYamlTree(document, bag, path, lineCounter) {
  let nodes = 0
  visit(document, (_key, node) => {
    if (!isNode(node) && !isPair(node)) return
    nodes += 1
    const offset = node.range?.[0] ?? node.key?.range?.[0]
    const location = sourceLocation(lineCounter, offset)
    if (nodes > LIMITS.yamlNodes) {
      bag.error('YAML_NODE_LIMIT', `YAML exceeds ${LIMITS.yamlNodes} parsed nodes.`, path, location)
      return visit.BREAK
    }
    if (isAlias(node)) bag.error('YAML_ALIAS', 'YAML aliases are forbidden.', path, location)
    if (isNode(node) && node.anchor) bag.error('YAML_ANCHOR', 'YAML anchors are forbidden.', path, location)
    if (isNode(node) && node.tag) bag.error('YAML_TAG', 'Explicit and custom YAML tags are forbidden.', path, location)
    if (isPair(node) && node.key?.value === '<<') bag.error('YAML_MERGE', 'YAML merge keys are forbidden.', path, location)
    if (isMap(node)) {
      const seen = new Set()
      for (const pair of node.items) {
        const key = pair.key?.value
        if (typeof key !== 'string') {
          bag.error('YAML_KEY_TYPE', 'YAML mapping keys must be strings.', path, sourceLocation(lineCounter, pair.key?.range?.[0]))
        } else if (seen.has(key)) {
          bag.error('YAML_DUPLICATE_KEY', `Duplicate YAML key: ${key}`, path, sourceLocation(lineCounter, pair.key?.range?.[0]))
        } else seen.add(key)
      }
    }
  })
}

export function parseYamlText(text, path, bag = new DiagnosticBag(), { metadata = true } = {}) {
  const errorsBefore = bag.errorCount
  const lineCounter = new LineCounter()
  const document = parseDocument(text, {
    version: '1.2',
    schema: 'core',
    uniqueKeys: true,
    maxAliasCount: 0,
    prettyErrors: false,
    lineCounter
  })
  for (const error of document.errors) {
    bag.error('YAML_PARSE', error.message.replace(/\n.*/s, ''), path, sourceLocation(lineCounter, error.pos?.[0]))
  }
  for (const warning of document.warnings) {
    bag.error('YAML_PARSE_WARNING', warning.message.replace(/\n.*/s, ''), path, sourceLocation(lineCounter, warning.pos?.[0]))
  }
  inspectYamlTree(document, bag, path, lineCounter)
  if (document.errors.length > 0 || bag.errorCount > errorsBefore) return null
  let value
  try {
    value = document.toJS({ maxAliasCount: 0, mapAsMap: false })
  } catch (error) {
    bag.error('YAML_CONSTRUCTION', error.message, path)
    return null
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    bag.error('YAML_ROOT', 'Canonical YAML root must be a mapping.', path)
    return null
  }
  if (metadata) assertMetadataStrings(value, bag, path, '', new Set(['/prompt']))
  return value
}

export function loadYaml(root, path, bag = new DiagnosticBag(), options = {}) {
  const text = readCanonicalText(root, path, bag, { maxBytes: LIMITS.yamlBytes, ...options })
  return text === null ? null : parseYamlText(text, path, bag, options)
}
