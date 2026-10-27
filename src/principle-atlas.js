import { createHash, randomUUID } from 'node:crypto'
import { closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, sep, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import canonicalize from 'canonicalize'
import { validateRepository } from './validator.js'

const SHA256 = /^[a-f0-9]{64}$/
const PRINCIPLE_ID = /^PRN-[0-9]{6}$/
const SOURCE_ID = /^SRC-[0-9]{6}$/
const MAX_QUERY = 240
const MAX_RESULTS = 100
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const MAX_RECORD_BYTES = 1_000_000
const MAX_DECISIONS = 1000

function digest(value) {
  return createHash('sha256').update(canonicalize(value), 'utf8').digest('hex')
}

function requiredText(value, label, maximum) {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum) throw new Error(`${label} must be non-empty and at most ${maximum} characters.`)
  return value.trim()
}

function sourceIdsFor(entry, document) {
  const byLabel = new Map(document.references.map((reference) => [reference.label, reference.sourceId]))
  return [...new Set(entry.claims.flatMap((claim) => claim.citationLabels.map((label) => byLabel.get(label)).filter(Boolean)))].sort()
}

function claimView(claim, document) {
  const byLabel = new Map(document.references.map((reference) => [reference.label, reference.sourceId]))
  return {
    role: claim.role,
    text: claim.text,
    sources: [...new Set(claim.citationLabels.map((label) => byLabel.get(label)).filter(Boolean))].map((id) => ({ sourceId: id }))
  }
}

function sourceView(record) {
  const source = record.value
  return {
    sourceId: source.id,
    path: record.path,
    fileSha256: record.inputSha256,
    status: source.status,
    title: source.title,
    canonicalUrl: source.canonical_url,
    publisher: source.publisher,
    evidenceKind: source.evidence_kind,
    publishedOrVersion: source.published_or_version,
    firstRetrieved: source.first_retrieved ?? null,
    lastReviewed: source.last_reviewed ?? null,
    supersededBy: source.superseded_by ?? null,
    qualification: 'Registry metadata only; external content was not fetched or verified.'
  }
}

export function createPrincipleAtlasService({ root, store = null, sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..'), ownerRevision, clock = () => new Date().toISOString() }) {
  const repository = realpathSync(root)
  const ownerSource = realpathSync(sourceRoot)
  if (!/^[a-f0-9]{40,64}$/.test(ownerRevision ?? '')) throw new Error('Configure the exact immutable Principles owner revision.')
  let decisionsDirectory = null
  let requestsDirectory = null
  if (store) {
    const directory = resolve(requiredText(store, 'Explicit private decision store', 4096))
    const overlaps = (left, right) => left === right || left.startsWith(`${right}${sep}`) || right.startsWith(`${left}${sep}`)
    if (!isAbsolute(directory) || overlaps(directory, repository) || overlaps(directory, ownerSource)) throw new Error('Decision store must be a real private directory separate from the Principles corpus and owner source.')
    mkdirSync(directory, { recursive: true, mode: 0o700 })
    if (lstatSync(directory).isSymbolicLink() || !lstatSync(directory).isDirectory() || realpathSync(directory) !== directory) throw new Error('Decision store must be a real exact directory.')
    decisionsDirectory = join(directory, 'decisions')
    requestsDirectory = join(directory, 'requests')
    for (const path of [decisionsDirectory, requestsDirectory]) {
      mkdirSync(path, { recursive: true, mode: 0o700 })
      if (lstatSync(path).isSymbolicLink() || !lstatSync(path).isDirectory() || realpathSync(path) !== path) throw new Error('Decision records and request journal must be exact private directories.')
    }
  }
  const requireStore = () => { if (!decisionsDirectory) throw new Error('Configure an explicit private decision store for decision operations.') }
  const decisionPath = (id) => join(decisionsDirectory, `${id}.json`)
  const requestPath = (id) => join(requestsDirectory, `${id}.json`)
  function syncDirectory(path) { const fd = openSync(path, 'r'); try { fsyncSync(fd) } finally { closeSync(fd) } }
  function readPrivateJson(path) {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size > MAX_RECORD_BYTES || realpathSync(path) !== path) throw new Error('Private decision record is unsafe or oversized.')
    return JSON.parse(readFileSync(path, 'utf8'))
  }
  function writePrivateJson(path, value, { exclusive = false } = {}) {
    const bytes = `${JSON.stringify(value, null, 2)}\n`
    if (Buffer.byteLength(bytes) > MAX_RECORD_BYTES) throw new Error('Private decision record exceeds its size limit.')
    if (exclusive) {
      const fd = openSync(path, 'wx', 0o600)
      try { writeFileSync(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) }
      syncDirectory(dirname(path))
      return
    }
    const temporary = join(dirname(path), `.${randomUUID()}.tmp`)
    try {
      const fd = openSync(temporary, 'wx', 0o600)
      try { writeFileSync(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) }
      renameSync(temporary, path)
      syncDirectory(dirname(path))
    } finally { if (existsSync(temporary)) unlinkSync(temporary) }
  }
  function readDecisionRecord(id) {
    if (!UUID.test(id ?? '')) throw new Error('Choose an exact decision UUID.')
    const record = readPrivateJson(decisionPath(id))
    if (record?.schema !== 'principles.contextual-decision/1' || record.id !== id || record.requestId !== id || !['decision.create', 'decision.successor'].includes(record.operation) || !SHA256.test(record.inputSha256 ?? '') || !Array.isArray(record.versions) || record.versions.length < 1) throw new Error('Contextual decision record is malformed.')
    for (const [index, version] of record.versions.entries()) {
      if (version.version !== index + 1 || digest(version.payload) !== version.sha256) throw new Error('Contextual decision history failed its digest check.')
    }
    return record
  }
  function readRequestRecord(id) {
    const path = requestPath(id)
    if (!existsSync(path)) return null
    const request = readPrivateJson(path)
    if (request?.schema !== 'principles.atlas-request/1' || request.requestId !== id || !['pending', 'confirmed', 'unknown', 'not_seen', 'rejected'].includes(request.status)) throw new Error('Principles atlas request record is malformed.')
    if (request.status !== 'not_seen' && (!['decision.create', 'decision.successor'].includes(request.operation) || !SHA256.test(request.inputSha256 ?? ''))) throw new Error('Principles atlas request identity is malformed.')
    return request
  }
  function validateDecisionInput(input, { successor = false } = {}) {
    const expected = ['title', 'reviewer', 'context', 'applicability', 'exceptions', 'valueAssumptions', 'tradeoffs', 'judgment', 'principleIds', 'expectedCorpusRevision', ...(successor ? ['predecessorDecisionId', 'acknowledgedChangedBasis'] : [])]
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some((key) => !expected.includes(key)) || expected.some((key) => !Object.hasOwn(input, key))) throw new Error('Decision input fields do not match the operation contract.')
    const list = (value, label, maximum, required = false) => {
      if (!Array.isArray(value) || value.length > maximum || (required && !value.length)) throw new Error(`${label} must contain ${required ? '1' : '0'} to ${maximum} entries.`)
      return value.map((item) => requiredText(item, label, 2000))
    }
    if (!Array.isArray(input.principleIds) || input.principleIds.length < 2 || input.principleIds.length > 8 || new Set(input.principleIds).size !== input.principleIds.length || input.principleIds.some((id) => typeof id !== 'string' || !PRINCIPLE_ID.test(id))) throw new Error('Choose 2 to 8 unique current principle IDs.')
    const value = {
      title: requiredText(input.title, 'Decision title', 180), reviewer: requiredText(input.reviewer, 'Human reviewer', 160),
      context: requiredText(input.context, 'Situation/context', 4000), applicability: requiredText(input.applicability, 'Contextual applicability judgment', 4000),
      exceptions: list(input.exceptions, 'Exception', 16, true), valueAssumptions: list(input.valueAssumptions, 'Value assumption', 16),
      tradeoffs: list(input.tradeoffs, 'Trade-off', 16), judgment: requiredText(input.judgment, 'Decision judgment', 4000), principleIds: [...input.principleIds],
      expectedCorpusRevision: requiredText(input.expectedCorpusRevision, 'Reviewed corpus revision', 64)
    }
    if (!SHA256.test(value.expectedCorpusRevision)) throw new Error('Reviewed corpus revision must be a SHA-256 digest.')
    if (successor) {
      if (!UUID.test(input.predecessorDecisionId ?? '') || typeof input.acknowledgedChangedBasis !== 'boolean') throw new Error('Successor requires an exact predecessor and an explicit changed-basis acknowledgment.')
      const predecessor = readDecisionRecord(input.predecessorDecisionId)
      const prior = predecessor.versions.at(-1).payload
      const currentness = compareBasis(prior.basis, captureBasis(prior.principleIds, { includeSourceIds: prior.basis.sources.map((item) => item.sourceId), allowMissing: true }))
      if (currentness.status !== 'current' && !input.acknowledgedChangedBasis) throw new Error('The predecessor basis changed; acknowledge the fresh basis and author a new judgment.')
      value.predecessor = { decisionId: predecessor.id, version: prior.version, sha256: predecessor.versions.at(-1).sha256 }
      value.acknowledgedChangedBasis = input.acknowledgedChangedBasis
    }
    return value
  }

  function current() {
    const validation = validateRepository(repository)
    if (validation.bag.errorCount) throw new Error(`Principles repository does not currently validate: ${validation.bag.sorted().slice(0, 6).map((item) => `${item.path} ${item.code}`).join('; ')}`)
    const state = validation.state
    const manifestById = new Map(state.manifests.map((item) => [item.value.id, item.value]))
    const sourceById = new Map(state.sources.map((record) => [record.value.id, record]))
    const ledgerPath = join(repository, 'config', 'identity-ledger.yaml')
    const ledgerSha256 = createHash('sha256').update(readFileSync(ledgerPath)).digest('hex')
    const sourceBasis = state.sources.map((record) => [record.value.id, record.inputSha256]).sort(([a], [b]) => a.localeCompare(b))
    const corpusBasis = state.corpus.documents.map((document) => [document.path, document.inputSha256]).sort(([a], [b]) => a.localeCompare(b))
    const manifestBasis = state.manifests.map((manifest) => [manifest.path, createHash('sha256').update(readFileSync(join(repository, manifest.path))).digest('hex')]).sort(([a], [b]) => a.localeCompare(b))
    const evidenceBasis = state.evidence.map((record) => [record.path, record.inputSha256]).sort(([a], [b]) => a.localeCompare(b))
    const evaluatorBasis = [...state.evaluatorConfigs.values()].map((record) => [record.path, record.inputSha256]).sort(([a], [b]) => a.localeCompare(b))
    const corpusRevision = digest({ ledgerSha256, sourceBasis, corpusBasis, manifestBasis, evidenceBasis, evaluatorBasis })

    function entryView(id) {
      const found = state.corpus.entryById.get(id)
      if (!found) throw new Error(`Unknown current principle ID ${id}.`)
      const { document, entry } = found
      const manifest = manifestById.get(document.frontmatter.domain)
      const sourceIds = sourceIdsFor(entry, document)
      const sourceInputs = sourceIds.map((sourceId) => {
        const record = sourceById.get(sourceId)
        if (!record) throw new Error(`Canonical principle ${id} refers to missing source ${sourceId}.`)
        return sourceView(record)
      })
      const semantic = {
        id: entry.id,
        title: entry.title,
        statement: entry.statement?.text ?? '',
        why: entry.why.map((claim) => claim.text),
        practices: entry.practices.map((claim) => claim.text),
        applicability: entry.applicability.map((claim) => claim.text),
        goals: entry.goals.map((claim) => claim.text),
        tags: entry.tags,
        sourceIds
      }
      const subdomainId = document.frontmatter.type === 'subdomain' ? document.frontmatter.subdomain : null
      const subdomain = subdomainId ? manifest.subdomains.find((item) => item.id === subdomainId) : null
      return {
        principleId: entry.id,
        title: entry.title,
        domain: { id: manifest.id, title: manifest.title, intent: manifest.human_intent },
        scope: subdomain ? { id: subdomain.id, title: subdomain.title, description: subdomain.description } : { id: document.frontmatter.type, title: document.title, description: null },
        file: { path: document.path, sha256: document.inputSha256, entryContentSha256: digest(semantic) },
        lifecycle: document.frontmatter.status,
        statement: claimView(entry.statement, document),
        why: entry.why.map((claim) => claimView(claim, document)),
        practices: entry.practices.map((claim) => claimView(claim, document)),
        applicability: entry.applicability.map((claim) => claimView(claim, document)),
        goals: entry.goals.map((claim) => claimView(claim, document)),
        tags: [...entry.tags],
        sourceIds,
        sources: sourceInputs
      }
    }

    return { state, manifestById, sourceById, corpusRevision, entryView }
  }

  function envelope(result) {
    return { schema: 'principles.domain-atlas/1', owner: 'principles-ai', ownerRevision, generatedAt: clock(), ...result }
  }

  function search({ query, domain = null, scope = null, limit = 30 } = {}) {
    const q = requiredText(query, 'Query', MAX_QUERY).toLocaleLowerCase('en-US')
    const maximum = Number(limit)
    if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > MAX_RESULTS) throw new Error(`Limit must be an integer from 1 to ${MAX_RESULTS}.`)
    const snapshot = current()
    const matches = []
    for (const { document, entry } of snapshot.state.corpus.entryById.values()) {
      const manifest = snapshot.manifestById.get(document.frontmatter.domain)
      const scopeId = document.frontmatter.type === 'subdomain' ? document.frontmatter.subdomain : document.frontmatter.type
      if (domain && manifest.id !== domain) continue
      if (scope && scopeId !== scope) continue
      const fields = [
        ['title', entry.title], ['statement', entry.statement?.text ?? ''],
        ...entry.why.map((claim) => ['why', claim.text]),
        ...entry.practices.map((claim) => ['practice', claim.text]),
        ...entry.applicability.map((claim) => ['applicability', claim.text]),
        ...entry.goals.map((claim) => ['goal', claim.text]),
        ['domain', manifest.title], ['domain-id', manifest.id], ['scope', document.title], ['scope-id', scopeId], ['tags', entry.tags.join(' ')],
        ...sourceIdsFor(entry, document).flatMap((id) => {
          const source = snapshot.sourceById.get(id)?.value
          return [['source-id', id], ...(source ? [['source-title', source.title], ['source-publisher', source.publisher], ['source-status', source.status]] : [])]
        })
      ]
      const matchedFields = [...new Set(fields.filter(([, value]) => value.toLocaleLowerCase('en-US').includes(q)).map(([field]) => field))]
      if (matchedFields.length) matches.push({ principleId: entry.id, title: entry.title, domain: { id: manifest.id, title: manifest.title }, scope: { id: scopeId, title: document.title }, lifecycle: document.frontmatter.status, path: document.path, sourceIds: sourceIdsFor(entry, document), matchedFields })
    }
    matches.sort((a, b) => a.principleId.localeCompare(b.principleId))
    return envelope({ corpusRevision: snapshot.corpusRevision, query: q, matchMethod: 'literal-substring', matches: matches.slice(0, maximum), truncated: matches.length > maximum, qualification: 'Literal lexical lookup only. Match fields are discovery aids and do not establish semantic applicability, conflict, truth, or entailment.' })
  }

  function show({ entryId } = {}) {
    const id = requiredText(entryId, 'Principle ID', 10)
    if (!PRINCIPLE_ID.test(id)) throw new Error('Choose a canonical PRN-...... identity.')
    const snapshot = current()
    return envelope({ corpusRevision: snapshot.corpusRevision, entry: snapshot.entryView(id), qualification: 'Canonical corpus content and source identities are shown as retained. Their presence does not prove truth or current support.' })
  }

  function source({ sourceId } = {}) {
    const id = requiredText(sourceId, 'Source ID', 10)
    if (!SOURCE_ID.test(id)) throw new Error('Choose a canonical SRC-...... identity.')
    const snapshot = current()
    const record = snapshot.sourceById.get(id)
    if (!record) throw new Error(`Unknown current source ID ${id}.`)
    return envelope({ corpusRevision: snapshot.corpusRevision, source: sourceView(record), qualification: 'Registry metadata and lifecycle only. No source was fetched and no claim-fit, entailment, independence, or currency judgment is made.' })
  }

  function compare({ entryIds } = {}) {
    if (!Array.isArray(entryIds) || entryIds.length < 2 || entryIds.length > 8 || new Set(entryIds).size !== entryIds.length || entryIds.some((id) => typeof id !== 'string' || !PRINCIPLE_ID.test(id))) throw new Error('Select 2 to 8 unique current PRN-...... identities.')
    const snapshot = current()
    const entries = entryIds.map((id) => snapshot.entryView(id))
    const sharedSources = [...new Set(entries.flatMap((entry) => entry.sourceIds))].filter((id) => entries.filter((entry) => entry.sourceIds.includes(id)).length > 1).sort()
    const sameScope = entries.every((entry) => entry.domain.id === entries[0].domain.id && entry.scope.id === entries[0].scope.id)
    const allocated = new Set(snapshot.state.ledger?.principles?.allocated ?? [])
    const selected = new Set(entryIds)
    const relationships = (snapshot.state.ledger?.principle_relationships ?? []).filter((item) => selected.has(item.from) && selected.has(item.to))
    const structuralSignals = [
      ...(sharedSources.length ? [{ kind: 'shared-source-identity', sourceIds: sharedSources, qualification: 'Shared citation identity flags potential source dependence; citations alone do not show whether evidence is independent or sufficient.' }] : []),
      ...(sameScope ? [{ kind: 'same-authored-scope', scopeId: entries[0].scope.id, qualification: 'Same scope is a comparison prompt, not evidence of duplication or conflict.' }] : []),
      ...relationships.map((relationship) => ({ kind: 'declared-identity-relationship', relationship }))
    ]
    return envelope({ corpusRevision: snapshot.corpusRevision, entries, structuralSignals, allocatedPrincipleIds: entryIds.filter((id) => allocated.has(id)), qualification: 'Structural comparison aids only. No automatic semantic conflict, contradiction, entailment, truth, or redundancy is inferred. Human reviewers determine applicability, exceptions, value assumptions, and consequential trade-offs.' })
  }

  function captureBasis(principleIds, { includeSourceIds = [], allowMissing = false } = {}) {
    const snapshot = current()
    const principles = []
    for (const id of principleIds) {
      try {
        const entry = snapshot.entryView(id)
        principles.push({ principleId: id, path: entry.file.path, fileSha256: entry.file.sha256, entryContentSha256: entry.file.entryContentSha256, sourceIds: entry.sourceIds })
      } catch (error) {
        if (!allowMissing || !/Unknown current principle ID/.test(error.message)) throw error
        principles.push({ principleId: id, missing: true, sourceIds: [] })
      }
    }
    const sourceIds = [...new Set([...includeSourceIds, ...principles.flatMap((entry) => entry.sourceIds)])].sort()
    const sources = sourceIds.map((id) => {
      const record = snapshot.sourceById.get(id)
      if (record) return sourceView(record)
      if (!allowMissing) throw new Error(`Unknown current source ID ${id}.`)
      return { sourceId: id, missing: true }
    })
    return { ownerRevision, corpusRevision: snapshot.corpusRevision, principles, sources }
  }

  function compareBasis(previous, latest) {
    const missingPrinciples = previous.principles.filter((before) => latest.principles.some((after) => after.principleId === before.principleId && after.missing)).map((item) => item.principleId)
    const changedPrinciples = previous.principles.filter((before) => latest.principles.some((after) => after.principleId === before.principleId && canonicalize(after) !== canonicalize(before))).map((item) => item.principleId)
    const missingSources = previous.sources.filter((before) => latest.sources.some((after) => after.sourceId === before.sourceId && after.missing)).map((item) => item.sourceId)
    const changedSources = previous.sources.filter((before) => latest.sources.some((after) => after.sourceId === before.sourceId && canonicalize(after) !== canonicalize(before))).map((item) => item.sourceId)
    const changedCanonicalState = previous.corpusRevision !== latest.corpusRevision
    const status = missingPrinciples.length || missingSources.length ? 'missing' : changedPrinciples.length || changedSources.length || changedCanonicalState ? 'changed' : 'current'
    return { status, missingPrinciples, changedPrinciples, missingSources, changedSources, changedCanonicalState, currentBasis: latest, qualification: 'Currentness compares canonical corpus, manifests, claim-review evidence, evaluator configurations, identity ledger, and source registry records. It does not establish that external source content is unchanged or that prior human judgment remains substantively valid.' }
  }

  function createOrSuccessor({ requestId, operation, input }) {
    requireStore()
    if (!UUID.test(requestId ?? '') || !['decision.create', 'decision.successor'].includes(operation)) return { status: 'rejected', message: 'Choose a UUID and supported contextual decision operation.' }
    let normalized
    try { normalized = validateDecisionInput(input, { successor: operation === 'decision.successor' }) } catch (error) { return { status: 'rejected', requestId, message: error.message } }
    let basis
    let comparison
    try {
      basis = captureBasis(normalized.principleIds)
      if (basis.corpusRevision !== normalized.expectedCorpusRevision) return { status: 'rejected', requestId, message: 'The canonical corpus changed after comparison. Reopen and compare the current principles before saving.' }
      comparison = compare({ entryIds: normalized.principleIds })
      if (comparison.corpusRevision !== basis.corpusRevision || captureBasis(normalized.principleIds).corpusRevision !== basis.corpusRevision) return { status: 'rejected', requestId, message: 'The canonical corpus changed while preparing the decision. Reopen and compare again.' }
    } catch (error) { return { status: 'rejected', requestId, message: error.message } }
    const inputSha256 = digest({ operation, input })
    let existing
    try { existing = readRequestRecord(requestId) } catch (error) { return { status: 'unknown', requestId, message: error.message } }
    if (existing) {
      if (existing.status === 'not_seen') return { status: 'not_seen', requestId, message: 'This request ID was durably fenced and cannot be reused.' }
      if (existing.operation !== operation || existing.inputSha256 !== inputSha256) return { status: 'rejected', requestId, message: 'Request ID is bound to a different operation or input.' }
      if (existing.status === 'confirmed') {
        const record = readDecisionRecord(existing.recordId)
        if (record.requestId !== requestId || record.operation !== operation || record.inputSha256 !== inputSha256) return { status: 'unknown', requestId, message: 'Confirmed request does not match its retained decision identity.' }
        return { status: 'confirmed', requestId, result: record }
      }
      return { status: existing.status === 'rejected' ? 'rejected' : 'unknown', requestId, message: 'This request is not confirmed; recover the exact request and do not replay it.' }
    }
    const savedDecisions = readdirSync(decisionsDirectory).filter((name) => name.endsWith('.json') && UUID.test(name.slice(0, -5))).length
    if (savedDecisions >= MAX_DECISIONS) return { status: 'rejected', requestId, message: 'Private decision store is full; preserve and inspect it explicitly.' }
    if (readdirSync(requestsDirectory).filter((name) => name.endsWith('.json') && UUID.test(name.slice(0, -5))).length >= 2000) return { status: 'rejected', requestId, message: 'Request journal is full; preserve and inspect it explicitly.' }
    const pending = { schema: 'principles.atlas-request/1', requestId, operation, recordId: requestId, inputSha256, status: 'pending', createdAt: clock() }
    try { writePrivateJson(requestPath(requestId), pending, { exclusive: true }) } catch { return { status: 'unknown', requestId, message: 'Could not reserve the exact request ID; no decision was written.' } }
    try {
      const payload = {
        version: 1, title: normalized.title, reviewer: normalized.reviewer, reviewerKind: 'caller_asserted_human',
        context: normalized.context, applicability: normalized.applicability, exceptions: normalized.exceptions,
        valueAssumptions: normalized.valueAssumptions, tradeoffs: normalized.tradeoffs, judgment: normalized.judgment,
        principleIds: normalized.principleIds, basis, reviewedCorpusRevision: normalized.expectedCorpusRevision, comparisonSignals: comparison.structuralSignals,
        ...(normalized.predecessor ? { predecessor: normalized.predecessor } : {}),
        qualification: 'Human-authored contextual decision against exact retained Principles identities. This record is not evidence of truth, source entailment, independent support, corpus approval, or activation.',
        createdAt: clock()
      }
      const version = { version: 1, payload, sha256: digest(payload) }
      const record = { schema: 'principles.contextual-decision/1', id: requestId, requestId, operation, inputSha256, versions: [version] }
      writePrivateJson(decisionPath(requestId), record, { exclusive: true })
      const confirmed = { ...pending, status: 'confirmed', completedAt: clock() }
      writePrivateJson(requestPath(requestId), confirmed)
      return { status: 'confirmed', requestId, result: record }
    } catch (error) {
      const unknown = { ...pending, status: 'unknown', message: 'Decision write did not confirm; recover this exact request without replay.', updatedAt: clock() }
      try { writePrivateJson(requestPath(requestId), unknown) } catch {}
      return { status: 'unknown', requestId, message: error.message || unknown.message }
    }
  }

  function listDecisions() {
    requireStore()
    const files = readdirSync(decisionsDirectory).filter((name) => UUID.test(name.slice(0, -5)) && name.endsWith('.json')).sort().slice(0, 1000)
    return envelope({ decisions: files.map((name) => readDecisionRecord(name.slice(0, -5))).map((record) => ({ id: record.id, version: record.versions.length, decisionSha256: record.versions.at(-1).sha256, title: record.versions.at(-1).payload.title, reviewer: record.versions.at(-1).payload.reviewer, createdAt: record.versions.at(-1).payload.createdAt, predecessor: record.versions.at(-1).payload.predecessor ?? null })) })
  }

  function readDecision({ decisionId } = {}) {
    requireStore()
    const record = readDecisionRecord(decisionId)
    const payload = record.versions.at(-1).payload
    let freshness
    try { freshness = compareBasis(payload.basis, captureBasis(payload.principleIds, { includeSourceIds: payload.basis.sources.map((item) => item.sourceId), allowMissing: true })) } catch (error) { freshness = { status: 'unknown', message: error.message, qualification: 'Current canonical owner state could not be validated; no currentness conclusion is available.' } }
    return envelope({ decision: record, currentness: freshness })
  }

  function revisit({ decisionId } = {}) {
    return readDecision({ decisionId })
  }

  function recoverMutation({ requestId } = {}) {
    requireStore()
    if (!UUID.test(requestId ?? '')) return { status: 'rejected', requestId, message: 'Choose an exact request UUID.' }
    let existing
    try { existing = readRequestRecord(requestId) } catch (error) { return { status: 'unknown', requestId, message: error.message } }
    if (existing?.status === 'confirmed') {
      const record = readDecisionRecord(existing.recordId)
      if (record.requestId !== requestId || record.operation !== existing.operation || record.inputSha256 !== existing.inputSha256) return { status: 'unknown', requestId, message: 'Confirmed request does not match its retained decision identity.' }
      return { status: 'confirmed', requestId, result: record }
    }
    if (existing && ['pending', 'unknown'].includes(existing.status) && existsSync(decisionPath(requestId))) {
      const result = readDecisionRecord(requestId)
      if (result.requestId !== requestId || result.operation !== existing.operation || result.inputSha256 !== existing.inputSha256) return { status: 'unknown', requestId, message: 'Retained decision does not match the reserved request identity.' }
      const confirmed = { ...existing, status: 'confirmed', completedAt: clock() }
      writePrivateJson(requestPath(requestId), confirmed)
      return { status: 'confirmed', requestId, result }
    }
    if (existing) return { status: existing.status === 'rejected' ? 'rejected' : 'unknown', requestId, message: existing.message ?? 'Request has no confirmed decision result and will not be replayed.' }
    const fenced = { schema: 'principles.atlas-request/1', requestId, status: 'not_seen', createdAt: clock() }
    try { writePrivateJson(requestPath(requestId), fenced, { exclusive: true }); return { status: 'not_seen', requestId } } catch {
      try { existing = readRequestRecord(requestId); return existing?.status === 'confirmed' ? { status: 'confirmed', requestId, result: readDecisionRecord(existing.recordId) } : { status: 'unknown', requestId, message: 'Request state remains unavailable.' } } catch (error) { return { status: 'unknown', requestId, message: error.message } }
    }
  }

  return { search, show, source, compare, createDecision: (input) => createOrSuccessor({ ...input, operation: 'decision.create' }), createSuccessor: (input) => createOrSuccessor({ ...input, operation: 'decision.successor' }), listDecisions, readDecision, revisit, recoverMutation }
}
