function targetParts(target) {
  const match = /^domains\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*\.md)$/.exec(target ?? '')
  if (!match || match[2] === 'README.md') throw new Error('Workflow target must be a corpus path domains/<domain>/<file>.md')
  const [, domain, filename] = match
  const universal = filename === 'principles.md' || filename === 'personal-growth.md'
  return { domain, filename, subdomain: universal ? null : filename.slice(0, -3), universal }
}

function findManifest(state, domain) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(domain ?? '')) throw new Error('Workflow domain must be a domain ID')
  const manifest = state.manifests.find((item) => item.value.id === domain)?.value
  if (!manifest) throw new Error(`No domain manifest exists for ${domain}`)
  return manifest
}

function contentState(state, path) {
  const document = state.corpus.documents.find((item) => item.path === path)
  return document
    ? { state: document.frontmatter.status, semantic_sha256: document.semanticSha256 }
    : { state: 'absent', semantic_sha256: null }
}

export function inspectOutcomeWorkflow(state, target) {
  const parsed = targetParts(target)
  const manifest = findManifest(state, parsed.domain)
  const subdomain = parsed.subdomain ? manifest.subdomains.find((item) => item.id === parsed.subdomain) : null
  if (parsed.subdomain && !subdomain) throw new Error(`Subdomain ${parsed.domain}/${parsed.subdomain} is not registered`)
  const document = state.corpus.documents.find((item) => item.path === target)
  const autonomousSteps = []
  const humanGates = []
  let nextAction

  if (manifest.taxonomy_status !== 'accepted') {
    autonomousSteps.push('research-target-fit-and-accept-unchanged-requested-scope')
    nextAction = autonomousSteps[0]
  } else if (subdomain && subdomain.status !== 'accepted') {
    autonomousSteps.push('research-target-fit-and-accept-unchanged-requested-scope')
    nextAction = autonomousSteps[0]
  } else if (!document) {
    autonomousSteps.push('research-and-create-content-draft')
    nextAction = autonomousSteps[0]
  } else if (document.frontmatter.status === 'draft') {
    autonomousSteps.push('complete-semantic-and-adversarial-content-review')
    humanGates.push('approve-exact-principles-for-activation')
    nextAction = autonomousSteps[0]
  } else {
    nextAction = 'outcome-satisfied'
  }

  return {
    schema_version: 1,
    outcome: 'create-or-complete-content',
    target,
    authorization: {
      prerequisite_workflows: 'authorized-by-outcome-request',
      draft_generation_after_taxonomy_acceptance: 'authorized-by-outcome-request',
      unchanged_registered_target: 'authorized-by-explicit-target-request',
      new_or_changed_taxonomy_and_unseen_principles: 'not-preapproved'
    },
    taxonomy: {
      domain: parsed.domain,
      domain_status: manifest.taxonomy_status,
      target_kind: parsed.universal ? 'universal' : 'subdomain',
      subdomain: parsed.subdomain,
      subdomain_status: subdomain?.status ?? null
    },
    content: document ? { state: document.frontmatter.status, semantic_sha256: document.semanticSha256 } : { state: 'absent', semantic_sha256: null },
    autonomous_steps: autonomousSteps,
    human_gates: humanGates,
    next_action: nextAction
  }
}

export function inspectDomainFurnishingWorkflow(state, domain) {
  const manifest = findManifest(state, domain)
  const required = new Set(manifest.human_intent?.required_subdomains ?? [])
  const targets = [
    { path: `domains/${domain}/principles.md`, kind: 'universal', scope: 'principles', taxonomy_status: manifest.taxonomy_status === 'accepted' ? 'accepted' : 'pending-domain-acceptance' },
    { path: `domains/${domain}/personal-growth.md`, kind: 'universal', scope: 'personal-growth', taxonomy_status: manifest.taxonomy_status === 'accepted' ? 'accepted' : 'pending-domain-acceptance' }
  ]

  for (const subdomain of manifest.subdomains) {
    if (subdomain.status === 'accepted' || required.has(subdomain.id)) {
      targets.push({
        path: `domains/${domain}/${subdomain.id}.md`,
        kind: 'subdomain',
        scope: subdomain.id,
        taxonomy_status: subdomain.status === 'accepted' ? 'accepted' : 'pending-required-domain-acceptance'
      })
    }
  }

  for (const target of targets) Object.assign(target, contentState(state, target.path))

  const proposedCandidates = manifest.subdomains
    .filter((subdomain) => subdomain.status === 'proposed' && !required.has(subdomain.id))
    .map(({ id, title }) => ({ id, title }))
  const deprecatedScopes = manifest.subdomains.filter((subdomain) => subdomain.status === 'deprecated').map((subdomain) => subdomain.id)
  const summary = Object.fromEntries(['absent', 'draft', 'active'].map((status) => [status, targets.filter((target) => target.state === status).length]))
  const autonomousSteps = []

  if (manifest.taxonomy_status !== 'accepted') autonomousSteps.push('research-target-fit-and-accept-unchanged-requested-domain')
  if (proposedCandidates.length > 0) autonomousSteps.push('evaluate-registered-proposed-subdomains-for-safe-unchanged-acceptance-or-skip')
  if (summary.absent > 0) autonomousSteps.push('run-create-content-for-missing-furnishing-targets')
  if (summary.draft > 0) autonomousSteps.push('complete-per-file-semantic-and-adversarial-review')
  autonomousSteps.push('run-domain-cross-file-consistency-and-quality-review')

  const humanGates = summary.draft > 0 ? ['approve-exact-domain-principle-package-for-activation'] : []

  return {
    schema_version: 1,
    outcome: 'fully-furnish-domain',
    target: domain,
    authorization: {
      prerequisite_workflows: 'authorized-by-outcome-request',
      unchanged_registered_domain: 'authorized-after-agent-research-confirms-fit',
      unchanged_registered_candidate_scope: 'authorized-after-agent-research-confirms-fit',
      draft_generation_for_furnishing_set: 'authorized-by-outcome-request',
      new_or_changed_taxonomy_protected_intent_and_unseen_principles: 'not-preapproved'
    },
    taxonomy: {
      domain,
      domain_status: manifest.taxonomy_status,
      proposed_candidates: proposedCandidates,
      deprecated_scopes: deprecatedScopes
    },
    content: { targets, summary },
    delegated_content_workflow: 'docs/workflows/create-content.md',
    autonomous_steps: autonomousSteps,
    human_gates: humanGates,
    anticipated_human_gates: summary.absent > 0 ? ['approve-exact-domain-principle-package-for-activation'] : humanGates,
    conditional_human_gates: ['new-or-materially-changed-taxonomy-or-protected-intent', 'unresolved-material-disagreement'],
    next_action: autonomousSteps[0]
  }
}

export function formatWorkflowStatus(status) {
  if (status.outcome === 'fully-furnish-domain') {
    const summary = status.content.summary
    const lines = [
      `Domain: ${status.target}`,
      `Taxonomy: domain=${status.taxonomy.domain_status}, proposed candidates=${status.taxonomy.proposed_candidates.length}`,
      `Furnishing targets: active=${summary.active}, draft=${summary.draft}, absent=${summary.absent}`,
      `Next action: ${status.next_action}`,
      `Agent-owned: ${status.autonomous_steps.join(', ')}`
    ]
    if (status.human_gates.length) lines.push(`Human gate: ${status.human_gates.join(', ')}`)
    return `${lines.join('\n')}\n`
  }
  const lines = [
    `Target: ${status.target}`,
    `Taxonomy: domain=${status.taxonomy.domain_status}${status.taxonomy.subdomain ? `, subdomain=${status.taxonomy.subdomain_status}` : ''}`,
    `Content: ${status.content.state}`,
    `Next action: ${status.next_action}`
  ]
  if (status.autonomous_steps.length) lines.push(`Agent-owned: ${status.autonomous_steps.join(', ')}`)
  if (status.human_gates.length) lines.push(`Human gate: ${status.human_gates.join(', ')}`)
  return `${lines.join('\n')}\n`
}
