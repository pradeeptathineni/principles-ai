function citedSourceIds(document, claims) {
  const mapping = new Map(document.references.map((reference) => [reference.label, reference.sourceId]))
  return [...new Set(claims.flatMap((claim) => claim.citationLabels).map((label) => mapping.get(label)).filter(Boolean))]
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

export function buildContext({ documents, entryById, sourceById, evidenceByEntryId, evaluatorConfigs = new Map(), profile, fileIds = [], principleIds = [], revision, generatedAt = null }) {
  if (!['minimal', 'standard', 'learning', 'verification'].includes(profile)) throw new Error(`Unsupported context profile ${profile}`)
  if (!revision) throw new Error('Context generation requires an explicit source revision')
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
    if (path && sha256) inputs.set(path, { path, sha256 })
  }
  const entries = [...selected.values()].sort((a, b) => a.entry.id.localeCompare(b.entry.id)).map(({ document, entry }) => {
    const allClaims = entry.claims
    const result = {
      id: entry.id,
      title: entry.title,
      file_id: document.frontmatter.id,
      file_path: document.path,
      input_sha256: document.inputSha256,
      statement: claimView(document, entry.statement),
      source_ids: citedSourceIds(document, allClaims)
    }
    recordInput(document.path, document.inputSha256)
    if (profile !== 'minimal') {
      result.why = entry.why.map((claim) => claimView(document, claim))
      result.practices = entry.practices.map((claim) => claimView(document, claim))
      result.applicability = entry.applicability.map((claim) => claimView(document, claim))
    }
    if (profile === 'learning' || profile === 'verification') {
      result.goals = entry.goals.map((claim) => claimView(document, claim))
      result.tags = entry.tags
      result.references = document.references.filter((reference) => result.source_ids.includes(reference.sourceId)).map((reference) => ({ label: `${document.frontmatter.id}:${reference.label}`, source_id: reference.sourceId, title: reference.title }))
    }
    if (profile === 'verification') {
      result.sources = result.source_ids.map((id) => sourceById.get(id)?.value).filter(Boolean)
      for (const id of result.source_ids) {
        const source = sourceById.get(id)
        recordInput(source?.path, source?.inputSha256)
      }
      const evidence = evidenceByEntryId.get(entry.id)
      result.evidence = evidence?.value ?? null
      recordInput(evidence?.path, evidence?.inputSha256)
      for (const review of evidence?.value?.claims ?? []) {
        const configurationRef = review.reviewer?.configuration?.configuration_ref
        const configuration = configurationRef ? evaluatorConfigs.get(configurationRef) : null
        recordInput(configuration?.path, configuration?.inputSha256)
      }
    }
    return result
  })
  return {
    schema_version: 1,
    profile,
    source_revision: revision,
    filters: {
      files: [...new Set(fileIds)].sort(),
      principles: [...new Set(principleIds)].sort()
    },
    ...(generatedAt ? { generated_at: generatedAt } : {}),
    inputs: [...inputs.values()].sort((a, b) => a.path.localeCompare(b.path)),
    entries
  }
}
