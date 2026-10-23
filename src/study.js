import { createHash, randomUUID } from 'node:crypto'
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import canonicalize from 'canonicalize'
import { buildContext } from './context.js'
import { DiagnosticBag } from './diagnostics.js'
import { safeResolve } from './repository.js'
import { loadState } from './validator.js'

const MAX_BYTES = 16 * 1024 * 1024
const QUALIFICATION = 'Personal practice notes and self-ratings; not measured mastery or empirical efficacy.'
const digest = (value) => createHash('sha256').update(value, 'utf8').digest('hex')
const copy = (value) => structuredClone(value)
const ownKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every((key) => keys.includes(key))
function required(value, label, maximum = 20000) {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) throw new Error(`${label} must be nonempty bounded text`)
  return value.trim()
}
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value) throw new Error('Revisit date must be a valid YYYY-MM-DD date')
  return value
}
function inside(root, target) {
  const rel = relative(root, target)
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel))
}

// Read only the explicitly configured native owner. Existing parsing/schema/hash
// checks determine lifecycle eligibility; practice never changes acceptance.
export function loadStudyCatalog({ root, revision }) {
  required(revision, 'Explicit source revision', 300)
  const rootReal = realpathSync(required(root, 'Explicit source root', 4096))
  const bag = new DiagnosticBag()
  const state = loadState(rootReal, bag, { complete: false })
  if (bag.errorCount) throw new Error(`Principles source unavailable: ${bag.items.filter((item) => item.severity === 'error').slice(0, 4).map((item) => `${item.path} ${item.code}`).join('; ')}`)
  const manifests = new Map(state.manifests.map((manifest) => [manifest.value.id, manifest]))
  const records = new Map()
  const ledgerHash = digest(readFileSync(safeResolve(rootReal, 'config/identity-ledger.yaml'), 'utf8'))
  for (const [id, { document, entry }] of state.corpus.entryById) {
    const manifest = manifests.get(document.frontmatter.domain)
    const accepted = manifest?.value.taxonomy_status === 'accepted' && (document.frontmatter.type !== 'subdomain' || manifest.value.subdomains.find((item) => item.id === document.frontmatter.subdomain)?.status === 'accepted')
    const eligible = accepted && document.frontmatter.status === 'active' && document.frontmatter.reviewed_content_sha256 === document.semanticSha256 && !state.ledger.principles.retired.includes(id)
    if (!eligible) {
      records.set(id, { id, title: entry.title, eligible: false, status: document.frontmatter.status })
      continue
    }
    const context = buildContext({ documents: state.corpus.documents, entryById: state.corpus.entryById, sourceById: state.sourceById, evidenceByEntryId: state.evidenceByEntryId, evaluatorConfigs: state.evaluatorConfigs, profile: 'verification', principleIds: [id], revision })
    const raw = readFileSync(safeResolve(rootReal, document.path), 'utf8')
    const closing = raw.indexOf('\n---\n', 4)
    const body = raw.slice(closing + 5)
    const entryIndex = document.entries.indexOf(entry)
    const end = document.entries[entryIndex + 1]?.heading.position.start.offset ?? body.indexOf('## References\n')
    const binding = {
      context,
      exact_entry_markdown: body.slice(entry.heading.position.start.offset, end).trimEnd(),
      bibliography_markdown: body.slice(body.indexOf('## References\n')).trimEnd(),
      taxonomy: { path: manifest.path, input_sha256: digest(readFileSync(safeResolve(rootReal, manifest.path), 'utf8')), status: manifest.value.taxonomy_status },
      identity_ledger_sha256: ledgerHash
    }
    records.set(id, { id, title: entry.title, eligible: true, file_id: document.frontmatter.id, file_path: document.path, status: 'active', last_reviewed: document.frontmatter.last_reviewed, input_sha256: digest(canonicalize(binding)), source_revision: revision, ...binding })
  }
  return { schema_version: 1, source_revision: revision, records }
}

function sourceState(card, catalog, error = null) {
  const saved = card.source_history[card.source_index]
  if (error) return { status: 'unavailable', reason: error.message, saved_revision: saved.source_revision, saved_digest: saved.input_sha256 }
  const current = catalog.records.get(card.principle_id)
  const status = !current ? 'missing' : !current.eligible ? 'inactive' : current.input_sha256 === saved.input_sha256 ? 'current' : 'changed'
  return { status, saved_revision: saved.source_revision, saved_digest: saved.input_sha256, ...(current?.eligible ? { current_revision: current.source_revision, current_digest: current.input_sha256 } : {}) }
}

function validStore(value) {
  const fail = () => { throw new Error('Malformed or unsupported private study store; no automatic migration') }
  if (!ownKeys(value, ['schema_version', 'sessions']) || value.schema_version !== 1 || !Array.isArray(value.sessions)) fail()
  const ids = new Set()
  for (const session of value.sessions) {
    if (!ownKeys(session, ['schema_version', 'id', 'name', 'created_at', 'updated_at', 'qualification', 'cards']) || session.schema_version !== 1 || !Array.isArray(session.cards) || !session.cards.length || ids.has(session.id)) fail()
    for (const key of ['id', 'name', 'created_at', 'updated_at', 'qualification']) if (typeof session[key] !== 'string' || !session[key]) fail()
    ids.add(session.id)
    const cards = new Set()
    for (const card of session.cards) {
      if (!ownKeys(card, ['principle_id', 'cue', 'cue_history', 'source_history', 'source_index', 'attempts', 'revisit_on', 'revisit_history']) || !/^PRN-\d{6}$/.test(card.principle_id) || cards.has(card.principle_id)) fail()
      cards.add(card.principle_id)
      if (typeof card.cue !== 'string' || !card.cue.trim() || !Array.isArray(card.cue_history) || !card.cue_history.length || !Array.isArray(card.source_history) || !card.source_history.length || !Array.isArray(card.attempts) || !Array.isArray(card.revisit_history) || !Number.isInteger(card.source_index) || !card.source_history[card.source_index]) fail()
      if (card.revisit_on !== null) date(card.revisit_on)
      for (const cue of card.cue_history) if (!ownKeys(cue, ['text', 'at']) || typeof cue.text !== 'string' || !cue.text.trim() || typeof cue.at !== 'string') fail()
      for (const visit of card.revisit_history) if (!ownKeys(visit, ['date', 'at']) || typeof visit.at !== 'string' || !date(visit.date)) fail()
      for (const source of card.source_history) {
        if (!source || source.id !== card.principle_id || source.eligible !== true || !/^[a-f0-9]{64}$/.test(source.input_sha256) || typeof source.source_revision !== 'string' || source.context?.schema_version !== 2 || source.context.entries?.[0]?.id !== card.principle_id) fail()
        const binding = { context: source.context, exact_entry_markdown: source.exact_entry_markdown, bibliography_markdown: source.bibliography_markdown, taxonomy: source.taxonomy, identity_ledger_sha256: source.identity_ledger_sha256 }
        if (digest(canonicalize(binding)) !== source.input_sha256) fail()
      }
      const attempts = new Set()
      let unfinished = 0
      for (const attempt of card.attempts) {
        if (!ownKeys(attempt, ['id', 'explanation', 'cue', 'source_index', 'created_at', 'revealed_at', 'rating', 'example', 'revisit_on', 'rated_at']) || typeof attempt.id !== 'string' || attempts.has(attempt.id) || typeof attempt.explanation !== 'string' || !attempt.explanation.trim() || typeof attempt.cue !== 'string' || !Number.isInteger(attempt.source_index) || !card.source_history[attempt.source_index] || typeof attempt.created_at !== 'string') fail()
        attempts.add(attempt.id)
        if (attempt.revealed_at !== null && typeof attempt.revealed_at !== 'string') fail()
        if (attempt.rating !== null && (!['again', 'partial', 'comfortable'].includes(attempt.rating) || !attempt.revealed_at || typeof attempt.example !== 'string' || !attempt.example.trim() || !date(attempt.revisit_on) || typeof attempt.rated_at !== 'string')) fail()
        if (!attempt.rating) { unfinished++; if (attempt.example !== null || attempt.revisit_on !== null || attempt.rated_at !== null) fail() }
      }
      if (unfinished > 1 || (unfinished && card.attempts.at(-1)?.rating !== null)) fail()
    }
  }
  return value
}

function storePaths(root, directory, create) {
  const target = resolve(required(directory, 'Explicit external private store', 4096))
  let ancestor = target
  while (!existsSync(ancestor)) ancestor = dirname(ancestor)
  const actualTarget = resolve(realpathSync(ancestor), relative(ancestor, target))
  if (inside(root, target) || inside(root, actualTarget)) throw new Error('Private study store must be outside the public corpus repository')
  if (existsSync(target) && (lstatSync(target).isSymbolicLink() || !lstatSync(target).isDirectory())) throw new Error('Private store must be a real directory, not a symlink')
  if (create) mkdirSync(target, { recursive: true, mode: 0o700 })
  const file = join(target, 'sessions.json')
  if (existsSync(file) && (!lstatSync(file).isFile() || lstatSync(file).isSymbolicLink())) throw new Error('Private store file must be a regular file, not a symlink')
  return { directory: target, file, lock: join(target, '.study.lock') }
}

function readStore(paths) {
  if (!existsSync(paths.file)) return { schema_version: 1, sessions: [] }
  if (lstatSync(paths.file).size > MAX_BYTES) throw new Error('Private store exceeds size limit')
  return validStore(JSON.parse(readFileSync(paths.file, 'utf8')))
}

export function createStudyService({ root, store = null, revision, clock = () => new Date().toISOString(), idFactory = randomUUID }) {
  const configuredRoot = resolve(required(root, 'Explicit source root', 4096))
  // Saved private sessions remain readable if the configured owner is offline.
  const sourceRoot = existsSync(configuredRoot) ? realpathSync(configuredRoot) : configuredRoot
  required(revision, 'Explicit source revision', 300)
  const catalog = () => loadStudyCatalog({ root: sourceRoot, revision })
  function current() { try { return { catalog: catalog(), error: null } } catch (error) { return { catalog: null, error } } }
  function paths(create = false) { return storePaths(sourceRoot, store, create) }
  function sessionIn(data, id) { const session = data.sessions.find((item) => item.id === id); if (!session) throw new Error(`Unknown study session ${id}`); return session }
  function cardIn(session, id) { const card = session.cards.find((item) => item.principle_id === id); if (!card) throw new Error(`Principle ${id} is not selected in this session`); return card }
  function attemptIn(card, id) { const attempt = card.attempts.find((item) => item.id === id); if (!attempt) throw new Error(`Unknown attempt ${id}`); return attempt }
  function view(session, full = false) {
    const now = current()
    return { schema_version: 1, id: session.id, name: session.name, created_at: session.created_at, updated_at: session.updated_at, qualification: session.qualification, cards: session.cards.map((card) => {
      const saved = card.source_history[card.source_index]
      return { principle_id: card.principle_id, title: saved.title, cue: card.cue, cue_history: copy(card.cue_history), revisit_on: card.revisit_on, revisit_history: copy(card.revisit_history), source_state: sourceState(card, now.catalog, now.error), saved_source: { id: saved.id, title: saved.title, source_revision: saved.source_revision, input_sha256: saved.input_sha256 }, ...(full ? { source_history: copy(card.source_history), source_index: card.source_index } : {}), attempts: card.attempts.map((attempt) => ({ ...copy(attempt), ...(full || attempt.revealed_at ? { source: copy(card.source_history[attempt.source_index]) } : {}) })) }
    }) }
  }
  function mutate(id, update) {
    const p = paths(true)
    let lock
    try { lock = openSync(p.lock, 'wx', 0o600) } catch (error) { if (error.code === 'EEXIST') throw new Error('Private study store is busy (.study.lock); retry after its writer finishes'); throw error }
    let temp
    try {
      const data = readStore(p)
      const now = required(clock(), 'Clock timestamp', 100)
      const session = id ? sessionIn(data, id) : null
      const result = update(data, session, now)
      const selected = result ?? session
      selected.updated_at = now
      validStore(data)
      const serialized = `${JSON.stringify(data, null, 2)}\n`
      if (Buffer.byteLength(serialized) > MAX_BYTES) throw new Error('Private store exceeds size limit')
      temp = join(p.directory, `.sessions-${randomUUID()}.tmp`)
      writeFileSync(temp, serialized, { flag: 'wx', mode: 0o600 })
      renameSync(temp, p.file)
      temp = null
      return view(selected)
    } finally { if (temp) rmSync(temp, { force: true }); closeSync(lock); rmSync(p.lock, { force: true }) }
  }
  const service = {
    list(query = '') {
      if (typeof query !== 'string' || query.length > 2000) throw new Error('Invalid search query')
      const source = catalog()
      const terms = query.toLowerCase().split(/\s+/u).filter(Boolean)
      return { schema_version: 1, source_revision: revision, principles: [...source.records.values()].filter((record) => record.eligible && terms.every((term) => `${record.id} ${record.title} ${record.context.entries[0].statement.text}`.toLowerCase().includes(term))).map(copy) }
    },
    start({ name, principleIds }) {
      required(name, 'Session name', 300)
      if (!Array.isArray(principleIds) || !principleIds.length || principleIds.length > 100 || new Set(principleIds).size !== principleIds.length) throw new Error('Choose one or more unique accepted active principle IDs (maximum 100)')
      const source = catalog()
      const selected = principleIds.map((id) => { const record = source.records.get(id); if (!record?.eligible) throw new Error(`Principle ${id} is missing or inactive; select accepted active principles`); return record })
      return mutate(null, (data, _, now) => {
        const session = { schema_version: 1, id: required(idFactory(), 'Session ID', 200), name: name.trim(), created_at: now, updated_at: now, qualification: QUALIFICATION, cards: selected.map((record) => {
          const cue = `Explain “${record.title}” in your own words. When would you apply it, and what limits matter?`
          return { principle_id: record.id, cue, cue_history: [{ text: cue, at: now }], source_history: [copy(record)], source_index: 0, attempts: [], revisit_on: null, revisit_history: [] }
        }) }
        data.sessions.push(session)
        return session
      })
    },
    sessions() { return { sessions: readStore(paths()).sessions.map((session) => view(session)) } },
    show(id) { return view(sessionIn(readStore(paths()), id)) },
    cue(id, principleId, text) { required(text, 'Recall cue', 4000); return mutate(id, (_, session, now) => { const card = cardIn(session, principleId); card.cue = text.trim(); card.cue_history.push({ text: card.cue, at: now }) }) },
    attempt(id, principleId, text) {
      required(text, 'Explanation')
      return mutate(id, (_, session, now) => {
        const card = cardIn(session, principleId)
        if (card.attempts.some((attempt) => !attempt.rating)) throw new Error('Complete the pending attempt before starting another')
        const source = current()
        if (sourceState(card, source.catalog, source.error).status !== 'current') throw new Error('Saved source is changed, inactive, missing, or unavailable; explicitly refresh an eligible source before a new attempt')
        card.attempts.push({ id: required(idFactory(), 'Attempt ID', 200), explanation: text.trim(), cue: card.cue, source_index: card.source_index, created_at: now, revealed_at: null, rating: null, example: null, revisit_on: null, rated_at: null })
      })
    },
    reveal(id, principleId, attemptId) { return mutate(id, (_, session, now) => { const attempt = attemptIn(cardIn(session, principleId), attemptId); if (!attempt.revealed_at) attempt.revealed_at = now }) },
    rate(id, principleId, attemptId, { rating, example, revisitOn }) {
      if (!['again', 'partial', 'comfortable'].includes(rating)) throw new Error('Self-rating must be again, partial, or comfortable')
      required(example, 'Own example'); date(revisitOn)
      return mutate(id, (_, session, now) => {
        const card = cardIn(session, principleId); const attempt = attemptIn(card, attemptId)
        if (!attempt.revealed_at) throw new Error('Reveal the exact source after your explanation before self-rating')
        if (attempt.rating) throw new Error('Completed attempts are immutable; start a new attempt')
        Object.assign(attempt, { rating, example: example.trim(), revisit_on: revisitOn, rated_at: now })
        card.revisit_on = revisitOn; card.revisit_history.push({ date: revisitOn, at: now })
      })
    },
    revisit(id, principleId, revisitOn) { date(revisitOn); return mutate(id, (_, session, now) => { const card = cardIn(session, principleId); card.revisit_on = revisitOn; card.revisit_history.push({ date: revisitOn, at: now }) }) },
    refresh(id, principleId) {
      const record = catalog().records.get(principleId)
      if (!record?.eligible) throw new Error('Cannot refresh a missing or inactive principle')
      return mutate(id, (_, session) => { const card = cardIn(session, principleId); if (card.attempts.some((attempt) => !attempt.rating)) throw new Error('Complete the pending attempt before refreshing'); if (card.source_history[card.source_index].input_sha256 !== record.input_sha256) { card.source_history.push(copy(record)); card.source_index = card.source_history.length - 1 } })
    },
    exportSession(id, format = 'json') {
      const exported = view(sessionIn(readStore(paths()), id), true)
      if (format === 'json') return exported
      if (format !== 'markdown') throw new Error('Export format must be json or markdown')
      return renderStudyNotes(exported)
    },
    knowledgeExport(instanceId, { includeSessions = false } = {}) {
      const records = service.list().principles.map((record) => knowledgeRecord('principle', record.id, record.title, record.context.entries[0].statement.text, record.last_reviewed, 'Accepted taxonomy; active reviewed principle. Source status and applicability remain in exact content.', record))
      if (includeSessions) for (const session of readStore(paths()).sessions) { const exported = view(session, true); records.push(knowledgeRecord('study-session', session.id, session.name, session.cards.map((card) => card.cue).join(' | '), session.updated_at, QUALIFICATION, exported)) }
      return { schema_version: '1.0', owner: 'principles-ai', instance_id: required(instanceId, 'Explicit owner instance ID', 200), source_revision: revision, exported_at: clock(), freshness: 'Frozen export; underlying source and private store are not observed until explicitly exported again.', records }
    }
  }
  return service
}

function knowledgeRecord(kind, id, title, summary, updatedAt, qualification, record) {
  const content = canonicalize(record)
  const sha = digest(content)
  return { ref: { owner: 'principles-ai', kind, id, revision: `sha256:${sha}`, digest: sha }, title, summary, updated_at: updatedAt, qualification, content }
}

export function renderStudyNotes(session) {
  const lines = [`# ${session.name}`, '', session.qualification, '', `Session: ${session.id}`, `Created: ${session.created_at}`, `Updated: ${session.updated_at}`]
  for (const card of session.cards) {
    lines.push('', `## ${card.principle_id} — ${card.title}`, '', `Cue: ${card.cue}`, `Source now: ${card.source_state.status}`, `Revisit: ${card.revisit_on ?? 'not chosen'}`, '', '### Cue history')
    for (const cue of card.cue_history) lines.push(`- ${cue.at}: ${cue.text}`)
    for (const [index, source] of card.source_history.entries()) lines.push('', `### Saved source ${index + 1}`, '', `Revision: ${source.source_revision}`, `Digest: ${source.input_sha256}`, `File: ${source.file_path}`, '', source.exact_entry_markdown, '', source.bibliography_markdown, '', 'Bound verification context:', '', JSON.stringify(source.context, null, 2))
    for (const attempt of card.attempts) lines.push('', `### Attempt ${attempt.id}`, '', `Started: ${attempt.created_at}`, `Cue: ${attempt.cue}`, `Source snapshot: ${attempt.source_index + 1}`, `Explanation: ${attempt.explanation}`, `Revealed: ${attempt.revealed_at ?? 'not yet'}`, `Self-rating: ${attempt.rating ?? 'not yet'}`, `Own example: ${attempt.example ?? 'not yet'}`, `Revisit: ${attempt.revisit_on ?? 'not chosen'}`)
    lines.push('', '### Revisit history', ...card.revisit_history.map((visit) => `- ${visit.at}: ${visit.date}`))
  }
  return `${lines.join('\n')}\n`
}
