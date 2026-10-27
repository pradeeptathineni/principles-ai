import { createHash, randomUUID } from 'node:crypto'
import { closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import canonicalize from 'canonicalize'
import { validateRepository } from './validator.js'
import { applyActivationManifest, applyPrincipleEntryRetirement, buildActivationManifest, buildActivationPackage, buildActivationReview, materializeContent, planPrincipleEntryRetirement, renderContentScaffold } from './mutation.js'

const STORE_SCHEMA = 'principles.research-dossier/1'
const MAX_BYTES = 2_000_000
const HASH = /^[a-f0-9]{64}$/
const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/
const MUTATION_OPERATIONS = new Set(['propose', 'revise', 'review', 'adopt', 'activate', 'retire'])
const REQUEST_SCHEMA = 'principles.owner-mutation-request/1'
const MAX_REQUESTS = 2000

function digest(value) {
  const encoded = canonicalize(value)
  if (!encoded) throw new Error('Dossier state could not be encoded canonically')
  return createHash('sha256').update(encoded).digest('hex')
}

function textDigest(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function required(value, label, limit) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) throw new Error(`${label} must be non-empty and at most ${limit} characters`)
  return value.trim()
}

function list(value, label, limit, { allowEmpty = true } = {}) {
  if (!Array.isArray(value) || value.length > limit || (!allowEmpty && !value.length)) throw new Error(`${label} must be an array of at most ${limit} items`)
  return value
}

function exactObject(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !keys.includes(key))) throw new Error(`${label} has unknown fields`)
}

function verifyResearchShape(value) {
  exactObject(value, ['studyId', 'studySha256', 'revision', 'questionId', 'questionSha256', 'resultStatus', 'coverage', 'answer', 'gaps', 'citations', 'provenance'], 'Research answer')
  if (!/^(?:study:)?[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(value.studyId ?? '') || !HASH.test(value.studySha256 ?? '') || !HASH.test(value.questionSha256 ?? '') || !/^study-question:[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(value.questionId ?? '')) throw new Error('Research answer needs exact retained study and question identities')
  const validRevision = (revision) => typeof revision === 'string'
    ? Boolean(revision.trim()) && revision.length <= 160
    : Number.isSafeInteger(revision) && revision > 0
  if (!validRevision(value.revision)) throw new Error('Research revision must retain its string or positive integer owner value')
  required(value.resultStatus, 'Research result status', 80)
  required(value.coverage, 'Research coverage', 80)
  exactObject(value.provenance, ['planDigest', 'resultContentSha256'], 'Research provenance')
  if (!HASH.test(value.provenance.planDigest ?? '') || !HASH.test(value.provenance.resultContentSha256 ?? '')) throw new Error('Research provenance digests must be SHA-256 values')
  const citations = list(value.citations, 'Research citations', 48)
  const citationIds = new Set()
  for (const citation of citations) {
    exactObject(citation, ['id', 'documentId', 'page', 'start', 'end', 'quote', 'quoteTruncated', 'notebookId', 'recordId', 'version', 'sourceDigest', 'sourceTitle'], 'Research citation')
    required(citation.id, 'Research citation ID', 160)
    if (citationIds.has(citation.id)) throw new Error('Research citation IDs must be unique')
    citationIds.add(citation.id)
    required(citation.documentId, 'Research document ID', 300)
    required(citation.notebookId, 'Research notebook ID', 160)
    required(citation.recordId, 'Research source record ID', 160)
    if (!(citation.version === null || validRevision(citation.version))) throw new Error('Research source version must retain its null, string, or positive integer owner value')
    required(citation.sourceTitle, 'Research source title', 500)
    if (!HASH.test(citation.sourceDigest ?? '') || typeof citation.quote !== 'string' || citation.quote.length > 1200 || typeof citation.quoteTruncated !== 'boolean') throw new Error('Research citation quote or source digest is invalid')
    if (citation.page !== null && (!Number.isSafeInteger(citation.page) || citation.page < 1)) throw new Error('Research citation page is invalid')
    if (!Number.isSafeInteger(citation.start) || !Number.isSafeInteger(citation.end) || citation.start < 0 || citation.end < citation.start) throw new Error('Research citation locator is invalid')
  }
  const answer = list(value.answer, 'Research answer rows', 12)
  for (const row of answer) {
    exactObject(row, ['text', 'evidenceIds'], 'Research answer row')
    required(row.text, 'Research answer text', 1600)
    const evidenceIds = list(row.evidenceIds, 'Research evidence IDs', 48, { allowEmpty: false })
    if (evidenceIds.some((id) => !citationIds.has(id))) throw new Error('Research answer points outside its retained citations')
  }
  const gaps = list(value.gaps, 'Research gaps', 20)
  gaps.forEach((gap) => required(gap, 'Research gap', 500))
  return new Set(citationIds)
}

function validateCandidate(root, candidate, evidenceIds) {
  exactObject(candidate, ['placement', 'title', 'assertion', 'rationale', 'examples', 'limits', 'counterevidence', 'selectedEvidenceIds'], 'Principle proposal')
  exactObject(candidate.placement, ['domain', 'scope'], 'Principle placement')
  const validation = validateRepository(root)
  if (validation.bag.errorCount) throw new Error(`Principles repository does not currently validate: ${validation.bag.sorted().slice(0, 4).map((item) => `${item.path} ${item.code}`).join('; ')}`)
  const manifest = validation.state.manifests.find((item) => item.value.id === candidate.placement.domain)?.value
  if (!manifest || manifest.taxonomy_status !== 'accepted') throw new Error('Proposal placement must use an accepted domain')
  const scope = candidate.placement.scope
  if (scope !== 'principles' && scope !== 'personal-growth' && !manifest.subdomains.some((item) => item.id === scope && item.status === 'accepted')) throw new Error('Proposal placement must use an accepted corpus scope')
  const examples = list(candidate.examples, 'Examples', 12)
  const limits = list(candidate.limits, 'Limits', 12)
  const counterevidence = list(candidate.counterevidence, 'Counterevidence', 20)
  examples.forEach((item) => required(item, 'Example', 1000))
  limits.forEach((item) => required(item, 'Limit', 1000))
  for (const item of counterevidence) {
    exactObject(item, ['text', 'evidenceIds'], 'Counterevidence item')
    required(item.text, 'Counterevidence description', 1000)
    if (list(item.evidenceIds, 'Counterevidence citation IDs', 24).some((id) => !evidenceIds.has(id))) throw new Error('Counterevidence points outside its retained Research citations')
  }
  const selectedEvidenceIds = list(candidate.selectedEvidenceIds, 'Selected evidence IDs', 48, { allowEmpty: false })
  if (new Set(selectedEvidenceIds).size !== selectedEvidenceIds.length || selectedEvidenceIds.some((id) => !evidenceIds.has(id))) throw new Error('Select unique evidence IDs from the frozen Research answer')
  return {
    placement: { domain: required(candidate.placement.domain, 'Domain ID', 80), scope: required(scope, 'Scope ID', 80) },
    title: required(candidate.title, 'Principle title', 160),
    assertion: required(candidate.assertion, 'Principle assertion', 2000),
    rationale: required(candidate.rationale, 'Rationale', 4000),
    examples: examples.map((item) => item.trim()),
    limits: limits.map((item) => item.trim()),
    counterevidence: counterevidence.map((item) => ({ text: item.text.trim(), evidenceIds: [...item.evidenceIds] })),
    selectedEvidenceIds: [...selectedEvidenceIds],
  }
}

function eventHash(event) {
  const { event_sha256: _digest, ...payload } = event
  return digest(payload)
}

function validateRecord(record, expectedId) {
  if (record?.schema !== STORE_SCHEMA || record.id !== expectedId || !Array.isArray(record.versions) || !record.versions.length || !Array.isArray(record.events)) throw new Error('Principle dossier record is malformed')
  for (let index = 0; index < record.versions.length; index += 1) {
    const version = record.versions[index]
    if (version.version !== index + 1 || digest({ proposal: version.proposal, research: version.research }) !== version.version_sha256) throw new Error('Principle dossier version history failed its digest check')
  }
  let prior = null
  for (let index = 0; index < record.events.length; index += 1) {
    const event = record.events[index]
    if (event.sequence !== index + 1 || event.previous_event_sha256 !== prior || event.event_sha256 !== eventHash(event)) throw new Error('Principle dossier event history failed its hash-chain check')
    prior = event.event_sha256
  }
  return record
}

  function statusFor(record, version = record.versions.length) {
  let status = 'proposed'
  for (const event of record.events) {
    if (event.version > version) continue
    if (event.kind === 'reviewed') status = event.disposition === 'accept' ? 'accepted' : event.disposition === 'reject' ? 'rejected' : 'revision_requested'
    if (event.kind === 'adopted') status = 'canonical_draft'
    if (event.kind === 'activated') status = 'canonical_active'
    if (event.kind === 'retired') status = 'canonical_retired'
    if (event.kind === 'revised' && event.version === version) status = 'proposed'
  }
  return status
}

export function createPrincipleDossierService({ root, store, adoptionTargets = [], researchOwnerReader = null, researchOwnerRevision = null, clock = () => new Date().toISOString(), idFactory = randomUUID }) {
  const repository = realpathSync(resolve(required(root, 'Principles repository root', 4096)))
  const directory = resolve(required(store, 'Explicit local dossier store', 4096))
  if (!directory.startsWith('/') || directory === repository || directory.startsWith(`${repository}/`)) throw new Error('Dossier store must be an absolute directory outside the Principles repository')
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  if (lstatSync(directory).isSymbolicLink() || !lstatSync(directory).isDirectory() || realpathSync(directory) !== directory) throw new Error('Dossier store must be a real exact directory')
  if (researchOwnerReader && !/^[a-f0-9]{40,64}$/.test(researchOwnerRevision ?? '')) throw new Error('A frozen Research owner revision is required when configuring an owner reader')
  if (!Array.isArray(adoptionTargets) || adoptionTargets.length > 32) throw new Error('Adoption targets must be a bounded host configuration')
  const targets = new Map()
  for (const target of adoptionTargets) {
    exactObject(target, ['id', 'path'], 'Adoption target')
    const id = required(target.id, 'Adoption target ID', 80)
    const path = required(target.path, 'Adoption target path', 240)
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id) || targets.has(id)) throw new Error('Adoption target IDs must be unique lowercase tokens')
    targets.set(id, path)
  }
  const recordPath = (id) => join(directory, `${id}.json`)
  const requestsDirectory = join(directory, 'requests')
  mkdirSync(requestsDirectory, { recursive: true, mode: 0o700 })
  if (lstatSync(requestsDirectory).isSymbolicLink() || !lstatSync(requestsDirectory).isDirectory() || realpathSync(requestsDirectory) !== requestsDirectory) throw new Error('Owner request journal must be a private exact directory')
  const requestPath = (id) => join(requestsDirectory, `${id}.json`)

  function syncDirectory(path) {
    const fd = openSync(path, 'r')
    try { fsyncSync(fd) } finally { closeSync(fd) }
  }

  function readRequest(requestId) {
    if (!UUID.test(requestId ?? '')) throw new Error('Choose an exact owner request ID')
    const path = requestPath(requestId)
    if (!existsSync(path)) return null
    const stat = lstatSync(path)
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size > MAX_BYTES || realpathSync(path) !== path) throw new Error('Owner request journal record is unsafe or oversized')
    const value = JSON.parse(readFileSync(path, 'utf8'))
    if (value?.schema !== REQUEST_SCHEMA || value.requestId !== requestId || !['pending', 'unknown', 'confirmed', 'not_seen'].includes(value.status)) throw new Error('Owner request journal record is malformed')
    if (value.status !== 'not_seen' && (!MUTATION_OPERATIONS.has(value.operation) || !HASH.test(value.inputSha256 ?? '') || !UUID.test(value.recordId ?? ''))) throw new Error('Owner request journal identity is malformed')
    if (value.status === 'confirmed' && !('result' in value)) throw new Error('Confirmed owner request has no retained result')
    return value
  }

  function writeRequest(value, { exclusive = false } = {}) {
    const path = requestPath(value.requestId)
    const bytes = `${JSON.stringify(value, null, 2)}\n`
    if (Buffer.byteLength(bytes) > MAX_BYTES) throw new Error('Owner request journal record exceeds its size limit')
    if (exclusive) {
      const fd = openSync(path, 'wx', 0o600)
      try { writeFileSync(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) }
      syncDirectory(requestsDirectory)
      return value
    }
    const temporary = join(requestsDirectory, `.${value.requestId}.${randomUUID()}.tmp`)
    try {
      const fd = openSync(temporary, 'wx', 0o600)
      try { writeFileSync(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) }
      renameSync(temporary, path)
      syncDirectory(requestsDirectory)
    } finally {
      if (existsSync(temporary)) unlinkSync(temporary)
    }
    return value
  }

  function withLock(operation) {
    const lock = join(directory, '.principle-dossier.lock')
    let fd
    try {
      fd = openSync(lock, 'wx', 0o600)
    } catch (error) {
      if (error.code === 'EEXIST') throw new Error('Another principle dossier write is in progress')
      throw error
    }
    try { return operation() } finally { closeSync(fd); if (existsSync(lock)) unlinkSync(lock) }
  }

  function readRecord(id) {
    if (!UUID.test(id ?? '')) throw new Error('Choose an exact principle dossier ID')
    const path = recordPath(id)
    if (lstatSync(path).isSymbolicLink() || !lstatSync(path).isFile() || lstatSync(path).size > MAX_BYTES || realpathSync(path) !== path) throw new Error('Principle dossier record is unsafe or oversized')
    return validateRecord(JSON.parse(readFileSync(path, 'utf8')), id)
  }

  function save(record, expected = null) {
    return withLock(() => {
      const path = recordPath(record.id)
      const current = existsSync(path) ? readRecord(record.id) : null
      if (expected === null && current) throw new Error('Principle dossier already exists')
      if (expected !== null && (!current || current.events.at(-1)?.event_sha256 !== expected)) throw new Error('Principle dossier changed since it was read')
      const temporary = join(directory, `.${record.id}.${idFactory()}.tmp`)
      const bytes = `${JSON.stringify(record, null, 2)}\n`
      if (Buffer.byteLength(bytes) > MAX_BYTES) throw new Error('Principle dossier exceeds its size limit')
      try {
        const fd = openSync(temporary, 'wx', 0o600)
        try { writeFileSync(fd, bytes); closeSync(fd) } catch (error) { closeSync(fd); throw error }
        renameSync(temporary, path)
      } finally { if (existsSync(temporary)) unlinkSync(temporary) }
      return record
    })
  }

  async function researchSnapshot(input) {
    const citationIds = verifyResearchShape(input)
    const frozen = structuredClone(input)
    if (!researchOwnerReader) return { answer: frozen, verification: { status: 'caller_asserted', owner_revision: null } }
    const current = await researchOwnerReader({ studyId: input.studyId, questionId: input.questionId })
    if (digest(current) !== digest(frozen)) throw new Error('Current Research owner answer does not match the supplied frozen artifact')
    return { answer: frozen, verification: { status: 'owner_verified', owner_revision: researchOwnerRevision } }
  }

  function append(record, kind, version, fields = {}) {
    const prior = record.events.at(-1)?.event_sha256 ?? null
    const event = { sequence: record.events.length + 1, kind, version, version_sha256: record.versions[version - 1].version_sha256, at: clock(), previous_event_sha256: prior, ...fields }
    event.event_sha256 = eventHash(event)
    record.events.push(event)
    return event
  }

  function view(record, version = record.versions.length) {
    if (!Number.isSafeInteger(version) || version < 1 || version > record.versions.length) throw new Error('Choose an exact retained dossier version')
    const saved = record.versions[version - 1]
    const adoption = [...record.events].reverse().find((event) => event.kind === 'adopted' && event.version === version)
    let canonical = null
    if (adoption) {
      const current = validateRepository(repository)
      const document = current.state.corpus.documents.find((item) => item.path === adoption.path)
      const entry = document?.entries.find((item) => item.id === adoption.entry_id)
      canonical = entry
        ? { path: document.path, entryId: entry.id, fileStatus: document.frontmatter.status, semanticSha256: document.semanticSha256, matchesAdoptedRevision: document.semanticSha256 === adoption.semantic_sha256 }
        : current.state.ledger.principles.retired.includes(adoption.entry_id)
          ? { path: adoption.path, entryId: adoption.entry_id, fileStatus: 'retired', semanticSha256: null }
          : { path: adoption.path, entryId: adoption.entry_id, fileStatus: 'missing', semanticSha256: null }
    }
    const canonicalStatus = canonical?.fileStatus === 'active' ? 'canonical_active'
      : canonical?.fileStatus === 'draft' ? 'canonical_draft'
        : canonical?.fileStatus === 'retired' ? 'canonical_retired'
          : canonical?.fileStatus === 'missing' ? 'canonical_missing' : statusFor(record, version)
    return { schema: STORE_SCHEMA, id: record.id, version, versionSha256: saved.version_sha256, status: canonicalStatus, canonical, proposal: structuredClone(saved.proposal), research: structuredClone(saved.research), events: structuredClone(record.events.filter((event) => event.version === version)) }
  }

  function canonicalCitationMap(research, selectedIds, sourceMap, state) {
    list(sourceMap, 'Research citation to Principles source mapping', 48, { allowEmpty: false })
    const allowed = new Set(selectedIds)
    const byCitation = new Map()
    for (const item of sourceMap) {
      exactObject(item, ['researchCitationId', 'sourceId'], 'Research citation mapping')
      const citationId = required(item.researchCitationId, 'Research citation ID', 160)
      const sourceId = required(item.sourceId, 'Principles source ID', 80)
      if (!allowed.has(citationId) || byCitation.has(citationId)) throw new Error('Each mapped Research citation must be selected and mapped once')
      const source = state.sourceById.get(sourceId)?.value
      if (!source || !['active', 'moved'].includes(source.status)) throw new Error(`${sourceId} must resolve to an active or moved canonical Principles source`)
      byCitation.set(citationId, sourceId)
    }
    if (selectedIds.some((id) => !byCitation.has(id))) throw new Error('Map every selected Research citation to an existing Principles source ID')
    const orderedSources = [...new Set(selectedIds.map((id) => byCitation.get(id)))]
    const labelBySource = new Map(orderedSources.map((sourceId, index) => [sourceId, String(index + 1)]))
    return { byCitation, orderedSources, labelBySource }
  }

  function markdownText(value) {
    return value.replace(/[\\`*_{}\[\]()#+.!|<>]/g, '\\$&')
  }

  function corpusDraft(record, version, targetPath, sourceMap, state) {
    const proposal = version.proposal
    const citationIds = [...new Set([...proposal.selectedEvidenceIds, ...proposal.counterevidence.flatMap((item) => item.evidenceIds)])]
    const mapped = canonicalCitationMap(version.research.answer, citationIds, sourceMap, state)
    const runFor = (ids = proposal.selectedEvidenceIds) => [...new Set(ids.map((id) => mapped.byCitation.get(id)).filter(Boolean))]
      .map((sourceId) => `[${mapped.labelBySource.get(sourceId)}]`).join(', ')
    const qualification = version.research.verification.status === 'owner_verified'
      ? `Qualification: the Research owner confirmed the exact retained answer at revision ${version.research.verification.owner_revision}; this confirms artifact identity only. The citation-to-Principles source mapping is caller supplied, and this review record does not establish that the sources entail the normative wording.`
      : 'Qualification: the Research answer and citation-to-Principles source mapping are caller asserted. This human-reviewed proposal is not evidence of truth or proof that the cited sources entail its normative wording.'
    const manifest = state.manifests.find((item) => item.value.id === proposal.placement.domain)?.value
    const scopeTitle = manifest.subdomains.find((item) => item.id === proposal.placement.scope)?.title
      ?? (proposal.placement.scope === 'personal-growth' ? 'Personal Growth' : 'Principles')
    const title = `${manifest.title} ${scopeTitle}`
    const id = proposal.placement.scope === 'principles' ? `${proposal.placement.domain}.principles`
      : proposal.placement.scope === 'personal-growth' ? `${proposal.placement.domain}.personal-growth`
        : `${proposal.placement.domain}.${proposal.placement.scope}`
    const frontmatter = renderContentScaffold(repository, { state }, targetPath)
      .replace(/^id: .*$/m, `id: ${id}`)
      .replace(/^title: .*$/m, `title: ${title}`)
      .replace(/^# .*$/m, `# ${title}`)
    const why = [proposal.rationale, ...proposal.examples.map((example) => `Example: ${example}`)]
      .map((text) => `${markdownText(text)} ${runFor()}`).join('\n\n')
    const practices = ['Apply the principle only within the reviewed scope and record relevant limits before relying on it.']
      .map((text) => `- ${markdownText(text)} ${runFor()}`).join('\n')
    const caveats = [
      ...proposal.limits.map((text) => ({ text: `Limit: ${text}`, evidenceIds: proposal.selectedEvidenceIds })),
      ...proposal.counterevidence.map((item) => ({ text: `Counterevidence to assess: ${item.text}`, evidenceIds: item.evidenceIds.length ? item.evidenceIds : proposal.selectedEvidenceIds })),
      { text: qualification, evidenceIds: proposal.selectedEvidenceIds },
    ]
    const applicability = caveats.map((item) => `${markdownText(item.text)} ${runFor(item.evidenceIds)}`).join('\n\n')
    const referenceList = mapped.orderedSources.map((sourceId, index) => {
      const source = state.sourceById.get(sourceId).value
      return `${index + 1}. [${source.title}][${index + 1}] — \`${sourceId}\``
    }).join('\n')
    const definitions = mapped.orderedSources.map((sourceId, index) => `[${index + 1}]: ${state.sourceById.get(sourceId).value.canonical_url}`).join('\n')
    const entry = `### PRN-AUTO — ${markdownText(proposal.title)}\n\n${markdownText(proposal.assertion)} ${runFor()}\n\n#### Why\n\n${why}\n\n#### Practices\n\n${practices}\n\n#### Applicability\n\n${applicability}`
    const content = frontmatter
      .replace(/^<Editorial .*?>$/m, `Human-reviewed proposal adopted from frozen Research artifact ${version.research.answer.studyId}, question ${version.research.answer.questionId}. Qualification is retained below; canonical activation remains a separate explicit action.`)
      .replace(/^<Editorial subdomain boundary\..*?>$/m, `Human-reviewed proposal adopted from frozen Research artifact ${version.research.answer.studyId}, question ${version.research.answer.questionId}. Qualification is retained below; canonical activation remains a separate explicit action.`)
      .replace(/^<Editorial growth principle.*?>$/m, `Human-reviewed proposal adopted from frozen Research artifact ${version.research.answer.studyId}, question ${version.research.answer.questionId}. Qualification is retained below; canonical activation remains a separate explicit action.`)
      .replace(/^### PRN-AUTO[\s\S]*?(?=^## References)/m, `${entry}\n\n`)
      .replace(/^## References[\s\S]*$/m, `## References\n\n${referenceList}\n\n${definitions}\n`)
      .replace(/\n{3,}/g, '\n\n')
    return { content, sourceMap: sourceMap.map((item) => ({ ...item })) }
  }

  const service = {
    async propose({ proposal, research, requestId = undefined, dossierId = undefined }) {
      const evidenceIds = verifyResearchShape(research)
      const normalized = validateCandidate(repository, proposal, evidenceIds)
      const snapshot = await researchSnapshot(research)
      const id = dossierId ?? (requestId || idFactory())
      if (!UUID.test(id)) throw new Error('Dossier ID generator must return a UUID')
      const version = { version: 1, proposal: normalized, research: snapshot, created_at: clock() }
      version.version_sha256 = digest({ proposal: version.proposal, research: version.research })
      const record = { schema: STORE_SCHEMA, id, created_at: version.created_at, versions: [version], events: [] }
      append(record, 'proposed', 1, { source_verification: snapshot.verification.status, ...(requestId ? { request_id: requestId } : {}) })
      save(record)
      return view(record)
    },
    async revise({ id, expectedVersion, proposal, research = undefined, requestId = undefined }) {
      const record = readRecord(id)
      if (expectedVersion !== record.versions.length || ['canonical_draft', 'canonical_active', 'canonical_retired'].includes(statusFor(record))) throw new Error('Only the current proposal not yet adopted into the canonical corpus can be revised')
      const prior = record.versions.at(-1)
      const evidence = research === undefined ? prior.research : await researchSnapshot(research)
      const citationIds = new Set(evidence.answer.citations.map((citation) => citation.id))
      const normalized = validateCandidate(repository, proposal, citationIds)
      const version = { version: record.versions.length + 1, proposal: normalized, research: evidence, created_at: clock() }
      version.version_sha256 = digest({ proposal: version.proposal, research: version.research })
      record.versions.push(version)
      append(record, 'revised', version.version, requestId ? { request_id: requestId } : {})
      save(record, record.events.at(-2)?.event_sha256)
      return view(record)
    },
    review({ id, version, versionSha256, disposition, reviewer, reviewerKind, supportOutcome, counterevidenceReviewed, limitsReviewed, calibration = '', requestId = undefined }) {
      const record = readRecord(id)
      const saved = record.versions.at(-1)
      if (version !== saved.version || versionSha256 !== saved.version_sha256) throw new Error('Review must bind the exact latest proposal revision')
      if (['canonical_draft', 'canonical_active', 'canonical_retired'].includes(statusFor(record))) throw new Error('Adopted or retired proposals cannot be reviewed again; create a new proposal version')
      if (!['accept', 'revise', 'reject'].includes(disposition) || !['human', 'agent'].includes(reviewerKind)) throw new Error('Choose an explicit review disposition and reviewer kind')
      required(reviewer, 'Reviewer identity', 160)
      if (typeof counterevidenceReviewed !== 'boolean' || typeof limitsReviewed !== 'boolean' || !counterevidenceReviewed || !limitsReviewed) throw new Error('Review must explicitly assess counterevidence and limits')
      if (!['strong', 'partial', 'unsupported', 'disputed'].includes(supportOutcome)) throw new Error('Choose an explicit evidence outcome')
      if (disposition === 'accept' && !['strong', 'disputed'].includes(supportOutcome)) throw new Error('Partial or unsupported claims cannot be accepted')
      if (supportOutcome === 'disputed' && !required(calibration, 'Disagreement calibration', 2000)) throw new Error('Disputed evidence requires visible calibration')
      append(record, 'reviewed', version, { disposition, reviewer: reviewer.trim(), reviewer_kind: reviewerKind, reviewer_identity: 'caller_asserted', support_outcome: supportOutcome, counterevidence_reviewed: true, limits_reviewed: true, calibration: calibration.trim(), ...(requestId ? { request_id: requestId } : {}) })
      save(record, record.events.at(-2)?.event_sha256)
      return view(record)
    },
    adopt({ id, version, versionSha256, targetId, sourceMap, requestId = undefined }) {
      const record = readRecord(id)
      const latest = record.versions.at(-1)
      if (version !== latest.version || versionSha256 !== latest.version_sha256 || statusFor(record) !== 'accepted') throw new Error('Adoption requires explicit acceptance of the exact latest proposal')
      const targetPath = targets.get(targetId)
      if (!targetPath) throw new Error('Choose an exact host-configured adoption target')
      const targetMatch = /^domains\/([a-z0-9-]+)\/([a-z0-9-]+|principles|personal-growth)\.md$/.exec(targetPath)
      if (!targetMatch || targetMatch[1] !== latest.proposal.placement.domain || targetMatch[2] !== latest.proposal.placement.scope) throw new Error('Configured adoption target does not match the accepted proposal placement')
      const validation = validateRepository(repository)
      if (validation.bag.errorCount) throw new Error('Principles repository does not currently validate')
      if (existsSync(join(repository, targetPath))) throw new Error('Configured adoption target already exists; adoption only creates an absent host-approved target')
      const draft = corpusDraft(record, latest, targetPath, sourceMap, validation.state)
      append(record, 'adoption_prepared', version, { target_id: targetId, path: targetPath, source_mapping: draft.sourceMap, qualification: latest.research.verification.status === 'owner_verified' ? 'owner_verified_artifact_caller_mapped_sources' : 'caller_asserted_artifact_and_source_mapping', content_template: draft.content, placeholder_count: [...draft.content.matchAll(/PRN-AUTO/g)].length, ...(requestId ? { request_id: requestId } : {}) })
      save(record, record.events.at(-2)?.event_sha256)
      const result = materializeContent(repository, validation, { version: 1, target: targetPath, content: draft.content }, () => validateRepository(repository))
      const after = validateRepository(repository)
      const document = after.state.corpus.documents.find((item) => item.path === targetPath)
      if (!document || document.frontmatter.status !== 'draft' || result.allocated.length !== 1) throw new Error('Canonical adoption did not produce exactly one valid draft principle')
      append(record, 'adopted', version, { target_id: targetId, path: targetPath, entry_id: result.allocated[0], semantic_sha256: document.semanticSha256, source_mapping: draft.sourceMap, qualification: latest.research.verification.status === 'owner_verified' ? 'owner_verified_artifact_caller_mapped_sources' : 'caller_asserted_artifact_and_source_mapping', ...(requestId ? { request_id: requestId } : {}) })
      save(record, record.events.at(-2)?.event_sha256)
      return view(record)
    },
    activate({ id, version, versionSha256, reviewEventSha256, reviewedAt, requestId = undefined, activationPackageSha256 = undefined, expectedSemanticSha256 = undefined }) {
      const record = readRecord(id)
      const latest = record.versions.at(-1)
      const review = record.events.find((event) => event.event_sha256 === reviewEventSha256)
      if (version !== latest.version || versionSha256 !== latest.version_sha256 || review?.kind !== 'reviewed' || review.version !== version || review.disposition !== 'accept' || review.reviewer_kind !== 'human') throw new Error('Activation requires explicit human acceptance of the exact latest version')
      if (latest.research.answer.coverage === 'insufficient') throw new Error('Insufficient Research coverage cannot be activated')
      const adoption = [...record.events].reverse().find((event) => event.kind === 'adopted' && event.version === version)
      if (!adoption) throw new Error('Activation requires adoption into the canonical Principles corpus first')
      const validation = validateRepository(repository)
      const current = validation.state.corpus.documents.find((item) => item.path === adoption.path)
      if (!current || current.frontmatter.status !== 'draft' || !current.entries.some((entry) => entry.id === adoption.entry_id)) throw new Error('Canonical draft changed or disappeared; prepare a new review')
      const activationPackage = buildActivationPackage(validation, latest.proposal.placement.domain)
      const activationReview = buildActivationReview(activationPackage)
      const packageArtifact = activationPackage.artifacts.find((item) => item.path === adoption.path)
      if (!packageArtifact) throw new Error('Canonical activation package no longer includes the adopted draft')
      if (activationPackageSha256 !== undefined && activationReview.machine_binding_sha256 !== activationPackageSha256) throw new Error('Activation package changed after its exact review')
      if (expectedSemanticSha256 !== undefined && packageArtifact.diagnostics.semantic_sha256 !== expectedSemanticSha256) throw new Error('Canonical semantic digest changed after its exact review')
      const at = required(reviewedAt, 'Activation date', 40)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(at) || Number.isNaN(Date.parse(`${at}T00:00:00Z`))) throw new Error('Activation date must use YYYY-MM-DD')
      const manifest = buildActivationManifest(activationPackage, at, [adoption.path])
      const prepared = append(record, 'activation_prepared', version, { review_event_sha256: review.event_sha256, path: adoption.path, entry_id: adoption.entry_id, reviewed_at: at, activation_package_sha256: activationReview.machine_binding_sha256, expected_semantic_sha256: packageArtifact.diagnostics.semantic_sha256, ...(requestId ? { request_id: requestId } : {}) })
      save(record, record.events.at(-2)?.event_sha256)
      const result = applyActivationManifest(repository, validation, manifest, () => validateRepository(repository))
      append(record, 'activated', version, { review_event_sha256: review.event_sha256, disposition: 'human_accepted', path: adoption.path, entry_id: adoption.entry_id, reviewed_at: at, qualification: latest.research.verification.status === 'owner_verified' ? 'owner_verified_artifact_caller_mapped_sources' : 'caller_asserted_artifact_and_source_mapping', ...(requestId ? { request_id: requestId, prepared_event_sha256: prepared.event_sha256 } : {}) })
      save(record, record.events.at(-2)?.event_sha256)
      const resultView = view(record)
      return { ...resultView, activation: result }
    },
    retire({ id, version, versionSha256, reviewer, reason, retiredAt, expectedFileSha256, expectedSemanticSha256, expectedRetirementPlanSha256 = undefined, demoteRemainingEntries = false, requestId = undefined }) {
      const record = readRecord(id)
      const latest = record.versions.at(-1)
      const activeEvent = [...record.events].reverse().find((event) => event.kind === 'activated' && event.version === latest.version)
      if (statusFor(record) !== 'canonical_active' || !activeEvent || version !== latest.version || versionSha256 !== latest.version_sha256) throw new Error('Retirement must name the exact canonical active principle')
      const reviewerName = required(reviewer, 'Retirement reviewer', 160)
      const retirementReason = required(reason, 'Retirement rationale', 2000)
      const retiredAtValue = required(retiredAt, 'Retirement date', 40)
      const validation = validateRepository(repository)
      const plan = planPrincipleEntryRetirement(repository, validation, { path: activeEvent.path, entryId: activeEvent.entry_id, expectedFileSha256, expectedSemanticSha256, demoteRemainingEntries })
      if (expectedRetirementPlanSha256 !== undefined && plan.plan_sha256 !== expectedRetirementPlanSha256) throw new Error('Retirement plan changed after its exact review')
      append(record, 'retirement_prepared', version, { reviewer: reviewerName, reviewer_identity: 'caller_asserted_human', reason: retirementReason, retired_at: retiredAtValue, path: plan.path, entry_id: plan.entry_id, prior_file_sha256: plan.prior_file_sha256, prior_semantic_sha256: plan.prior_semantic_sha256, prior_ledger_sha256: plan.prior_ledger_sha256, expected_post_file_sha256: textDigest(plan.corpus_content), expected_post_ledger_sha256: textDigest(plan.ledger_content), exact_prior_entry: plan.entry_content, demoted_active_file: plan.demoted_active_file, remaining_entries_status: plan.remaining_entries_status, ...(requestId ? { request_id: requestId } : {}) })
      save(record, record.events.at(-2)?.event_sha256)
      const result = applyPrincipleEntryRetirement(repository, plan, () => validateRepository(repository))
      append(record, 'retired', version, { reviewer: reviewerName, reviewer_identity: 'caller_asserted_human', reason: retirementReason, retired_at: retiredAtValue, path: result.path, entry_id: result.entry_id, canonical_retirement: true, ...(requestId ? { request_id: requestId } : {}) })
      save(record, record.events.at(-2)?.event_sha256)
      return { ...view(record), retirement: result }
    },
    read(id, version = undefined) {
      return view(readRecord(id), version ?? undefined)
    },
    export({ id, version = undefined }) {
      const value = this.read(id, version)
      return {
        schema: 'principles.qualified-dossier-export/1',
        qualification: 'Human-reviewable decision record. It is not evidence of truth; current canonical status is read from the Principles corpus and identity ledger.',
        research_verification: value.research.verification,
        research_identity: {
          studyId: value.research.answer.studyId,
          studySha256: value.research.answer.studySha256,
          revision: value.research.answer.revision,
          questionId: value.research.answer.questionId,
          questionSha256: value.research.answer.questionSha256,
          provenance: value.research.answer.provenance,
        },
        dossier: value,
        selectedEvidence: value.proposal.selectedEvidenceIds.map((id) => value.research.answer.citations.find((citation) => citation.id === id)),
      }
    },
  }

  function confirmedRequest(request, result) {
    const saved = {
      ...request,
      status: 'confirmed',
      result: structuredClone(result),
      message: undefined,
      completed_at: clock(),
    }
    writeRequest(saved)
    return { status: 'confirmed', requestId: saved.requestId, operation: saved.operation, inputSha256: saved.inputSha256, result: structuredClone(saved.result) }
  }

  function unknownRequest(request, message = 'Owner state does not prove whether this mutation completed; it was not replayed.') {
    // Leave the exclusive intent intact. This avoids a stale recovery reader
    // overwriting a concurrent confirmed receipt with an older unknown state.
    return { status: 'unknown', requestId: request.requestId, operation: request.operation, inputSha256: request.inputSha256, message }
  }

  function recoveryFromRecord(request) {
    const record = readRecord(request.recordId)
    const events = record.events
    const completeKind = {
      propose: 'proposed', revise: 'revised', review: 'reviewed',
      adopt: 'adopted', activate: 'activated', retire: 'retired',
    }[request.operation]
    const completed = [...events].reverse().find((event) => event.kind === completeKind && event.request_id === request.requestId)
    if (completed) return service.read(request.recordId, completed.version)

    // Prepared events bind intent, while canonical file/ledger digests prove
    // only that the intended state is present. Without a request marker in
    // the same corpus transaction they cannot prove which actor caused it.
    // Keep this crash window unknown rather than manufacture a completion
    // event from matching state.
    return null
  }

  function reconcileRequest(request) {
    if (request.status === 'confirmed')
      return { status: 'confirmed', requestId: request.requestId, operation: request.operation, inputSha256: request.inputSha256, result: structuredClone(request.result) }
    if (request.status === 'not_seen')
      return { status: 'not_seen', requestId: request.requestId, message: 'This request ID was fenced before any mutation was dispatched. Use a new ID only after reviewing the still-unconfirmed action.' }
    try {
      const result = recoveryFromRecord(request)
      if (result) return confirmedRequest(request, result)
    } catch {
      // Invalid, unavailable, or partial owner state is not proof of completion.
    }
    return unknownRequest(request)
  }

  service.mutate = async ({ requestId, operation, input }) => {
    if (!UUID.test(requestId ?? '') || !MUTATION_OPERATIONS.has(operation))
      return { status: 'rejected', message: 'Choose an exact request ID and supported owner mutation.' }
    let inputSha256
    let recordId
    try {
      const encoded = canonicalize(input)
      if (!encoded || Buffer.byteLength(encoded) > MAX_BYTES) throw new Error('Mutation input is missing or oversized.')
      inputSha256 = textDigest(encoded)
      recordId = operation === 'propose' ? requestId : required(input?.id, 'Proposal ID', 80)
      if (!UUID.test(recordId)) throw new Error('Choose an exact proposal ID.')
    } catch (error) {
      return { status: 'rejected', message: error.message }
    }

    let existing
    try { existing = readRequest(requestId) } catch (error) {
      return { status: 'rejected', message: error.message }
    }
    if (existing?.status === 'not_seen')
      return { status: 'not_seen', requestId, message: 'This request ID was fenced before dispatch and will not be reused.' }
    if (existing) {
      if (existing.operation !== operation || existing.recordId !== recordId || existing.inputSha256 !== inputSha256)
        return { status: 'rejected', message: 'Request ID is already bound to a different operation or input digest.' }
      return reconcileRequest(existing)
    }
    try {
      const files = readdirSync(requestsDirectory).filter((name) => /^[a-f0-9-]{36}\.json$/.test(name))
      if (files.length >= MAX_REQUESTS) return { status: 'rejected', message: 'Owner request journal is full; preserve and inspect it explicitly.' }
    } catch (error) {
      return { status: 'rejected', message: error.message }
    }
    const pending = { schema: REQUEST_SCHEMA, requestId, operation, recordId, inputSha256, status: 'pending', created_at: clock() }
    try { writeRequest(pending, { exclusive: true }) } catch (error) {
      if (error.code !== 'EEXIST') return { status: 'rejected', message: 'Owner could not durably reserve this request ID; no mutation was dispatched.' }
      try { existing = readRequest(requestId) } catch (readError) { return { status: 'unknown', requestId, operation, inputSha256, message: readError.message } }
      if (!existing || existing.status === 'not_seen' || existing.operation !== operation || existing.recordId !== recordId || existing.inputSha256 !== inputSha256)
        return { status: 'rejected', message: 'Request ID is already reserved or fenced and cannot be dispatched.' }
      return reconcileRequest(existing)
    }

    try {
      let nativeResult
      if (operation === 'propose') {
        let proposalInput = input
        if (!proposalInput?.research) {
          exactObject(proposalInput, ['studyId', 'questionId', 'proposal'], 'Principle proposal request')
          if (!researchOwnerReader) throw new Error('Configure the accepted Research study reader first.')
          const research = await researchOwnerReader({
            studyId: required(proposalInput.studyId, 'Research study ID', 120),
            questionId: required(proposalInput.questionId, 'Research question ID', 180),
          })
          proposalInput = { proposal: proposalInput.proposal, research }
        }
        nativeResult = await service.propose({ ...proposalInput, requestId, dossierId: requestId })
      } else nativeResult = await service[operation]({
        ...input,
        ...(operation === 'review' ? { reviewerKind: 'human' } : {}),
        requestId,
      })
      const result = service.read(recordId, operation === 'propose' ? 1 : input.version)
      return confirmedRequest(pending, result)
    } catch (error) {
      return unknownRequest(pending, 'The owner mutation was dispatched but did not confirm. Recover this exact request; it will not be executed again.')
    }
  }

  service.recoverMutation = ({ requestId }) => {
    if (!UUID.test(requestId ?? '')) return { status: 'rejected', message: 'Choose an exact owner request ID.' }
    let existing
    try { existing = readRequest(requestId) } catch (error) {
      return { status: 'unknown', requestId, message: error.message }
    }
    if (existing) return reconcileRequest(existing)
    const fenced = { schema: REQUEST_SCHEMA, requestId, status: 'not_seen', created_at: clock() }
    try {
      writeRequest(fenced, { exclusive: true })
      return reconcileRequest(fenced)
    } catch (error) {
      if (error.code !== 'EEXIST') return { status: 'unknown', requestId, message: 'Owner could not durably fence the absent request ID.' }
      try {
        existing = readRequest(requestId)
        return existing ? reconcileRequest(existing) : { status: 'unknown', requestId, message: 'Owner request state remains unavailable.' }
      } catch (readError) {
        return { status: 'unknown', requestId, message: readError.message }
      }
    }
  }

  return service
}
