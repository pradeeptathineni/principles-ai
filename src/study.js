import { createHash, randomUUID } from 'node:crypto'
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import canonicalize from 'canonicalize'
import { buildContext } from './context.js'
import { DiagnosticBag } from './diagnostics.js'
import { safeResolve } from './repository.js'
import { loadState } from './validator.js'

const MAX_BYTES = 16 * 1024 * 1024
const MAX_PATH_STEPS = 32
const MAX_PATH_REVISIONS = 32
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
  for (const id of state.ledger.principles.retired) {
    if (!records.has(id)) records.set(id, { id, eligible: false, status: 'retired' })
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
    if (!ownKeys(session, ['schema_version', 'id', 'name', 'created_at', 'updated_at', 'qualification', 'cards', 'learning_path']) || session.schema_version !== 1 || !Array.isArray(session.cards) || !session.cards.length || ids.has(session.id)) fail()
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
    if (session.learning_path) validatePath(session.learning_path, cards, session)
  }
  return value
}

function stepDigest(step) { return digest(canonicalize(step)) }
function validateSteps(goal, steps, selected) {
  required(goal, 'Learning goal', 4000)
  if (!Array.isArray(steps) || !steps.length || steps.length > MAX_PATH_STEPS) throw new Error(`A learning path needs 1–${MAX_PATH_STEPS} steps`)
  const ids = new Set()
  for (const step of steps) {
    if (!ownKeys(step, ['id', 'title', 'kind', 'principle_id', 'prompt', 'prerequisites'])) throw new Error('Each learning step needs id, title, kind, principle_id, prompt, and prerequisites')
    required(step.id, 'Step ID', 100); required(step.title, 'Step title', 300); required(step.prompt, 'Step prompt', 4000)
    if (ids.has(step.id)) throw new Error(`Duplicate learning step ID ${step.id}`)
    if (!['explain', 'apply'].includes(step.kind)) throw new Error(`Step ${step.id} kind must be explain or apply`)
    if (!selected.has(step.principle_id)) throw new Error(`Step ${step.id} must name a selected principle`)
    if (!Array.isArray(step.prerequisites) || new Set(step.prerequisites).size !== step.prerequisites.length) throw new Error(`Step ${step.id} prerequisites must be unique earlier step IDs`)
    if (step.prerequisites.some((id) => !ids.has(id))) throw new Error(`Step ${step.id} prerequisites must name earlier existing steps`)
    ids.add(step.id)
  }
}

function validatePath(path, selected, session) {
  if (!ownKeys(path, ['goal', 'revision', 'definitions', 'completions']) || !Number.isInteger(path.revision) || path.revision < 1 || !Array.isArray(path.definitions) || !path.definitions.length || path.definitions.length > MAX_PATH_REVISIONS || !Array.isArray(path.completions)) throw new Error('Malformed learning path history')
  for (const [index, definition] of path.definitions.entries()) {
    if (!ownKeys(definition, ['revision', 'goal', 'steps', 'at']) || definition.revision !== index + 1 || typeof definition.at !== 'string' || !Array.isArray(definition.steps)) throw new Error('Malformed learning path definition')
    validateSteps(definition.goal, definition.steps, selected)
  }
  if (path.definitions.at(-1).revision !== path.revision || path.goal !== path.definitions.at(-1).goal) throw new Error('Learning path current revision does not match its definition history')
  const evidenceIds = new Set()
  const previousEvidence = new Map()
  for (const record of path.completions) {
    if (!ownKeys(record, ['id', 'step_id', 'definition_revision', 'step_sha256', 'source_sha256', 'source_index', 'attempt_id', 'observation', 'at', 'prerequisite_bindings']) || typeof record.id !== 'string' || typeof record.step_id !== 'string' || !Number.isInteger(record.definition_revision) || !Number.isInteger(record.source_index) || typeof record.step_sha256 !== 'string' || typeof record.source_sha256 !== 'string' || (record.attempt_id !== null && typeof record.attempt_id !== 'string') || typeof record.observation !== 'string' || typeof record.at !== 'string') throw new Error('Malformed learning path evidence history')
    if (evidenceIds.has(record.id)) throw new Error('Duplicate learning path evidence ID')
    evidenceIds.add(record.id)
    const definition = path.definitions.find((item) => item.revision === record.definition_revision)
    const step = definition?.steps.find((item) => item.id === record.step_id)
    const card = session.cards.find((item) => item.principle_id === step?.principle_id)
    if (!step || !card || stepDigest(step) !== record.step_sha256 || card.source_history[record.source_index]?.input_sha256 !== record.source_sha256) throw new Error('Learning path evidence does not match its saved definition and source')
    if (step.kind === 'explain' && !record.attempt_id || step.kind === 'apply' && !record.observation.trim()) throw new Error('Learning path evidence lacks its required attempt or observation')
    if (record.attempt_id && !card.attempts.some((attempt) => attempt.id === record.attempt_id && attempt.rating && attempt.revealed_at && attempt.source_index === record.source_index)) throw new Error('Learning path evidence references no matching finished attempt')
    if (record.prerequisite_bindings !== undefined) {
      if (!Array.isArray(record.prerequisite_bindings) || record.prerequisite_bindings.length !== step.prerequisites.length) throw new Error('Learning path evidence has invalid prerequisite bindings')
      for (const [index, binding] of record.prerequisite_bindings.entries()) {
        if (!ownKeys(binding, ['step_id', 'completion_id', 'step_sha256', 'source_sha256']) || binding.step_id !== step.prerequisites[index] || typeof binding.completion_id !== 'string' || !/^[a-f0-9]{64}$/.test(binding.step_sha256) || !/^[a-f0-9]{64}$/.test(binding.source_sha256)) throw new Error('Learning path evidence has malformed prerequisite bindings')
        const prior = previousEvidence.get(binding.completion_id)
        if (!prior || prior.step_id !== binding.step_id || prior.step_sha256 !== binding.step_sha256 || prior.source_sha256 !== binding.source_sha256) throw new Error('Learning path evidence prerequisite binding does not match earlier evidence')
      }
    }
    previousEvidence.set(record.id, record)
  }
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
    const result = { schema_version: 1, id: session.id, name: session.name, created_at: session.created_at, updated_at: session.updated_at, qualification: session.qualification, cards: session.cards.map((card) => {
      const saved = card.source_history[card.source_index]
      return { principle_id: card.principle_id, title: saved.title, cue: card.cue, cue_history: copy(card.cue_history), revisit_on: card.revisit_on, revisit_history: copy(card.revisit_history), source_state: sourceState(card, now.catalog, now.error), saved_source: { id: saved.id, title: saved.title, source_revision: saved.source_revision, input_sha256: saved.input_sha256 }, ...(full ? { source_history: copy(card.source_history), source_index: card.source_index } : {}), attempts: card.attempts.map((attempt) => ({ ...copy(attempt), ...(full || attempt.revealed_at ? { source: copy(card.source_history[attempt.source_index]) } : {}) })) }
    }) }
    if (session.learning_path) result.learning_path = pathViewFor(session, now.catalog, now.error)
    return result
  }
  function pathViewFor(session, catalog, error) {
    const path = session.learning_path
    const definition = path.definitions.at(-1)
    const cards = new Map(session.cards.map((card) => [card.principle_id, card]))
    const statuses = new Map()
    const validEvidence = new Map()
    const steps = definition.steps.map((step) => {
      const card = cards.get(step.principle_id)
      const source = card.source_history[card.source_index]
      const sourceStatus = sourceState(card, catalog, error)
      const matching = path.completions.filter((item) => item.step_id === step.id && item.step_sha256 === stepDigest(step) && item.source_sha256 === source.input_sha256 && item.source_index === card.source_index)
      const prerequisites = step.prerequisites.map((id) => validEvidence.get(id))
      const prerequisitesRecorded = prerequisites.every(Boolean)
      const prerequisiteBindings = prerequisitesRecorded ? prerequisites.map((item) => ({ step_id: item.step_id, completion_id: item.id, step_sha256: item.step_sha256, source_sha256: item.source_sha256 })) : []
      const validRecord = ['current', 'unavailable'].includes(sourceStatus.status) && matching.find((item) => {
        const attempt = item.attempt_id && card.attempts.find((saved) => saved.id === item.attempt_id)
        const boundPrerequisites = item.prerequisite_bindings ?? (step.prerequisites.length ? null : [])
        return prerequisitesRecorded && canonicalize(boundPrerequisites) === canonicalize(prerequisiteBindings) && (!item.attempt_id || attempt?.cue === step.prompt) && item.definition_revision <= path.revision
      })
      const staleRecord = path.completions.some((item) => item.step_id === step.id)
      const blockedBy = step.prerequisites.filter((id) => statuses.get(id) !== 'recorded')
      const status = validRecord ? 'recorded' : blockedBy.length ? 'blocked' : sourceStatus.status !== 'current' ? 'unavailable' : staleRecord ? 'review' : 'available'
      statuses.set(step.id, status)
      if (validRecord) validEvidence.set(step.id, validRecord)
      const related = sourceStatus.status === 'current' ? card.attempts.filter((attempt) => attempt.rating && attempt.revealed_at && attempt.cue === step.prompt && attempt.source_index === card.source_index) : []
      return { ...copy(step), status, ...(blockedBy.length ? { blocked_by: blockedBy } : {}), step_sha256: stepDigest(step), source_state: sourceStatus, evidence: validRecord ? { id: validRecord.id, at: validRecord.at, observation: validRecord.observation, attempt_id: validRecord.attempt_id, step_sha256: validRecord.step_sha256, source_sha256: validRecord.source_sha256 } : null, prior_evidence: staleRecord ? path.completions.filter((item) => item.step_id === step.id).map(copy) : [], available_attempt_ids: related.map((attempt) => attempt.id) }
    })
    const today = clock().slice(0, 10)
    const selectedPrinciples = new Set(definition.steps.map((step) => step.principle_id))
    const scheduled = session.cards.filter((card) => selectedPrinciples.has(card.principle_id) && card.revisit_on).map((card) => ({ principle_id: card.principle_id, date: card.revisit_on })).sort((a, b) => a.date.localeCompare(b.date) || a.principle_id.localeCompare(b.principle_id))
    const counts = Object.fromEntries(['recorded', 'available', 'review', 'blocked', 'unavailable'].map((status) => [status, steps.filter((step) => step.status === status).length]))
    const remainingSteps = steps.filter((step) => step.status !== 'recorded').map(({ id, title, principle_id, status, blocked_by }) => ({ id, title, principle_id, status, ...(blocked_by ? { blocked_by: copy(blocked_by) } : {}) }))
    return { goal: path.goal, revision: path.revision, definitions: copy(path.definitions), steps, completions: copy(path.completions), due_summary: { today, next_due_date: scheduled[0]?.date ?? null, scheduled_count: scheduled.length, due_principle_ids: [...new Set(scheduled.filter((item) => item.date <= today).map((item) => item.principle_id))], policy: 'Dates are learner-chosen review reminders; next due is the earliest selected date. No automatic interval or learning score is inferred.' }, remaining_work: { total_steps: steps.length, recorded_steps: counts.recorded, remaining_steps: remainingSteps.length, counts_by_status: counts, steps: remainingSteps }, qualification: 'Private learning path and learner-reported evidence; not mastery, verified execution, or corpus evidence.' }
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
    createPath({ name, goal, principleIds, steps }) {
      required(name, 'Path name', 300)
      if (!Array.isArray(principleIds) || !principleIds.length || principleIds.length > 100 || new Set(principleIds).size !== principleIds.length) throw new Error('Choose one or more unique accepted active principle IDs (maximum 100)')
      const source = catalog()
      const selected = principleIds.map((id) => { const record = source.records.get(id); if (!record?.eligible) throw new Error(`Principle ${id} is missing or inactive; select accepted active principles`); return record })
      validateSteps(goal, steps, new Set(principleIds))
      return mutate(null, (data, _, now) => {
        const cards = selected.map((record) => {
          const cue = `Explain “${record.title}” in your own words. When would you apply it, and what limits matter?`
          return { principle_id: record.id, cue, cue_history: [{ text: cue, at: now }], source_history: [copy(record)], source_index: 0, attempts: [], revisit_on: null, revisit_history: [] }
        })
        const session = { schema_version: 1, id: required(idFactory(), 'Session ID', 200), name: name.trim(), created_at: now, updated_at: now, qualification: QUALIFICATION, cards, learning_path: { goal: goal.trim(), revision: 1, definitions: [{ revision: 1, goal: goal.trim(), steps: copy(steps), at: now }], completions: [] } }
        data.sessions.push(session)
        return session
      })
    },
    pathView(id) { const session = sessionIn(readStore(paths()), id); if (!session.learning_path) throw new Error('Study session has no learning path'); const source = current(); return pathViewFor(session, source.catalog, source.error) },
    pathAttempt(id, stepId, { expected_revision, text }) {
      required(text, 'Explanation')
      return mutate(id, (_, session, now) => {
        const path = session.learning_path
        if (!path) throw new Error('Study session has no learning path')
        if (expected_revision !== path.revision) throw new Error(`Stale learning path revision; current revision is ${path.revision}`)
        const step = path.definitions.at(-1).steps.find((item) => item.id === stepId)
        if (!step) throw new Error(`Unknown learning step ${stepId}`)
        const source = current()
        const state = pathViewFor(session, source.catalog, source.error).steps.find((item) => item.id === stepId)
        if (!['available', 'review'].includes(state.status)) throw new Error(`Learning step ${stepId} is ${state.status}${state.blocked_by ? `; blocked by ${state.blocked_by.join(', ')}` : ''}`)
        const card = cardIn(session, step.principle_id)
        if (card.attempts.some((attempt) => !attempt.rating)) throw new Error('Complete the pending attempt before starting another')
        if (state.source_state.status !== 'current') throw new Error('Saved source is changed, inactive, missing, or unavailable; explicitly refresh an eligible source before a new attempt')
        card.attempts.push({ id: required(idFactory(), 'Attempt ID', 200), explanation: text.trim(), cue: step.prompt, source_index: card.source_index, created_at: now, revealed_at: null, rating: null, example: null, revisit_on: null, rated_at: null })
      })
    },
    revisePath(id, { expected_revision, goal, steps }) {
      return mutate(id, (_, session, now) => {
        const path = session.learning_path
        if (!path) throw new Error('Study session has no learning path')
        if (expected_revision !== path.revision) throw new Error(`Stale learning path revision; current revision is ${path.revision}`)
        if (path.revision >= MAX_PATH_REVISIONS) throw new Error(`Learning path history limit is ${MAX_PATH_REVISIONS} definitions`)
        validateSteps(goal, steps, new Set(session.cards.map((card) => card.principle_id)))
        path.revision++
        path.goal = goal.trim()
        path.definitions.push({ revision: path.revision, goal: path.goal, steps: copy(steps), at: now })
      })
    },
    recordPathStep(id, stepId, { expected_revision, attempt_id = null, observation = null }) {
      return mutate(id, (_, session, now) => {
        const path = session.learning_path
        if (!path) throw new Error('Study session has no learning path')
        if (expected_revision !== path.revision) throw new Error(`Stale learning path revision; current revision is ${path.revision}`)
        const definition = path.definitions.at(-1)
        const step = definition.steps.find((item) => item.id === stepId)
        if (!step) throw new Error(`Unknown learning step ${stepId}`)
        const source = current()
        const currentView = pathViewFor(session, source.catalog, source.error)
        const state = currentView.steps.find((item) => item.id === stepId)
        if (!['available', 'review'].includes(state.status)) throw new Error(`Learning step ${stepId} is ${state.status}${state.blocked_by ? `; blocked by ${state.blocked_by.join(', ')}` : ''}`)
        const card = cardIn(session, step.principle_id)
        if (step.kind === 'explain') {
          if (!attempt_id) throw new Error('Explanation completion must reference a finished, revealed, and rated attempt for this principle')
          const attempt = attemptIn(card, attempt_id)
          if (!attempt.rating || !attempt.revealed_at || attempt.cue !== step.prompt || attempt.source_index !== card.source_index || state.source_state.status !== 'current') throw new Error('Explanation evidence must be a finished attempt for this exact step prompt and current saved source snapshot')
        } else if (observation === null) throw new Error('Application completion must include the learner-reported observation')
        if (attempt_id) {
          const attempt = attemptIn(card, attempt_id)
          if (!attempt.rating || !attempt.revealed_at || attempt.cue !== step.prompt || attempt.source_index !== card.source_index || state.source_state.status !== 'current') throw new Error('Linked attempt must be finished for this exact step prompt and bound to the current saved source snapshot')
        }
        const prerequisite_bindings = step.prerequisites.map((prerequisiteId) => {
          const priorStep = currentView.steps.find((item) => item.id === prerequisiteId)
          const prior = currentView.completions.find((item) => item.id === priorStep?.evidence?.id)
          if (!prior) throw new Error(`Prerequisite ${prerequisiteId} has no current matching evidence`)
          return { step_id: prior.step_id, completion_id: prior.id, step_sha256: prior.step_sha256, source_sha256: prior.source_sha256 }
        })
        const note = step.kind === 'apply' ? required(observation, 'Learner-reported observation', 4000) : ''
        path.completions.push({ id: required(idFactory(), 'Evidence ID', 200), step_id: step.id, definition_revision: path.revision, step_sha256: stepDigest(step), source_sha256: card.source_history[card.source_index].input_sha256, source_index: card.source_index, prerequisite_bindings, attempt_id, observation: note, at: now })
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
      const envelope = { schema_version: '1.0', owner: 'principles-ai', instance_id: required(instanceId, 'Explicit owner instance ID', 200), source_revision: revision, exported_at: clock(), freshness: 'Frozen export; underlying source and private store are not observed until explicitly exported again.', records }
      if (Buffer.byteLength(`${JSON.stringify(envelope, null, 2)}\n`) > 10000000) throw new Error('Knowledge export exceeds the consumer 10 MB limit; omit private sessions or use standalone session exports')
      return envelope
    }
  }
  return service
}

function knowledgeRecord(kind, id, title, summary, updatedAt, qualification, record) {
  const content = canonicalize(record)
  if (Buffer.byteLength(content) > 2000000) throw new Error(`Knowledge record ${id} exceeds the consumer 2 MB exact-content limit; use the standalone session export`)
  const sha = digest(content)
  const display = (text, maximum) => text.slice(0, maximum).replace(/[\uD800-\uDBFF]$/u, '')
  return { ref: { owner: 'principles-ai', kind, id, revision: `sha256:${sha}`, digest: sha }, title: display(title, 500), summary: display(summary, 2000), updated_at: updatedAt, qualification: display(qualification, 1000), content }
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
