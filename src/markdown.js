import { createHash } from 'node:crypto'
import { basename } from 'node:path'
import canonicalize from 'canonicalize'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
import { LIMITS } from './constants.js'
import { nodeLocation } from './diagnostics.js'
import { readCanonicalText, toRepoPath, walkCanonicalRepository } from './repository.js'
import { parseYamlText } from './yaml.js'

const processor = unified().use(remarkParse).use(remarkGfm)
const entryHeading = /^(PRN-[0-9]{6}) — (\S(?:.*\S)?)$/
const citationRun = /(\[[1-9][0-9]*\](?:, \[[1-9][0-9]*\])*)$/
const sectionNames = new Map([
  ['Why', 'why'],
  ['Practices', 'practices'],
  ['Applicability', 'applicability'],
  ['Goals', 'goals'],
  ['Tags', 'tags']
])
const sectionOrder = ['why', 'practices', 'applicability', 'goals', 'tags']

function visibleText(node) {
  if (!node) return ''
  if (node.type === 'text' || node.type === 'inlineCode') return node.value
  return (node.children ?? []).map(visibleText).join('')
}

function wordCount(value) {
  return value.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu)?.length ?? 0
}

function validateWordEconomy(document, policy, bag) {
  const limits = policy?.word_economy?.preferred_max_words
  if (!limits) return
  function check(label, text, limit, location = null) {
    const count = wordCount(text)
    if (count > limit) bag.warning('WORD_ECONOMY', `${label} has ${count} words; the preferred maximum is ${limit}. Compress it or document why the extra length earns its place.`, document.path, location)
  }
  check('Introduction', document.introduction, limits.introduction)
  for (const entry of document.entries) {
    check(`${entry.id} statement`, entry.statement?.text ?? '', limits.statement, entry.statement?.location)
    for (const claim of entry.why) check(`${entry.id} ${claim.role}`, claim.text, limits.why_paragraph, claim.location)
    for (const claim of entry.practices) check(`${entry.id} ${claim.role}`, claim.text, limits.practice_item, claim.location)
    for (const claim of entry.applicability) check(`${entry.id} ${claim.role}`, claim.text, limits.applicability_paragraph, claim.location)
    const entryText = [entry.title, entry.statement?.text ?? '', ...entry.why.map((claim) => claim.text), ...entry.practices.map((claim) => claim.text), ...entry.applicability.map((claim) => claim.text), ...entry.goals.map((claim) => claim.text)].join(' ')
    check(`${entry.id} entry`, entryText, limits.entry, entry.heading ? nodeLocation(entry.heading) : null)
  }
  const fileText = [document.title, document.introduction, ...document.entries.flatMap((entry) => [entry.title, entry.statement?.text ?? '', ...entry.why.map((claim) => claim.text), ...entry.practices.map((claim) => claim.text), ...entry.applicability.map((claim) => claim.text), ...entry.goals.map((claim) => claim.text)])].join(' ')
  check('File', fileText, limits.file)
}

function rawNode(body, node) {
  return body.slice(node.position.start.offset, node.position.end.offset)
}

function splitFrontmatter(text, path, bag) {
  const lines = text.split('\n')
  if (lines[0] !== '---') {
    bag.error('FRONTMATTER_OPEN', 'Corpus file must begin with an exact --- frontmatter delimiter.', path)
    return null
  }
  const closing = lines.indexOf('---', 1)
  if (closing < 0) {
    bag.error('FRONTMATTER_CLOSE', 'Corpus frontmatter has no exact closing --- delimiter.', path)
    return null
  }
  return {
    yaml: `${lines.slice(1, closing).join('\n')}\n`,
    body: lines.slice(closing + 1).join('\n'),
    bodyLineOffset: closing + 1
  }
}

function validateForbiddenAst(tree, path, bag, lineOffset) {
  visit(tree, (node) => {
    if (['html', 'image', 'imageReference', 'delete', 'table', 'tableRow', 'tableCell', 'blockquote', 'code', 'thematicBreak'].includes(node.type)) {
      bag.error('MARKDOWN_FORBIDDEN_NODE', `Markdown node ${node.type} is outside the canonical grammar.`, path, nodeLocation(node, lineOffset))
    }
    if (node.type === 'inlineCode' && /[^ ]\s| {2,}/u.test(node.value)) {
      bag.error('INLINE_CODE_WHITESPACE', 'Inline code may use only single ASCII spaces between tokens.', path, nodeLocation(node, lineOffset))
    }
  })
}

function collectInlineLinks(node) {
  const links = []
  visit(node, (child) => {
    if (child.type === 'link' || child.type === 'linkReference') links.push(child)
  })
  return links
}

function parseClaim(node, role, body, definitions, path, bag, lineOffset, { citationRequired = true } = {}) {
  const raw = rawNode(body, node)
  if (/\[[1-9][0-9]*\]\[[1-9][0-9]*\]/.test(raw)) {
    bag.error('CITATION_ADJACENT', 'Adjacent citation labels are forbidden; use comma-and-space separators.', path, nodeLocation(node, lineOffset))
  }
  const match = citationRun.exec(raw)
  const links = collectInlineLinks(node)
  const numericLinks = links.filter((link) => /^[1-9][0-9]*$/.test(link.label ?? ''))
  if (!match) {
    if (citationRequired || numericLinks.length > 0) bag.error('CITATION_TERMINAL_RUN', `${role} must end with exactly one valid citation run.`, path, nodeLocation(node, lineOffset))
    const text = renderClaimText(node, Number.POSITIVE_INFINITY, definitions).normalize('NFC').replace(/\s+/gu, ' ').trim()
    return {
      role,
      node,
      text,
      citationLabels: [],
      claimSha256: null,
      location: nodeLocation(node, lineOffset)
    }
  }
  const labels = [...match[1].matchAll(/\[([1-9][0-9]*)\]/g)].map((item) => item[1])
  if (new Set(labels).size !== labels.length) bag.error('CITATION_DUPLICATE', `${role} citation run repeats a label.`, path, nodeLocation(node, lineOffset))
  if (labels.some((label, index) => index > 0 && Number(labels[index - 1]) >= Number(label))) bag.error('CITATION_ORDER', `${role} citation labels must be strictly ascending.`, path, nodeLocation(node, lineOffset))
  const terminalStart = node.position.start.offset + match.index
  const numericBeforeTerminal = numericLinks.some((link) => link.position.start.offset < terminalStart)
  if (numericBeforeTerminal) bag.error('CITATION_NONTERMINAL', `${role} contains a numeric citation outside its terminal run.`, path, nodeLocation(node, lineOffset))
  const terminalLinks = numericLinks.filter((link) => link.position.start.offset >= terminalStart).map((link) => String(link.label))
  if (terminalLinks.length !== labels.length || terminalLinks.some((label, index) => label !== labels[index])) {
    bag.error('CITATION_AST', `${role} terminal citation source does not parse as the required shortcut numeric reference links.`, path, nodeLocation(node, lineOffset))
  }
  for (const link of links) {
    const definition = link.type === 'linkReference' ? definitions.get(String(link.label).toLowerCase()) : null
    if ((link.type === 'link' && link.title !== null) || definition?.title != null) {
      bag.error('CLAIM_LINK_TITLE', `${role} contains an ordinary link title, which is forbidden in claim blocks.`, path, nodeLocation(link, lineOffset))
    }
  }
  const text = renderClaimText(node, terminalStart, definitions).normalize('NFC').replace(/\s+/gu, ' ').trim()
  return {
    role,
    node,
    text,
    citationLabels: labels,
    claimSha256: createHash('sha256').update(text, 'utf8').digest('hex'),
    location: nodeLocation(node, lineOffset)
  }
}

function renderClaimText(node, terminalStart, definitions) {
  function render(child) {
    if (child.position?.start.offset >= terminalStart) return ''
    switch (child.type) {
      case 'text': return child.value
      case 'inlineCode': return child.value
      case 'break': return ' '
      case 'link': return `${(child.children ?? []).map(render).join('')} <${child.url}>`
      case 'linkReference': {
        const definition = definitions.get(String(child.label).toLowerCase())
        return `${(child.children ?? []).map(render).join('')} <${definition?.url ?? ''}>`
      }
      default: return (child.children ?? []).map(render).join('')
    }
  }
  return render(node)
}

function singleParagraphList(node, path, bag, lineOffset, section, body, definitions, entry) {
  if (node.type !== 'list' || node.ordered) {
    bag.error('ENTRY_LIST_SHAPE', `${section} must contain exactly one unordered list.`, path, nodeLocation(node, lineOffset))
    return []
  }
  const items = []
  for (const [index, item] of node.children.entries()) {
    if (item.checked != null) bag.error('ENTRY_TASK_ITEM', `${section} task-list items are forbidden.`, path, nodeLocation(item, lineOffset))
    if (item.children.length !== 1 || item.children[0].type !== 'paragraph') {
      bag.error('ENTRY_LIST_ITEM_SHAPE', `${section} items must contain one paragraph and no nested blocks.`, path, nodeLocation(item, lineOffset))
      continue
    }
    const paragraph = item.children[0]
    if (section === 'tags') {
      const tag = visibleText(paragraph)
      if (paragraph.children.some((child) => child.type !== 'text') || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)) bag.error('ENTRY_TAG', `Invalid plain-text tag ${JSON.stringify(tag)}.`, path, nodeLocation(paragraph, lineOffset))
      items.push(tag)
    } else {
      const role = section === 'practices' ? `practice-${entry.practiceOrdinal++}` : `goal-${entry.goalOrdinal++}`
      const required = section === 'practices'
      const raw = rawNode(body, paragraph)
      const cited = citationRun.test(raw) || collectInlineLinks(paragraph).some((link) => /^[1-9][0-9]*$/.test(link.label ?? ''))
      items.push(parseClaim(paragraph, role, body, definitions, path, bag, lineOffset, { citationRequired: required || cited }))
    }
  }
  if (section === 'tags' && new Set(items).size !== items.length) {
    bag.error('ENTRY_TAG_DUPLICATE', 'Tags must be unique within an entry.', path, nodeLocation(node, lineOffset))
  }
  return items
}

function parseEntry(nodes, body, definitions, path, bag, lineOffset) {
  const heading = nodes[0]
  const headingText = visibleText(heading)
  const match = entryHeading.exec(headingText)
  const headingSource = rawNode(body, heading)
  if (!match || headingSource !== `### ${headingText}` || heading.children.some((child) => child.type !== 'text')) {
    bag.error('ENTRY_HEADING', 'Entry heading must be plain decoded text matching PRN-...... — Title.', path, nodeLocation(heading, lineOffset))
  }
  const entry = {
    id: match?.[1] ?? headingText,
    title: match?.[2] ?? '',
    heading,
    statement: null,
    why: [],
    practices: [],
    applicability: [],
    goals: [],
    tags: [],
    practiceOrdinal: 1,
    goalOrdinal: 1
  }
  let index = 1
  const statementNodes = []
  while (index < nodes.length && !(nodes[index].type === 'heading' && nodes[index].depth === 4)) statementNodes.push(nodes[index++])
  if (statementNodes.length !== 1 || statementNodes[0]?.type !== 'paragraph') {
    bag.error('ENTRY_STATEMENT_SHAPE', 'Entry must contain exactly one statement paragraph before Why.', path, nodeLocation(statementNodes[0] ?? heading, lineOffset))
  } else entry.statement = parseClaim(statementNodes[0], 'statement', body, definitions, path, bag, lineOffset)

  const seen = new Set()
  let lastOrder = -1
  while (index < nodes.length) {
    const sectionHeading = nodes[index++]
    if (sectionHeading.type !== 'heading' || sectionHeading.depth !== 4) {
      bag.error('ENTRY_BLOCK', 'Unexpected block outside an entry section.', path, nodeLocation(sectionHeading, lineOffset))
      continue
    }
    const section = sectionNames.get(visibleText(sectionHeading))
    if (!section || rawNode(body, sectionHeading) !== `#### ${visibleText(sectionHeading)}`) {
      bag.error('ENTRY_SECTION_UNKNOWN', `Unknown entry section ${JSON.stringify(visibleText(sectionHeading))}.`, path, nodeLocation(sectionHeading, lineOffset))
    } else {
      if (seen.has(section)) bag.error('ENTRY_SECTION_DUPLICATE', `Duplicate ${section} section.`, path, nodeLocation(sectionHeading, lineOffset))
      seen.add(section)
      const order = sectionOrder.indexOf(section)
      if (order < lastOrder) bag.error('ENTRY_SECTION_ORDER', `${section} is out of canonical section order.`, path, nodeLocation(sectionHeading, lineOffset))
      lastOrder = Math.max(lastOrder, order)
    }
    const content = []
    while (index < nodes.length && !(nodes[index].type === 'heading' && nodes[index].depth === 4)) content.push(nodes[index++])
    if (!section) continue
    if (content.length === 0) bag.error('ENTRY_SECTION_EMPTY', `${section} section must not be empty.`, path, nodeLocation(sectionHeading, lineOffset))
    if (section === 'why' || section === 'applicability') {
      for (const [ordinal, block] of content.entries()) {
        if (block.type !== 'paragraph') bag.error('ENTRY_PARAGRAPH_SHAPE', `${section} permits only top-level paragraphs.`, path, nodeLocation(block, lineOffset))
        else entry[section].push(parseClaim(block, `${section}-${ordinal + 1}`, body, definitions, path, bag, lineOffset))
      }
    } else {
      if (content.length !== 1) bag.error('ENTRY_SECTION_BLOCK_COUNT', `${section} must contain exactly one top-level list.`, path, nodeLocation(sectionHeading, lineOffset))
      if (content[0]) entry[section] = singleParagraphList(content[0], path, bag, lineOffset, section, body, definitions, entry)
    }
  }
  if (!seen.has('why')) bag.error('ENTRY_WHY_MISSING', 'Entry is missing required Why section.', path, nodeLocation(heading, lineOffset))
  if (!seen.has('practices')) bag.error('ENTRY_PRACTICES_MISSING', 'Entry is missing required Practices section.', path, nodeLocation(heading, lineOffset))
  delete entry.practiceOrdinal
  delete entry.goalOrdinal
  entry.claims = [entry.statement, ...entry.why, ...entry.practices, ...entry.applicability, ...entry.goals.filter((goal) => goal.citationLabels.length > 0)].filter(Boolean)
  return entry
}

function parseReferences(nodes, body, definitions, sourceById, path, bag, lineOffset) {
  if (nodes.length === 0 || nodes[0].type !== 'list' || !nodes[0].ordered || nodes[0].start !== 1) {
    bag.error('BIBLIOGRAPHY_LIST', 'References must begin with exactly one ordered list starting at 1.', path, nodeLocation(nodes[0], lineOffset))
    return []
  }
  const list = nodes[0]
  const references = []
  for (const [index, item] of list.children.entries()) {
    const paragraph = item.children.length === 1 && item.children[0].type === 'paragraph' ? item.children[0] : null
    const children = paragraph?.children ?? []
    const link = children[0]
    const separator = children[1]
    const sourceCode = children[2]
    const label = link?.type === 'linkReference' && link.referenceType === 'full' ? String(link.label) : null
    const sourceId = sourceCode?.type === 'inlineCode' ? sourceCode.value : null
    const markerRaw = rawNode(body, item).match(/^([1-9][0-9]*)\./)?.[1]
    const exactShape = children.length === 3 && link?.type === 'linkReference' && link.referenceType === 'full' &&
      /^[1-9][0-9]*$/.test(label ?? '') && separator?.type === 'text' && separator.value === ' — ' &&
      /^SRC-[0-9]{6}$/.test(sourceId ?? '') && link.children.every((child) => child.type === 'text')
    if (!paragraph || !exactShape) bag.error('BIBLIOGRAPHY_ENTRY', 'Bibliography item must exactly map a decoded title and numeric label to one SRC ID.', path, nodeLocation(item, lineOffset))
    const expectedLabel = String(index + 1)
    if (label !== expectedLabel || markerRaw !== label) bag.error('BIBLIOGRAPHY_LABEL', `Bibliography marker and link label must equal contiguous label ${expectedLabel}.`, path, nodeLocation(item, lineOffset))
    const source = sourceById.get(sourceId)?.value
    if (!source) bag.error('BIBLIOGRAPHY_SOURCE', `Bibliography source ${sourceId ?? '<missing>'} is not registered.`, path, nodeLocation(item, lineOffset))
    else if (visibleText(link) !== source.title) bag.error('BIBLIOGRAPHY_TITLE', `Bibliography title does not exactly equal ${sourceId} title.`, path, nodeLocation(link, lineOffset))
    references.push({ label, sourceId, title: visibleText(link), definition: definitions.get(label) })
  }
  const definitionNodes = nodes.slice(1)
  if (definitionNodes.some((node) => node.type !== 'definition')) bag.error('BIBLIOGRAPHY_BLOCK', 'Only numeric reference definitions may follow the visible bibliography list.', path, nodeLocation(nodes[1], lineOffset))
  if (definitionNodes.length !== references.length) bag.error('REFERENCE_DEFINITION_COUNT', 'Visible bibliography entries and following definitions must have equal counts.', path)
  for (const [index, definition] of definitionNodes.filter((node) => node.type === 'definition').entries()) {
    const raw = rawNode(body, definition)
    const rawMatch = /^\[([1-9][0-9]*)\]: (https?:\/\/\S+)$/.exec(raw)
    if (!rawMatch || definition.title != null) {
      bag.error('REFERENCE_DEFINITION_SHAPE', 'Reference definitions require an unbracketed HTTP(S) destination and no title.', path, nodeLocation(definition, lineOffset))
    } else {
      if (rawMatch[1] !== String(index + 1)) bag.error('REFERENCE_DEFINITION_ORDER', `Reference definition must use contiguous ordered label ${index + 1}.`, path, nodeLocation(definition, lineOffset))
      if (rawMatch[2] !== definition.url) bag.error('REFERENCE_DEFINITION_ENCODING', 'Reference definition destination source must exactly equal its parsed URL without escape rewriting.', path, nodeLocation(definition, lineOffset))
    }
  }
  return references
}

function validatePathMapping(document, manifestsById, path, bag) {
  const parts = path.split('/')
  const domain = parts[1]
  const filename = parts[2]
  const frontmatter = document.frontmatter
  if (frontmatter.domain !== domain) bag.error('CORPUS_DOMAIN_PATH', `Frontmatter domain ${frontmatter.domain} does not match directory ${domain}.`, path)
  let expectedId
  let expectedType
  if (filename === 'principles.md') [expectedId, expectedType] = [`${domain}.principles`, 'principles']
  else if (filename === 'personal-growth.md') [expectedId, expectedType] = [`${domain}.personal-growth`, 'personal-growth']
  else [expectedId, expectedType] = [`${domain}.${basename(filename, '.md')}`, 'subdomain']
  if (frontmatter.id !== expectedId || frontmatter.type !== expectedType) bag.error('CORPUS_FRONTMATTER_PATH', `Expected id ${expectedId} and type ${expectedType} for this path.`, path)
  const manifest = manifestsById.get(domain)?.value
  if (!manifest) bag.error('CORPUS_MANIFEST', `No domain manifest exists for ${domain}.`, path)
  else if (manifest.taxonomy_status !== 'accepted') bag.error('CORPUS_DOMAIN_STATUS', `Corpus content requires accepted domain ${domain}.`, path)
  if (expectedType === 'subdomain') {
    const subdomain = basename(filename, '.md')
    if (frontmatter.subdomain !== subdomain) bag.error('CORPUS_SUBDOMAIN_PATH', `Frontmatter subdomain must equal ${subdomain}.`, path)
    const registered = manifest?.subdomains?.find((item) => item.id === subdomain)
    if (!registered || registered.status !== 'accepted') bag.error('CORPUS_SUBDOMAIN_STATUS', `Corpus subdomain ${subdomain} must be registered and accepted.`, path)
  }
}

function semanticClaim(claim, sourceByLabel) {
  if (!claim) return null
  return { role: claim.role, text: claim.text, source_ids: [...new Set(claim.citationLabels.map((label) => sourceByLabel.get(label)).filter(Boolean))] }
}

export function contentSemanticHash(document) {
  const sourceByLabel = new Map(document.references.map((reference) => [reference.label, reference.sourceId]))
  const model = {
    frontmatter: Object.fromEntries(Object.entries(document.frontmatter).filter(([key]) => !['status', 'last_reviewed', 'reviewed_content_sha256'].includes(key))),
    title: document.title,
    introduction: document.introduction,
    entries: document.entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      statement: semanticClaim(entry.statement, sourceByLabel),
      why: entry.why.map((claim) => semanticClaim(claim, sourceByLabel)),
      practices: entry.practices.map((claim) => semanticClaim(claim, sourceByLabel)),
      applicability: entry.applicability.map((claim) => semanticClaim(claim, sourceByLabel)),
      goals: entry.goals.map((claim) => semanticClaim(claim, sourceByLabel)),
      tags: entry.tags
    }))
  }
  return createHash('sha256').update(canonicalize(model), 'utf8').digest('hex')
}

export function parseCorpusFile(root, path, schema, manifestsById, sourceById, bag, contentPolicy = null) {
  const text = readCanonicalText(root, path, bag, { maxBytes: LIMITS.markdownBytes })
  if (text === null) return null
  const split = splitFrontmatter(text, path, bag)
  if (!split) return null
  const frontmatter = parseYamlText(split.yaml, path, bag)
  if (!frontmatter) return null
  if (!schema.validate('corpus_frontmatter', frontmatter, path)) return null
  const tree = processor.parse(split.body)
  validateForbiddenAst(tree, path, bag, split.bodyLineOffset)
  const definitions = new Map()
  for (const node of tree.children) {
    if (node.type === 'definition') {
      const label = String(node.label).toLowerCase()
      if (definitions.has(label)) bag.error('REFERENCE_DEFINITION_DUPLICATE', `Duplicate reference definition ${node.label}.`, path, nodeLocation(node, split.bodyLineOffset))
      definitions.set(label, node)
    }
  }
  const nodes = tree.children
  const h1Nodes = nodes.filter((node) => node.type === 'heading' && node.depth === 1)
  if (h1Nodes.length !== 1) bag.error('DOCUMENT_H1_COUNT', 'Document must contain exactly one level-one heading.', path)
  const h1Source = nodes[0]?.type === 'heading' ? rawNode(split.body, nodes[0]) : ''
  if (nodes[0]?.type !== 'heading' || nodes[0].depth !== 1 || !/^# [^ \t#]/.test(h1Source) || /\s#+$/.test(h1Source) || nodes[0].children.some((child) => child.type !== 'text')) bag.error('DOCUMENT_H1', 'Document must begin with an exact level-one heading marker and one plain decoded title.', path, nodeLocation(nodes[0], split.bodyLineOffset))
  const title = visibleText(nodes[0])
  if (title !== frontmatter.title) bag.error('DOCUMENT_TITLE', 'Decoded level-one title must exactly equal frontmatter title.', path, nodeLocation(nodes[0], split.bodyLineOffset))
  if (nodes[1]?.type !== 'paragraph') bag.error('DOCUMENT_INTRODUCTION', 'Exactly one introduction paragraph must immediately follow the title.', path, nodeLocation(nodes[1] ?? nodes[0], split.bodyLineOffset))
  const h2Indexes = nodes.map((node, index) => node.type === 'heading' && node.depth === 2 ? index : -1).filter((index) => index >= 0)
  if (h2Indexes.length !== 2 || rawNode(split.body, nodes[h2Indexes[0]]) !== '## Principles' || rawNode(split.body, nodes[h2Indexes[1]]) !== '## References') bag.error('DOCUMENT_SECTIONS', 'Document requires exact ## Principles and final ## References headings.', path)
  const principlesIndex = h2Indexes[0] ?? -1
  const referencesIndex = h2Indexes[1] ?? nodes.length
  if (principlesIndex !== 2) bag.error('DOCUMENT_INTRODUCTION_SHAPE', 'No blocks other than the one introduction paragraph may occur before ## Principles.', path)
  if (referencesIndex !== h2Indexes.at(-1)) bag.error('REFERENCES_FINAL', 'References must be the final level-two section.', path)
  const entryNodes = nodes.slice(principlesIndex + 1, referencesIndex)
  const entries = []
  let cursor = 0
  while (cursor < entryNodes.length) {
    const heading = entryNodes[cursor]
    if (heading.type !== 'heading' || heading.depth !== 3) {
      bag.error('PRINCIPLES_ENTRY_START', 'Principles section permits only level-three entries.', path, nodeLocation(heading, split.bodyLineOffset))
      cursor += 1
      continue
    }
    let end = cursor + 1
    while (end < entryNodes.length && !(entryNodes[end].type === 'heading' && entryNodes[end].depth === 3)) end += 1
    entries.push(parseEntry(entryNodes.slice(cursor, end), split.body, definitions, path, bag, split.bodyLineOffset))
    cursor = end
  }
  if (entries.length === 0) bag.error('PRINCIPLES_EMPTY', 'Principles section must contain at least one entry.', path)
  const references = parseReferences(nodes.slice(referencesIndex + 1), split.body, definitions, sourceById, path, bag, split.bodyLineOffset)
  const used = entries.flatMap((entry) => entry.claims.flatMap((claim) => claim.citationLabels))
  const uniqueUsed = [...new Set(used)]
  const visible = references.map((reference) => reference.label)
  const defined = [...definitions.keys()].filter((label) => /^[1-9][0-9]*$/.test(label))
  for (const label of new Set([...uniqueUsed, ...visible, ...defined])) {
    if (!uniqueUsed.includes(label) || !visible.includes(label) || !defined.includes(label)) bag.error('BIBLIOGRAPHY_BIJECTION', `Citation label ${label} is not present exactly once in claims, bibliography, and definitions.`, path)
  }
  if ([...definitions.keys()].some((label) => !/^[1-9][0-9]*$/.test(label))) bag.error('REFERENCE_DEFINITION_NONNUMERIC', 'Nonnumeric reference definitions are forbidden in corpus files.', path)
  if (new Set(references.map((reference) => reference.sourceId)).size !== references.length) bag.error('BIBLIOGRAPHY_SOURCE_DUPLICATE', 'Each source ID may appear at most once per corpus file.', path)
  for (const reference of references) {
    const source = sourceById.get(reference.sourceId)?.value
    if (source && reference.definition && ![source.canonical_url, ...source.url_aliases].includes(reference.definition.url)) bag.error('BIBLIOGRAPHY_URL', `Definition URL for ${reference.sourceId} is not its canonical URL or alias.`, path, nodeLocation(reference.definition, split.bodyLineOffset))
  }
  const firstUse = uniqueUsed
  const expectedFirstUse = uniqueUsed.map(Number).sort((a, b) => a - b).map(String)
  if (firstUse.some((label, index) => label !== expectedFirstUse[index])) bag.warning('CITATION_FIRST_USE', 'Citation labels do not follow numeric first-use order.', path)
  const document = {
    path,
    frontmatter,
    title,
    introduction: visibleText(nodes[1]),
    entries,
    references,
    inputSha256: createHash('sha256').update(text, 'utf8').digest('hex')
  }
  document.semanticSha256 = contentSemanticHash(document)
  if (!schema.historical && frontmatter.status === 'active' && frontmatter.reviewed_content_sha256 !== document.semanticSha256) {
    bag.error('CONTENT_REVIEW_HASH', 'Active content reviewed_content_sha256 does not match the current semantic content model.', path)
  }
  validatePathMapping(document, manifestsById, path, bag)
  validateWordEconomy(document, contentPolicy, bag)
  return document
}

export function validateCorpusTransition(baselineDocuments, proposedDocuments, bag) {
  const gates = new Set()
  const before = new Map(baselineDocuments.map((document) => [document.path, document]))
  const after = new Map(proposedDocuments.map((document) => [document.path, document]))
  for (const [path, oldDocument] of before) {
    const next = after.get(path)
    if (!next) {
      if (oldDocument.frontmatter.status === 'active') gates.add('principle-removal')
      continue
    }
    if (next.frontmatter.status === 'active' && (oldDocument.frontmatter.status !== 'active' || oldDocument.semanticSha256 !== next.semanticSha256)) {
      gates.add(oldDocument.frontmatter.status === 'active' ? 'principle-semantic-change' : 'principle-activation')
    }
  }
  for (const [path, document] of after) {
    if (!before.has(path) && document.frontmatter.status === 'active') gates.add('principle-activation')
  }
  return gates
}

export function discoverCorpusPaths(root, bag = { error() {} }) {
  const discovered = walkCanonicalRepository(root, 'domains', bag)
    .map((path) => toRepoPath(root, path))
    .sort()
  for (const path of discovered) {
    if (/^domains\/.*\.md$/.test(path) && !/README\.md$/.test(path) && !/^domains\/[^/]+\/[^/]+\.md$/.test(path)) bag.error('CORPUS_PATH', 'Corpus Markdown must match domains/<domain>/<file>.md.', path)
  }
  return discovered.filter((path) => /^domains\/[^/]+\/[^/]+\.md$/.test(path) && !/README\.md$/.test(path))
}

export function parseCorpus(root, schema, manifests, sourceById, ledger, bag, contentPolicy = null) {
  const manifestsById = new Map(manifests.map((manifest) => [manifest.value.id, manifest]))
  const documents = discoverCorpusPaths(root, bag).map((path) => parseCorpusFile(root, path, schema, manifestsById, sourceById, bag, contentPolicy)).filter(Boolean)
  const entryById = new Map()
  const allocated = new Set(ledger?.principles?.allocated ?? [])
  const retired = new Set(ledger?.principles?.retired ?? [])
  for (const document of documents) {
    for (const entry of document.entries) {
      if (entryById.has(entry.id)) bag.error('PRINCIPLE_ID_DUPLICATE', `Principle ${entry.id} also appears in ${entryById.get(entry.id).document.path}.`, document.path, nodeLocation(entry.heading))
      else entryById.set(entry.id, { document, entry })
      if (!allocated.has(entry.id) || retired.has(entry.id)) bag.error('PRINCIPLE_LEDGER', `Principle ${entry.id} must be allocated and non-retired.`, document.path)
    }
  }
  return { documents, entryById }
}

export { processor, visibleText }
