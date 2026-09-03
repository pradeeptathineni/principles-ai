import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { basename } from 'node:path'
import canonicalize from 'canonicalize'
import { stringify } from 'yaml'
import { DiagnosticBag } from './diagnostics.js'
import { parseYamlText } from './yaml.js'
import { normalizeStoredUrl } from './sources.js'
import { safeResolve } from './repository.js'
import { fileSha256, applyRepositoryTransaction } from './transaction.js'
import { inspectDomainFurnishingWorkflow } from './workflow.js'

function yaml(value) {
  return stringify(value, { lineWidth: 0, defaultStringType: 'PLAIN', defaultKeyType: 'PLAIN', indentSeq: false })
}

export function loadMutationPlan(root, path) {
  const text = path === '-' ? readFileSync(0, 'utf8') : readFileSync(safeResolve(root, path), 'utf8')
  const bag = new DiagnosticBag()
  const value = parseYamlText(text, path, bag, { metadata: false })
  if (!value || bag.errorCount > 0) throw new Error(`Invalid mutation plan ${path}`)
  return value
}

function recordHash(root, path) {
  return createHash('sha256').update(readFileSync(safeResolve(root, path))).digest('hex')
}

function countedRows(map, total, key = 'name') {
  return [...map.entries()]
    .map(([name, count]) => ({ [key]: name, count, percentage: total === 0 ? 0 : Number((count * 100 / total).toFixed(1)) }))
    .sort((left, right) => right.count - left.count || left[key].localeCompare(right[key]))
}

export function buildSourceUsage(state, documents) {
  const publisherCounts = new Map()
  const evidenceKindCounts = new Map()
  const sourceCounts = new Map()
  const files = []
  let attributionCount = 0
  let bibliographyEntries = 0
  for (const document of documents) {
    const sourceByLabel = new Map(document.references.map((reference) => [reference.label, reference.sourceId]))
    const fileCounts = new Map()
    for (const entry of document.entries) {
      for (const claim of entry.claims ?? []) {
        for (const label of claim.citationLabels) {
          const sourceId = sourceByLabel.get(label)
          if (!sourceId) continue
          attributionCount += 1
          sourceCounts.set(sourceId, (sourceCounts.get(sourceId) ?? 0) + 1)
          fileCounts.set(sourceId, (fileCounts.get(sourceId) ?? 0) + 1)
          const source = state.sourceById.get(sourceId)?.value
          if (source) {
            publisherCounts.set(source.publisher, (publisherCounts.get(source.publisher) ?? 0) + 1)
            evidenceKindCounts.set(source.evidence_kind, (evidenceKindCounts.get(source.evidence_kind) ?? 0) + 1)
          }
        }
      }
    }
    bibliographyEntries += document.references.length
    files.push({
      path: document.path,
      attributions: [...fileCounts.values()].reduce((sum, count) => sum + count, 0),
      unique_sources: fileCounts.size,
      bibliography_entries: document.references.length
    })
  }
  return {
    attribution_count: attributionCount,
    unique_sources: sourceCounts.size,
    file_local_bibliography_entries: bibliographyEntries,
    by_publisher: countedRows(publisherCounts, attributionCount),
    by_evidence_kind: countedRows(evidenceKindCounts, attributionCount),
    by_source: [...sourceCounts.entries()].map(([id, count]) => {
      const source = state.sourceById.get(id)?.value
      return { id, title: source?.title ?? null, publisher: source?.publisher ?? null, evidence_kind: source?.evidence_kind ?? null, count, percentage: attributionCount === 0 ? 0 : Number((count * 100 / attributionCount).toFixed(1)) }
    }).sort((left, right) => right.count - left.count || left.id.localeCompare(right.id)),
    by_file: files.sort((left, right) => left.path.localeCompare(right.path)),
    interpretation: 'Descriptive inventory only; counts do not establish source fitness, independence, authority, or a quota.'
  }
}

function scopedGateReport(validation, taskPaths) {
  const repositoryWideGates = new Set(['architecture-review', 'evidence-policy-change', 'governance-or-ci-change', 'policy-or-schema-change'])
  const grouped = { task: new Map(), repository_wide: new Map(), unrelated: new Map() }
  const effects = validation.gateEffects ?? validation.humanGates.map((gate) => ({ gate, path: null }))
  for (const effect of effects) {
    const group = repositoryWideGates.has(effect.gate) ? 'repository_wide' : effect.path && taskPaths.has(effect.path) ? 'task' : 'unrelated'
    if (!grouped[group].has(effect.gate)) grouped[group].set(effect.gate, new Set())
    if (effect.path) grouped[group].get(effect.gate).add(effect.path)
  }
  const rows = (map, includePaths) => [...map.entries()].map(([gate, paths]) => ({
    gate,
    ...(paths.size > 0 ? { path_count: paths.size } : {}),
    ...(includePaths && paths.size > 0 ? { paths: [...paths].sort() } : {})
  })).sort((left, right) => left.gate.localeCompare(right.gate))
  return {
    task: rows(grouped.task, true),
    repository_wide: rows(grouped.repository_wide, false),
    unrelated: rows(grouped.unrelated, true)
  }
}

export function buildDomainPreparation(root, validation, domain) {
  const state = validation.state
  const manifestRecord = state.manifests.find((item) => item.value.id === domain)
  if (!manifestRecord) throw new Error(`No domain manifest exists for ${domain}`)
  const manifest = manifestRecord.value
  const documents = state.corpus.documents.filter((document) => document.frontmatter.domain === domain)
  const usedSourceIds = [...new Set(documents.flatMap((document) => document.references.map((reference) => reference.sourceId)))].sort()
  const evidenceRequired = state.policies['evidence-policy'].adoption.required_paths.filter((path) => path.startsWith(`domains/${domain}/`))
  const paths = [manifestRecord.path, ...documents.map((document) => document.path), ...usedSourceIds.map((id) => `sources/${id}.yaml`)]
  for (const document of documents) {
    for (const entry of document.entries) if (state.evidenceByEntryId.has(entry.id)) paths.push(`evidence/claims/${entry.id}.yaml`)
  }
  const taskScope = [...new Set(paths)].sort().map((path) => ({ path, input_sha256: recordHash(root, path) }))
  const taskPaths = new Set(taskScope.map((item) => item.path))
  const currentOutcome = inspectDomainFurnishingWorkflow(state, domain)
  return {
    version: 2,
    domain,
    taxonomy: {
      status: manifest.taxonomy_status,
      accepted: manifest.subdomains.filter((item) => item.status === 'accepted').map((item) => item.id),
      proposed: manifest.subdomains.filter((item) => item.status === 'proposed').map((item) => item.id),
      deprecated: manifest.subdomains.filter((item) => item.status === 'deprecated').map((item) => item.id)
    },
    content: documents.map((document) => ({
      path: document.path,
      status: document.frontmatter.status,
      semantic_sha256: document.semanticSha256,
      principles: document.entries.map((entry) => ({ id: entry.id, title: entry.title })),
      source_ids: document.references.map((reference) => reference.sourceId),
      evidence_required: evidenceRequired.includes(document.path)
    })).sort((a, b) => a.path.localeCompare(b.path)),
    next_identity: {
      principle: `PRN-${String(state.ledger.principles.next_sequence).padStart(6, '0')}`,
      source: `SRC-${String(state.ledger.sources.next_sequence).padStart(6, '0')}`
    },
    policies: Object.fromEntries(Object.entries(state.policies).map(([name, policy]) => [name, policy.version])),
    validation: {
      errors: validation.bag.errorCount,
      warnings: validation.bag.warningCount,
      transition_status: validation.transitionStatus,
      human_gates: validation.humanGates,
      current_outcome: { next_action: currentOutcome.next_action, human_gates: currentOutcome.human_gates },
      transition_gate_scope: scopedGateReport(validation, taskPaths),
      architecture_review: validation.architectureReview
    },
    source_usage: buildSourceUsage(state, documents),
    task_scope: { files: taskScope, count: taskScope.length, utf8_bytes: taskScope.reduce((total, item) => total + readFileSync(safeResolve(root, item.path)).length, 0) }
  }
}

export function registerSources(root, validation, plan, validate) {
  const planned = plan?.version === 1 && plan.source && typeof plan.source === 'object'
    ? [plan.source]
    : plan?.version === 2 && Array.isArray(plan.sources) ? plan.sources : null
  if (!planned?.length) throw new Error('Source registration plan requires version 1 with source or version 2 with a non-empty sources array')
  if (planned.length > 1000 || planned.some((source) => !source || typeof source !== 'object' || Array.isArray(source))) throw new Error('Source registration batch must contain from 1 to 1000 source objects')
  const ledger = structuredClone(validation.state.ledger)
  const registered = planned.map((metadata, offset) => {
    const id = `SRC-${String(ledger.sources.next_sequence + offset).padStart(6, '0')}`
    const source = { schema_version: 4, id, ...metadata }
    if (normalizeStoredUrl(source.canonical_url) !== source.canonical_url) throw new Error(`Source ${offset + 1} canonical_url is not in normalized storage form`)
    for (const url of source.url_aliases ?? []) if (normalizeStoredUrl(url) !== url) throw new Error(`Source ${offset + 1} alias is not normalized: ${url}`)
    const path = `sources/${id}.yaml`
    if (existsSync(safeResolve(root, path, { mustExist: false }))) throw new Error(`${path} already exists`)
    return { id, path, source }
  })
  ledger.sources.allocated.push(...registered.map((item) => item.id))
  ledger.sources.next_sequence += registered.length
  applyRepositoryTransaction(root, [
    { path: 'config/identity-ledger.yaml', expected_sha256: fileSha256(root, 'config/identity-ledger.yaml'), content: yaml(ledger) },
    ...registered.map((item) => ({ path: item.path, content: yaml(item.source) }))
  ], validate)
  return { registered: registered.map(({ id, path }) => ({ id, path })) }
}

export function registerSource(root, validation, plan, validate) {
  if (plan?.version !== 1) throw new Error('Single source registration requires a version-1 plan')
  const result = registerSources(root, validation, plan, validate).registered[0]
  return result
}

export function allocatePrincipleIdentities(root, validation, count, validate) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 1000) throw new Error('Principle identity allocation count must be an integer from 1 to 1000')
  const ledger = structuredClone(validation.state.ledger)
  const allocated = []
  for (let offset = 0; offset < count; offset += 1) {
    const id = `PRN-${String(ledger.principles.next_sequence + offset).padStart(6, '0')}`
    ledger.principles.allocated.push(id)
    allocated.push(id)
  }
  ledger.principles.next_sequence += count
  applyRepositoryTransaction(root, [
    { path: 'config/identity-ledger.yaml', expected_sha256: fileSha256(root, 'config/identity-ledger.yaml'), content: yaml(ledger) }
  ], validate)
  return { kind: 'principle', allocated }
}

export function renderContentScaffold(root, validation, target) {
  const match = /^domains\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*|principles|personal-growth)\.md$/.exec(target)
  if (!match) throw new Error('Content target must match domains/<domain>/<file>.md')
  const [, domain, scope] = match
  const manifest = validation.state.manifests.find((item) => item.value.id === domain)?.value
  if (!manifest || manifest.taxonomy_status !== 'accepted') throw new Error(`Content scaffold requires accepted domain ${domain}`)
  const domainTitle = manifest.title
  let template
  if (scope === 'principles') template = 'config/templates/principles.md'
  else if (scope === 'personal-growth') template = 'config/templates/personal-growth.md'
  else {
    const subdomain = manifest.subdomains.find((item) => item.id === scope)
    if (!subdomain || subdomain.status !== 'accepted') throw new Error(`Content scaffold requires accepted subdomain ${domain}/${scope}`)
    template = 'config/templates/subdomain.md'
  }
  const subdomainTitle = manifest.subdomains.find((item) => item.id === scope)?.title ?? ''
  return readFileSync(safeResolve(root, template), 'utf8')
    .replaceAll('<domain>', domain)
    .replaceAll('<Domain>', domainTitle)
    .replaceAll('<subdomain>', scope)
    .replaceAll('<Subdomain>', subdomainTitle)
    .replaceAll('PRN-000001', 'PRN-AUTO')
}

export function materializeContents(root, validation, plan, validate) {
  const planned = plan?.version === 1 && typeof plan.target === 'string' && typeof plan.content === 'string'
    ? [{ target: plan.target, content: plan.content }]
    : plan?.version === 2 && Array.isArray(plan.documents) ? plan.documents : null
  if (!planned?.length) throw new Error('Content materialization plan requires version 1 with target/content or version 2 with a non-empty documents array')
  if (planned.length > 1000 || planned.some((document) => typeof document?.target !== 'string' || typeof document?.content !== 'string')) throw new Error('Content materialization batch must contain from 1 to 1000 target/content objects')
  if (new Set(planned.map((document) => document.target)).size !== planned.length) throw new Error('Content materialization batch repeats a target')
  const ledger = structuredClone(validation.state.ledger)
  let ordinal = ledger.principles.next_sequence
  const materialized = planned.map((document) => {
    if (existsSync(safeResolve(root, document.target, { mustExist: false }))) throw new Error(`${document.target} already exists`)
    const matches = [...document.content.matchAll(/PRN-AUTO/g)]
    if (matches.length === 0) throw new Error(`${document.target} contains no PRN-AUTO placeholders`)
    const allocated = []
    const content = document.content.replace(/PRN-AUTO/g, () => {
      const id = `PRN-${String(ordinal++).padStart(6, '0')}`
      ledger.principles.allocated.push(id)
      allocated.push(id)
      return id
    })
    return { path: document.target, content, allocated }
  })
  ledger.principles.next_sequence = ordinal
  applyRepositoryTransaction(root, [
    { path: 'config/identity-ledger.yaml', expected_sha256: fileSha256(root, 'config/identity-ledger.yaml'), content: yaml(ledger) },
    ...materialized.map((document) => ({ path: document.path, content: document.content }))
  ], validate)
  return { materialized: materialized.map(({ path, allocated }) => ({ path, allocated })) }
}

export function materializeContent(root, validation, plan, validate) {
  if (plan?.version !== 1) throw new Error('Single content materialization requires a version-1 plan')
  return materializeContents(root, validation, plan, validate).materialized[0]
}

export function synchronizeCitations(root, validation, path, validate, { apply = false } = {}) {
  const document = validation.state.corpus.documents.find((item) => item.path === path)
  if (!document) throw new Error(`No corpus document exists at ${path}`)
  const original = readFileSync(safeResolve(root, path), 'utf8')
  const marker = '\n## References\n'
  const boundary = original.indexOf(marker)
  if (boundary < 0) throw new Error(`${path} has no References boundary`)
  let body = original.slice(0, boundary)
  const sourceByOldLabel = new Map(document.references.map((reference) => [reference.label, reference.sourceId]))
  const orderedSources = []
  for (const match of body.matchAll(/\[([1-9][0-9]*)\]/g)) {
    const sourceId = sourceByOldLabel.get(match[1])
    if (sourceId && !orderedSources.includes(sourceId)) orderedSources.push(sourceId)
  }
  const newLabelBySource = new Map(orderedSources.map((id, index) => [id, String(index + 1)]))
  body = body.replace(/\[([1-9][0-9]*)\]/g, (token, label) => {
    const sourceId = sourceByOldLabel.get(label)
    return sourceId ? `[${newLabelBySource.get(sourceId)}]` : token
  })
  const visible = orderedSources.map((id, index) => {
    const source = validation.state.sourceById.get(id)?.value
    if (!source) throw new Error(`Missing source ${id}`)
    return `${index + 1}. [${source.title}][${index + 1}] — \`${id}\``
  }).join('\n')
  const definitions = orderedSources.map((id, index) => `[${index + 1}]: ${validation.state.sourceById.get(id).value.canonical_url}`).join('\n')
  const content = `${body}${marker}\n${visible}\n\n${definitions}\n`
  const changed = content !== original
  if (apply && changed) applyRepositoryTransaction(root, [{ path, expected_sha256: fileSha256(root, path), content }], validate)
  return { path, changed, source_order: orderedSources, content_sha256: createHash('sha256').update(content).digest('hex'), ...(apply ? {} : { content }) }
}

export function synchronizeDomainCitations(root, validation, domain, validate, { apply = false } = {}) {
  const documents = validation.state.corpus.documents.filter((document) => document.frontmatter.domain === domain).sort((left, right) => left.path.localeCompare(right.path))
  if (documents.length === 0) throw new Error(`No corpus documents exist for domain ${domain}`)
  const results = documents.map((document) => synchronizeCitations(root, validation, document.path, validate, { apply: false }))
  const changed = results.filter((result) => result.changed)
  if (apply && changed.length > 0) {
    applyRepositoryTransaction(root, changed.map((result) => ({ path: result.path, expected_sha256: fileSha256(root, result.path), content: result.content })), validate)
  }
  return {
    domain,
    apply,
    checked: results.length,
    changed: changed.length,
    files: results.map(({ path, changed: fileChanged, source_order, content_sha256 }) => ({ path, changed: fileChanged, source_order, content_sha256 }))
  }
}

export function buildEvidenceScaffold(validation, entryId) {
  const resolved = validation.state.corpus.entryById.get(entryId)
  if (!resolved) throw new Error(`Unknown principle ${entryId}`)
  const existing = validation.state.evidenceByEntryId.get(entryId)?.value
  const existingByRole = new Map((existing?.claims ?? []).map((claim) => [claim.role, claim]))
  const sourceByLabel = new Map(resolved.document.references.map((reference) => [reference.label, reference.sourceId]))
  return {
    version: 1,
    entry_id: entryId,
    corpus_path: resolved.document.path,
    claims: resolved.entry.claims.map((claim) => {
      const sourceIds = [...new Set(claim.citationLabels.map((label) => sourceByLabel.get(label)).filter(Boolean))]
      const prior = existingByRole.get(claim.role)
      const priorSourceIds = prior?.sources.map((source) => source.source_id) ?? []
      const unchanged = prior?.claim_sha256 === claim.claimSha256 && JSON.stringify(priorSourceIds) === JSON.stringify(sourceIds)
      return {
        role: claim.role,
        claim_sha256: claim.claimSha256,
        source_ids: sourceIds,
        review_required: !unchanged,
        retained_review: unchanged ? { sources: prior.sources, outcome: prior.outcome } : null
      }
    })
  }
}

function presentedClaim(claim, sourceByLabel) {
  if (!claim) return null
  return {
    role: claim.role,
    text: claim.text,
    source_ids: [...new Set(claim.citationLabels.map((label) => sourceByLabel.get(label)).filter(Boolean))]
  }
}

function presentedEntry(entry, document) {
  const sourceByLabel = new Map(document.references.map((reference) => [reference.label, reference.sourceId]))
  return {
    id: entry.id,
    title: entry.title,
    statement: presentedClaim(entry.statement, sourceByLabel),
    why: entry.why.map((claim) => presentedClaim(claim, sourceByLabel)),
    practices: entry.practices.map((claim) => presentedClaim(claim, sourceByLabel)),
    applicability: entry.applicability.map((claim) => presentedClaim(claim, sourceByLabel)),
    goals: entry.goals.map((claim) => presentedClaim(claim, sourceByLabel)),
    tags: entry.tags
  }
}

function presentedContent(document) {
  return {
    title: document.title,
    introduction: document.introduction,
    principles: document.entries.map((entry) => presentedEntry(entry, document))
  }
}

function relevantTaxonomy(state, document) {
  const manifest = state.manifests.find((item) => item.value.id === document.frontmatter.domain)?.value
  if (!manifest) return null
  const scope = document.frontmatter.type === 'subdomain'
    ? manifest.subdomains.find((item) => item.id === document.frontmatter.subdomain) ?? null
    : { id: document.frontmatter.type, title: document.title, status: manifest.taxonomy_status }
  return {
    domain: {
      id: manifest.id,
      title: manifest.title,
      status: manifest.taxonomy_status,
      description: manifest.description,
      human_intent: manifest.human_intent
    },
    scope
  }
}

function relevantSource(value) {
  if (!value) return null
  return Object.fromEntries(['id', 'title', 'publisher', 'evidence_kind', 'published_or_version', 'status', 'superseded_by']
    .filter((key) => value[key] !== undefined)
    .map((key) => [key, value[key]]))
}

function evidenceValue(state, entryId) {
  return state.evidenceByEntryId.get(entryId)?.value ?? null
}

function reviewedArtifactState(state, document) {
  const sourceIds = [...new Set(document.references.map((reference) => reference.sourceId))].sort()
  return {
    path: document.path,
    taxonomy: relevantTaxonomy(state, document),
    content: presentedContent(document),
    sources: sourceIds.map((id) => relevantSource(state.sourceById.get(id)?.value)),
    evidence: document.entries.map((entry) => evidenceValue(state, entry.id)).filter(Boolean)
  }
}

function comparedValue(before, after, comparisonAvailable = true) {
  if (!comparisonAvailable) return { kind: 'not_evaluated', before: null, after }
  if (before === null && after !== null) return { kind: 'added', before: null, after }
  if (before !== null && after === null) return { kind: 'removed', before, after: null }
  if (canonicalize(before) === canonicalize(after)) return { kind: 'unchanged', before, after }
  return { kind: 'modified', before, after }
}

function semanticChanges(document, baselineDocument, comparisonAvailable) {
  const current = new Map(document.entries.map((entry) => [entry.id, presentedEntry(entry, document)]))
  const prior = new Map((baselineDocument?.entries ?? []).map((entry) => [entry.id, presentedEntry(entry, baselineDocument)]))
  const ids = [...new Set([...prior.keys(), ...current.keys()])]
  const principles = ids.map((id) => ({ id, ...comparedValue(prior.get(id) ?? null, current.get(id) ?? null, comparisonAvailable) }))
  return {
    document: comparedValue(
      baselineDocument ? { title: baselineDocument.title, introduction: baselineDocument.introduction } : null,
      { title: document.title, introduction: document.introduction },
      comparisonAvailable
    ),
    principles: comparisonAvailable ? principles.filter((item) => item.kind !== 'unchanged') : principles
  }
}

function sourceEffects(state, document, baselineState, baselineDocument) {
  const currentIds = new Set(document.references.map((reference) => reference.sourceId))
  const priorIds = new Set((baselineDocument?.references ?? []).map((reference) => reference.sourceId))
  const effects = [...new Set([...priorIds, ...currentIds])].sort().map((id) => ({
    id,
    ...comparedValue(
      priorIds.has(id) ? relevantSource(baselineState?.sourceById.get(id)?.value) : null,
      currentIds.has(id) ? relevantSource(state.sourceById.get(id)?.value) : null,
      Boolean(baselineState)
    )
  }))
  return baselineState ? effects.filter((item) => item.kind !== 'unchanged') : effects
}

function evidenceEffects(state, document, baselineState, baselineDocument) {
  const currentIds = new Set(document.entries.map((entry) => entry.id))
  const priorIds = new Set((baselineDocument?.entries ?? []).map((entry) => entry.id))
  const effects = [...new Set([...priorIds, ...currentIds])].map((id) => ({
    entry_id: id,
    ...comparedValue(
      priorIds.has(id) ? evidenceValue(baselineState, id) : null,
      currentIds.has(id) ? evidenceValue(state, id) : null,
      Boolean(baselineState)
    )
  }))
  return baselineState ? effects.filter((item) => item.kind !== 'unchanged') : effects
}

function artifactBinding(state, document) {
  return createHash('sha256').update(canonicalize(reviewedArtifactState(state, document)), 'utf8').digest('hex')
}

function furnishingTargets(manifest) {
  return [
    `domains/${manifest.id}/principles.md`,
    `domains/${manifest.id}/personal-growth.md`,
    ...manifest.subdomains.filter((subdomain) => subdomain.status === 'accepted').map((subdomain) => `domains/${manifest.id}/${subdomain.id}.md`)
  ]
}

function normalizeCheckpointDeclarations(root, validation, domain, declarations) {
  if (declarations?.version !== 1) throw new Error('Run-checkpoint declarations require version: 1')
  const allowed = new Set(['version', 'retrieved_sources', 'evidence_gaps', 'reviewed_artifacts', 'domain_review_complete', 'activation_package_path'])
  for (const key of Object.keys(declarations)) if (!allowed.has(key)) throw new Error(`Unknown run-checkpoint declaration ${key}`)
  const manifest = validation.state.manifests.find((item) => item.value.id === domain)?.value
  if (!manifest) throw new Error(`No domain manifest exists for ${domain}`)
  const targets = new Set(furnishingTargets(manifest))
  const retrievedSources = declarations.retrieved_sources ?? []
  if (!Array.isArray(retrievedSources) || retrievedSources.length > 2000) throw new Error('retrieved_sources must be an array with at most 2000 entries')
  for (const item of retrievedSources) {
    if (!item || typeof item.url !== 'string' || !Array.isArray(item.targets)) throw new Error('Each retrieved source requires url and targets')
    let url
    try { url = new URL(item.url) } catch { throw new Error(`Invalid retrieved source URL ${item.url}`) }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) throw new Error(`Unsafe retrieved source URL ${item.url}`)
    if (item.source_id !== null && item.source_id !== undefined && !validation.state.sourceById.has(item.source_id)) throw new Error(`Unknown checkpoint source ${item.source_id}`)
    for (const target of item.targets) if (!targets.has(target)) throw new Error(`Checkpoint source uses out-of-domain target ${target}`)
  }
  const evidenceGaps = declarations.evidence_gaps ?? []
  if (!Array.isArray(evidenceGaps) || evidenceGaps.length > 1000) throw new Error('evidence_gaps must be an array with at most 1000 entries')
  for (const gap of evidenceGaps) {
    if (!gap || !targets.has(gap.target) || typeof gap.description !== 'string' || gap.description.length < 1 || gap.description.length > 500) throw new Error('Each evidence gap requires an in-domain target and a description from 1 to 500 characters')
  }
  const reviewedArtifacts = declarations.reviewed_artifacts ?? []
  if (!Array.isArray(reviewedArtifacts) || new Set(reviewedArtifacts).size !== reviewedArtifacts.length) throw new Error('reviewed_artifacts must be a unique array')
  for (const path of reviewedArtifacts) {
    if (!targets.has(path) || !validation.state.corpus.documents.some((document) => document.path === path)) throw new Error(`Reviewed artifact is not a current furnishing target: ${path}`)
  }
  if (typeof declarations.domain_review_complete !== 'boolean') throw new Error('domain_review_complete must be boolean')
  const packagePath = declarations.activation_package_path ?? null
  const activationPackage = packagePath === null ? null : { path: packagePath, input_sha256: recordHash(root, packagePath) }
  return {
    version: 1,
    retrieved_sources: retrievedSources,
    evidence_gaps: evidenceGaps,
    reviewed_artifacts: reviewedArtifacts,
    domain_review_complete: declarations.domain_review_complete,
    activation_package: activationPackage
  }
}

export function buildRunCheckpoint(root, validation, domain, declarations) {
  const preparation = buildDomainPreparation(root, validation, domain)
  const normalized = normalizeCheckpointDeclarations(root, validation, domain, declarations)
  const taskScopeSha256 = createHash('sha256').update(canonicalize(preparation.task_scope.files), 'utf8').digest('hex')
  return {
    version: 1,
    generated_from: 'declared-progress-and-canonical-state',
    authority: 'Disposable coordination only; declarations are not evidence, semantic proof, approval, or canonical workflow state.',
    domain,
    declarations: normalized,
    bindings: { task_scope_sha256: taskScopeSha256, task_scope: preparation.task_scope }
  }
}

export function verifyRunCheckpoint(root, validation, checkpoint) {
  if (checkpoint?.version !== 1 || typeof checkpoint.domain !== 'string' || !checkpoint.bindings?.task_scope?.files) throw new Error('Invalid run checkpoint')
  const current = buildDomainPreparation(root, validation, checkpoint.domain).task_scope
  const before = new Map(checkpoint.bindings.task_scope.files.map((item) => [item.path, item.input_sha256]))
  const after = new Map(current.files.map((item) => [item.path, item.input_sha256]))
  const changed = [...new Set([...before.keys(), ...after.keys()])].sort().flatMap((path) => {
    if (!before.has(path)) return [{ path, kind: 'added' }]
    if (!after.has(path)) return [{ path, kind: 'removed' }]
    return before.get(path) === after.get(path) ? [] : [{ path, kind: 'modified' }]
  })
  const activationPackage = checkpoint.declarations?.activation_package
  if (activationPackage) {
    try {
      if (recordHash(root, activationPackage.path) !== activationPackage.input_sha256) changed.push({ path: activationPackage.path, kind: 'modified' })
    } catch { changed.push({ path: activationPackage.path, kind: 'removed' }) }
  }
  const currentSha256 = createHash('sha256').update(canonicalize(current.files), 'utf8').digest('hex')
  return {
    valid: changed.length === 0 && currentSha256 === checkpoint.bindings.task_scope_sha256,
    domain: checkpoint.domain,
    changed,
    authority: 'Binding verification only; valid does not establish semantic review quality or approval.'
  }
}

export function buildActivationPackage(validation, domain = null, baselineState = null) {
  const documents = validation.state.corpus.documents.filter((document) => document.frontmatter.status === 'draft' && (!domain || document.frontmatter.domain === domain))
  return {
    version: 2,
    generated_from: 'canonical-draft-state',
    decision: {
      gate: 'principle-activation',
      question: 'Approve activation of the reviewed semantic changes in these draft artifacts?',
      human_reviews: ['affected artifacts', 'semantic changes', 'taxonomy effects', 'source effects', 'evidence effects', 'semantic review findings, limitations, disagreement, and the activation decision'],
      fingerprints: 'Internal bindings only; humans approve the meaningful package, not hash values.'
    },
    transition_comparison: baselineState ? 'evaluated' : 'not_evaluated',
    source_usage: buildSourceUsage(validation.state, documents),
    artifacts: documents.map((document) => {
      const baselineDocument = baselineState?.corpus.documents.find((item) => item.path === document.path) ?? null
      const state = reviewedArtifactState(validation.state, document)
      return {
        path: document.path,
        semantic_changes: semanticChanges(document, baselineDocument, Boolean(baselineState)),
        taxonomy_effect: comparedValue(baselineDocument ? relevantTaxonomy(baselineState, baselineDocument) : null, state.taxonomy, Boolean(baselineState)),
        source_effects: sourceEffects(validation.state, document, baselineState, baselineDocument),
        evidence_effects: evidenceEffects(validation.state, document, baselineState, baselineDocument),
        reviewed_state: state,
        diagnostics: { semantic_sha256: document.semanticSha256, reviewed_state_sha256: artifactBinding(validation.state, document) }
      }
    }).sort((a, b) => a.path.localeCompare(b.path))
  }
}

export function buildActivationReview(activationPackage) {
  if (activationPackage?.version !== 2 || !Array.isArray(activationPackage.artifacts)) throw new Error('Activation review requires a version-2 activation package')
  const sourceEffects = new Map()
  const evidenceEffects = new Map()
  for (const artifact of activationPackage.artifacts) {
    for (const effect of artifact.source_effects ?? []) sourceEffects.set(`${effect.id}:${effect.kind}:${canonicalize(effect.after)}`, effect)
    for (const effect of artifact.evidence_effects ?? []) evidenceEffects.set(`${effect.entry_id}:${effect.kind}:${canonicalize(effect.after)}`, effect)
  }
  const changedPrinciples = activationPackage.artifacts.reduce((count, artifact) => count + (artifact.semantic_changes?.principles?.length ?? 0), 0)
  return {
    version: 1,
    generated_from: 'version-2-activation-package',
    decision: activationPackage.decision,
    transition_comparison: activationPackage.transition_comparison,
    summary: {
      artifacts: activationPackage.artifacts.length,
      changed_principles: changedPrinciples,
      unique_source_effects: sourceEffects.size,
      unique_evidence_effects: evidenceEffects.size
    },
    artifacts: activationPackage.artifacts.map((artifact) => ({
      path: artifact.path,
      semantic_changes: artifact.semantic_changes,
      taxonomy_effect: artifact.taxonomy_effect
    })),
    source_effects: [...sourceEffects.values()].sort((left, right) => left.id.localeCompare(right.id)),
    evidence_effects: [...evidenceEffects.values()].sort((left, right) => left.entry_id.localeCompare(right.entry_id)),
    source_usage: activationPackage.source_usage ?? null,
    reviewer_adds: ['semantic findings', 'source limitations', 'operational uncertainty', 'material disagreement', 'activation decision'],
    machine_binding_sha256: createHash('sha256').update(canonicalize(activationPackage), 'utf8').digest('hex'),
    authority: 'Human review aid only; the complete package remains the machine binding and the tool does not infer approval.'
  }
}

export function buildActivationManifest(activationPackage, reviewedAt, selectedPaths) {
  if (activationPackage?.version !== 2 || !Array.isArray(activationPackage.artifacts)) throw new Error('Activation manifest requires a version-2 activation package')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt ?? '')) throw new Error('Activation manifest requires reviewed_at in YYYY-MM-DD form')
  if (!Array.isArray(selectedPaths) || selectedPaths.length === 0 || new Set(selectedPaths).size !== selectedPaths.length) throw new Error('Activation manifest requires one or more unique selected paths')
  const artifactByPath = new Map(activationPackage.artifacts.map((artifact) => [artifact.path, artifact]))
  const approvedArtifacts = selectedPaths.map((path) => {
    const artifact = artifactByPath.get(path)
    if (!artifact) throw new Error(`Activation package does not contain ${path}`)
    const fingerprint = artifact.diagnostics?.reviewed_state_sha256
    if (!/^[a-f0-9]{64}$/.test(fingerprint ?? '')) throw new Error(`Activation package has no valid reviewed-state fingerprint for ${path}`)
    return { path, reviewed_state_sha256: fingerprint }
  })
  return { version: 2, reviewed_at: reviewedAt, approved_artifacts: approvedArtifacts }
}

export function applyActivationManifest(root, validation, manifest, validate) {
  if (manifest.version !== 2 || !/^\d{4}-\d{2}-\d{2}$/.test(manifest.reviewed_at ?? '') || !Array.isArray(manifest.approved_artifacts) || manifest.approved_artifacts.length === 0) throw new Error('Activation manifest requires version: 2, reviewed_at, and at least one approved_artifact')
  const approvedPaths = new Set()
  const changes = []
  for (const approval of manifest.approved_artifacts) {
    if (typeof approval.path !== 'string' || !/^[a-f0-9]{64}$/.test(approval.reviewed_state_sha256 ?? '')) throw new Error('Each approved_artifact requires path and reviewed_state_sha256')
    if (approvedPaths.has(approval.path)) throw new Error(`Activation manifest repeats ${approval.path}`)
    approvedPaths.add(approval.path)
    const document = validation.state.corpus.documents.find((item) => item.path === approval.path)
    if (!document || document.frontmatter.status !== 'draft') throw new Error(`${approval.path} is not a current draft`)
    if (artifactBinding(validation.state, document) !== approval.reviewed_state_sha256) throw new Error(`${approval.path} reviewed state changed after approval`)
    const original = readFileSync(safeResolve(root, approval.path), 'utf8')
    const content = original
      .replace(/^status: draft$/m, 'status: active')
      .replace(/^last_reviewed: null$/m, `last_reviewed: '${manifest.reviewed_at}'`)
      .replace(/^reviewed_content_sha256: null$/m, `reviewed_content_sha256: ${document.semanticSha256}`)
    changes.push({ path: approval.path, expected_sha256: fileSha256(root, approval.path), content })
  }
  applyRepositoryTransaction(root, changes, validate)
  return { activated: changes.map((change) => change.path) }
}

export { yaml }
