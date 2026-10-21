import { createHash } from 'node:crypto'

function citedSourceIds(document, claims) {
  const mapping = new Map(document.references.map((reference) => [reference.label, reference.sourceId]))
  return [...new Set(claims.flatMap((claim) => claim.citationLabels).map((label) => {
    const id = mapping.get(label)
    if (!id) throw new Error(`Unresolved context citation ${document.frontmatter.id}:${label}`)
    return id
  }))]
}

function namespaceText(text, document, claim) {
  const namespace = document.frontmatter.id
  const citations = claim.citationLabels.map((label) => `[${namespace}:${label}]`).join(', ')
  return citations ? `${text} ${citations}` : text
}

function claimView(document, claim) {
  return {
    role: claim.role,
    text: namespaceText(claim.text, document, claim),
    claim_sha256: claim.claimSha256,
    source_ids: citedSourceIds(document, [claim])
  }
}

export function buildContext({ documents, entryById, sourceById, evidenceByEntryId, evaluatorConfigs = new Map(), profile, fileIds = [], principleIds = [], revision, generatedAt = null, expectedInputSha256 = null }) {
  if (!['minimal', 'standard', 'learning', 'verification'].includes(profile)) throw new Error(`Unsupported context profile ${profile}`)
  if (typeof revision !== 'string' || !revision.trim()) throw new Error('Context generation requires an explicit source revision')
  for (const id of fileIds) {
    if (!documents.some((document) => [document.frontmatter.id, document.path].includes(id))) throw new Error(`Unknown context file ${id}`)
  }
  const selected = new Map()
  for (const document of documents) {
    if (fileIds.includes(document.frontmatter.id) || fileIds.includes(document.path)) {
      for (const entry of document.entries) selected.set(entry.id, { document, entry })
    }
  }
  for (const id of principleIds) {
    const resolved = entryById.get(id)
    if (!resolved) throw new Error(`Unknown principle ID ${id}`)
    selected.set(id, resolved)
  }
  if (selected.size === 0) throw new Error('Context generation requires at least one file or principle selection')
  const inputs = new Map()
  function recordInput(path, sha256) {
    if (!path || !/^[a-f0-9]{64}$/.test(sha256 ?? '')) throw new Error(`Missing or invalid context input ${path ?? '<missing path>'}`)
    if (inputs.has(path) && inputs.get(path).sha256 !== sha256) throw new Error(`Conflicting context input ${path}`)
    inputs.set(path, { path, sha256 })
  }
  const entries = [...selected.values()].sort((a, b) => a.entry.id.localeCompare(b.entry.id)).map(({ document, entry }) => {
    if (!['draft', 'active'].includes(document.frontmatter.status)) throw new Error(`Unsupported corpus status ${document.frontmatter.status} for ${document.path}`)
    const allClaims = entry.claims
    const result = {
      id: entry.id,
      title: entry.title,
      file_id: document.frontmatter.id,
      file_path: document.path,
      status: document.frontmatter.status,
      last_reviewed: document.frontmatter.last_reviewed,
      reviewed_content_sha256: document.frontmatter.reviewed_content_sha256,
      input_sha256: document.inputSha256,
      statement: claimView(document, entry.statement),
      source_ids: citedSourceIds(document, allClaims)
    }
    recordInput(document.path, document.inputSha256)
    result.source_inputs = result.source_ids.map((id) => {
      const source = sourceById.get(id)
      if (!source?.value) throw new Error(`Missing context source ${id}`)
      if (source.value.id !== id) throw new Error(`Context source identity mismatch for ${id}`)
      if (!['active', 'moved', 'superseded', 'withdrawn', 'unavailable'].includes(source.value.status)) throw new Error(`Unsupported source status ${source.value.status} for ${id}`)
      recordInput(source.path, source.inputSha256)
      return { id, status: source.value.status, path: source.path, input_sha256: source.inputSha256 }
    })
    result.references = document.references.filter((reference) => result.source_ids.includes(reference.sourceId)).map((reference) => ({ label: `${document.frontmatter.id}:${reference.label}`, source_id: reference.sourceId, title: reference.title }))
    // Bind the same complete workset across profiles so a minimal selection can
    // be fetched at verification depth without silently substituting new inputs.
    const evidence = evidenceByEntryId.get(entry.id)
    if (evidence) recordInput(evidence.path, evidence.inputSha256)
    const configurationRef = evidence?.value?.reviewer?.configuration?.configuration_ref
    const configuration = configurationRef ? evaluatorConfigs.get(configurationRef) : null
    if (configurationRef && !configuration) throw new Error(`Missing context evaluator configuration ${configurationRef}`)
    if (configuration) recordInput(configuration.path, configuration.inputSha256)
    if (profile !== 'minimal') {
      result.why = entry.why.map((claim) => claimView(document, claim))
      result.practices = entry.practices.map((claim) => claimView(document, claim))
      result.applicability = entry.applicability.map((claim) => claimView(document, claim))
    }
    if (profile === 'learning' || profile === 'verification') {
      result.goals = entry.goals.map((claim) => claimView(document, claim))
      result.tags = entry.tags
    }
    if (profile === 'verification') {
      result.sources = result.source_ids.map((id) => sourceById.get(id)?.value).filter(Boolean)
      result.evidence = evidence?.value ?? null
    }
    return result
  })
  const boundInputs = [...inputs.values()].sort((a, b) => a.path.localeCompare(b.path))
  const inputSha256 = createHash('sha256').update(JSON.stringify({
    source_revision: revision,
    inputs: boundInputs,
    selection: entries.map((entry) => ({ id: entry.id, file_id: entry.file_id }))
  }), 'utf8').digest('hex')
  if (expectedInputSha256 !== null && expectedInputSha256 !== inputSha256) throw new Error(`Stale context input digest: expected ${expectedInputSha256}, got ${inputSha256}`)
  return {
    schema_version: 2,
    usage: profile === 'minimal' ? 'reference-only' : 'qualified-guidance',
    omitted_sections: [
      ...(profile === 'minimal' ? ['why', 'practices', 'applicability'] : []),
      ...(['minimal', 'standard'].includes(profile) ? ['goals', 'tags'] : []),
      ...(profile !== 'verification' ? ['sources', 'evidence'] : [])
    ],
    input_sha256: inputSha256,
    profile,
    source_revision: revision,
    filters: {
      files: [...new Set(fileIds)].sort(),
      principles: [...new Set(principleIds)].sort()
    },
    ...(generatedAt ? { generated_at: generatedAt } : {}),
    inputs: boundInputs,
    entries
  }
}
