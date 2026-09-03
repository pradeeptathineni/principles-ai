import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { safeResolve } from './repository.js'
import {
  AGENT_ACTION_IDS,
  DETERMINISTIC_GATE_IDS,
  MANUAL_ONLY_GATE_IDS,
  SEMANTIC_GATE_IDS,
  TERMINAL_ACTION_IDS,
  WORKFLOW_ACTIONS,
  WORKFLOW_GATES
} from './workflow-contract.js'

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
  const document = state.corpus.documents.find((item) => item.path === target)
  const autonomousSteps = []
  const humanGates = []
  let nextAction

  if (parsed.subdomain && !subdomain) {
    autonomousSteps.push(WORKFLOW_ACTIONS.prepareNewSubdomain)
    humanGates.push(WORKFLOW_GATES.taxonomyAddition)
    if (manifest.taxonomy_status === 'deprecated') humanGates.push(WORKFLOW_GATES.taxonomyReactivation)
    nextAction = autonomousSteps[0]
  } else if (manifest.taxonomy_status === 'deprecated') {
    autonomousSteps.push(WORKFLOW_ACTIONS.prepareDomainReactivation)
    humanGates.push(WORKFLOW_GATES.taxonomyReactivation)
    nextAction = autonomousSteps[0]
  } else if (subdomain?.status === 'deprecated') {
    autonomousSteps.push(WORKFLOW_ACTIONS.prepareSubdomainReactivation)
    humanGates.push(WORKFLOW_GATES.taxonomyReactivation)
    nextAction = autonomousSteps[0]
  } else if (manifest.taxonomy_status === 'proposed') {
    autonomousSteps.push(WORKFLOW_ACTIONS.acceptRequestedScope)
    nextAction = autonomousSteps[0]
  } else if (subdomain?.status === 'proposed') {
    autonomousSteps.push(WORKFLOW_ACTIONS.acceptRequestedScope)
    nextAction = autonomousSteps[0]
  } else if (!document) {
    autonomousSteps.push(WORKFLOW_ACTIONS.createContentDraft)
    nextAction = autonomousSteps[0]
  } else if (document.frontmatter.status === 'draft') {
    autonomousSteps.push(WORKFLOW_ACTIONS.reviewContent)
    humanGates.push(WORKFLOW_GATES.principleActivation)
    nextAction = autonomousSteps[0]
  } else {
    nextAction = WORKFLOW_ACTIONS.outcomeSatisfied
  }

  return {
    schema_version: 3,
    outcome: 'create-or-complete-content',
    target,
    authorization: {
      prerequisite_workflows: 'authorized-by-outcome-request',
      draft_generation_after_taxonomy_acceptance: 'authorized-by-outcome-request',
      unchanged_proposed_registered_target: 'authorized-by-explicit-target-request-after-independent-fit-research',
      taxonomy_addition_definition_change_deprecation_or_reactivation: 'requires-exact-human-decision',
      unseen_principles: 'not-preapproved'
    },
    taxonomy: {
      domain: parsed.domain,
      domain_status: manifest.taxonomy_status,
      target_kind: parsed.universal ? 'universal' : 'subdomain',
      subdomain: parsed.subdomain,
      subdomain_description: subdomain?.description ?? null,
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
    .map(({ id, title, description }) => ({ id, title, description }))
  const deprecatedScopes = manifest.subdomains.filter((subdomain) => subdomain.status === 'deprecated').map((subdomain) => subdomain.id)
  const summary = Object.fromEntries(['absent', 'draft', 'active'].map((status) => [status, targets.filter((target) => target.state === status).length]))
  const autonomousSteps = []

  const humanGates = []
  const domainDeprecated = manifest.taxonomy_status === 'deprecated'

  if (domainDeprecated) {
    autonomousSteps.push(WORKFLOW_ACTIONS.prepareDomainReactivation)
    humanGates.push(WORKFLOW_GATES.taxonomyReactivation)
  } else {
    if (manifest.taxonomy_status === 'proposed') autonomousSteps.push(WORKFLOW_ACTIONS.acceptRequestedDomain)
    if (proposedCandidates.length > 0) autonomousSteps.push(WORKFLOW_ACTIONS.evaluateProposedSubdomains)
    if (summary.absent > 0) autonomousSteps.push(WORKFLOW_ACTIONS.createMissingTargets)
    if (summary.draft > 0) autonomousSteps.push(WORKFLOW_ACTIONS.reviewDraftTargets)
    if (autonomousSteps.length > 0) autonomousSteps.push(WORKFLOW_ACTIONS.reviewDomainConsistency)
  }

  if (!domainDeprecated && summary.draft > 0) humanGates.push(WORKFLOW_GATES.principleActivation)

  return {
    schema_version: 3,
    outcome: 'fully-furnish-domain',
    target: domain,
    authorization: {
      prerequisite_workflows: 'authorized-by-outcome-request',
      unchanged_proposed_registered_domain: 'authorized-after-independent-research-confirms-fit',
      unchanged_proposed_registered_candidate_scope: 'authorized-after-independent-research-confirms-fit',
      draft_generation_for_furnishing_set: 'authorized-by-outcome-request',
      taxonomy_addition_definition_change_deprecation_reactivation_protected_intent_and_unseen_principles: 'not-preapproved'
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
    anticipated_human_gates: !domainDeprecated && summary.absent > 0 ? [WORKFLOW_GATES.principleActivation] : humanGates,
    conditional_human_gates: ['taxonomy-addition', 'taxonomy-definition-change', 'taxonomy-deprecation', 'taxonomy-reactivation', 'protected-intent-change', 'unresolved-material-disagreement'],
    next_action: autonomousSteps[0] ?? WORKFLOW_ACTIONS.outcomeSatisfied
  }
}

export function inspectDomainRefinementWorkflow(state, domain) {
  const furnishing = inspectDomainFurnishingWorkflow(state, domain)
  const domainDeprecated = furnishing.taxonomy.domain_status === 'deprecated'
  const prerequisiteSteps = furnishing.autonomous_steps.filter((action) => action !== WORKFLOW_ACTIONS.reviewDomainConsistency)
  const autonomousSteps = domainDeprecated
    ? prerequisiteSteps
    : [...prerequisiteSteps, WORKFLOW_ACTIONS.refineDomainTargets, WORKFLOW_ACTIONS.reviewDomainConsistency]

  return {
    ...furnishing,
    outcome: 'refine-domain-content',
    authorization: {
      prerequisite_workflows: 'authorized-by-outcome-request',
      renewed_selection_for_all_domain_targets: 'authorized-by-outcome-request',
      unchanged_active_targets: 'remain-active-after-explicit-subject-based-sufficiency-disposition',
      taxonomy_addition_definition_change_deprecation_reactivation_protected_intent_and_unseen_or_changed_principles: 'not-preapproved'
    },
    delegated_content_workflow: 'docs/workflows/update-content.md',
    selection_refresh: {
      target_scope: 'all-universal-and-accepted-subdomain-files',
      active_status_proves_coverage: false,
      stages: ['candidate-discovery', 'coverage-analysis', 'candidate-comparison-and-consolidation', 'final-selection'],
      completion_record: 'disposable-per-target-semantic-dispositions'
    },
    autonomous_steps: autonomousSteps,
    anticipated_human_gates: furnishing.content.summary.draft > 0 ? [WORKFLOW_GATES.principleActivation] : [],
    conditional_human_gates: [...new Set([...furnishing.conditional_human_gates, WORKFLOW_GATES.principleActivation])],
    next_action: autonomousSteps[0] ?? WORKFLOW_ACTIONS.outcomeSatisfied
  }
}

export function inspectNewDomainWorkflow(state, domain) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(domain ?? '')) throw new Error('Workflow domain must be a domain ID')
  const manifest = state.manifests.find((item) => item.value.id === domain)?.value
  if (!manifest) {
    return {
      schema_version: 3,
      outcome: 'create-domain',
      target: domain,
      route: 'docs/workflows/create-domain.md',
      autonomous_steps: [WORKFLOW_ACTIONS.prepareNewDomain],
      human_gates: [WORKFLOW_GATES.taxonomyAddition],
      next_action: WORKFLOW_ACTIONS.prepareNewDomain
    }
  }
  if (manifest.taxonomy_status === 'deprecated') {
    return {
      schema_version: 3,
      outcome: 'create-domain',
      target: domain,
      route: 'docs/workflows/create-domain.md',
      autonomous_steps: [WORKFLOW_ACTIONS.prepareDomainReactivation],
      human_gates: [WORKFLOW_GATES.taxonomyReactivation],
      next_action: WORKFLOW_ACTIONS.prepareDomainReactivation
    }
  }
  const autonomousSteps = manifest.taxonomy_status === 'proposed' ? [WORKFLOW_ACTIONS.acceptRequestedDomain] : []
  return {
    schema_version: 3,
    outcome: 'create-domain',
    target: domain,
    route: 'docs/workflows/create-domain.md',
    autonomous_steps: autonomousSteps,
    human_gates: [],
    next_action: autonomousSteps[0] ?? WORKFLOW_ACTIONS.outcomeSatisfied
  }
}

export function inspectRoutedOutcome(validationPolicy, outcome, selectors = {}) {
  const definition = validationPolicy?.workflow_model?.outcomes?.find((item) => item.id === outcome)
  if (!definition) throw new Error(`Unsupported workflow outcome ${outcome}`)
  return {
    schema_version: 3,
    outcome,
    target: selectors.target ?? selectors.domain ?? null,
    route: definition.route,
    inspector: definition.inspector,
    ownership: validationPolicy.workflow_model.defaults,
    autonomous_steps: [WORKFLOW_ACTIONS.followCanonicalRoute],
    human_gates: [],
    next_action: WORKFLOW_ACTIONS.followCanonicalRoute
  }
}

export function validateWorkflowStatus(status, validationPolicy) {
  const model = validationPolicy?.workflow_model
  if (status?.schema_version !== 3) throw new Error('Workflow report must use schema version 3')
  if (!(model?.outcomes ?? []).some((item) => item.id === status.outcome)) throw new Error(`Workflow report uses unsupported outcome ${status?.outcome}`)
  const actions = new Set([...(model.action_ids?.agent ?? []), ...(model.action_ids?.terminal ?? [])])
  const gates = new Set([
    ...(validationPolicy.classes?.human_approval?.gates?.deterministic ?? []),
    ...(validationPolicy.classes?.human_approval?.gates?.semantic ?? []),
    ...(validationPolicy.classes?.human_approval?.gates?.manual_only ?? [])
  ])
  for (const action of [...(status.autonomous_steps ?? []), status.next_action]) {
    if (!actions.has(action)) throw new Error(`Workflow report uses unknown action ${action}`)
  }
  for (const gate of [...(status.human_gates ?? []), ...(status.anticipated_human_gates ?? []), ...(status.conditional_human_gates ?? [])]) {
    if (!gates.has(gate)) throw new Error(`Workflow report uses unknown human gate ${gate}`)
  }
  if (status.next_action === model.defaults.terminal_action && ((status.autonomous_steps?.length ?? 0) > 0 || (status.human_gates?.length ?? 0) > 0)) {
    throw new Error('Terminal workflow report cannot retain actions or human gates')
  }
  return status
}

export function validateWorkflowModel(root, validationPolicy, bag) {
  const model = validationPolicy?.workflow_model
  if (!model) {
    bag.error('WORKFLOW_MODEL_MISSING', 'Canonical workflow model is required.', 'config/validation.yaml')
    return
  }
  const configuredAgentActions = model.action_ids?.agent ?? []
  const configuredTerminalActions = model.action_ids?.terminal ?? []
  const configuredActions = [...configuredAgentActions, ...configuredTerminalActions]
  if (new Set(configuredActions).size !== configuredActions.length || configuredActions.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))) {
    bag.error('WORKFLOW_ACTION_ID', 'Workflow action identifiers must be unique canonical kebab-case values.', 'config/validation.yaml')
  }
  if ([...configuredAgentActions].sort().join('\n') !== [...AGENT_ACTION_IDS].sort().join('\n') ||
      [...configuredTerminalActions].sort().join('\n') !== [...TERMINAL_ACTION_IDS].sort().join('\n')) {
    bag.error('WORKFLOW_ACTION_DRIFT', 'Configured workflow actions do not match actions used by workflow implementation.', 'config/validation.yaml')
  }
  const configuredDeterministicGates = validationPolicy.classes?.human_approval?.gates?.deterministic ?? []
  const configuredSemanticGates = validationPolicy.classes?.human_approval?.gates?.semantic ?? []
  const configuredManualGates = validationPolicy.classes?.human_approval?.gates?.manual_only ?? []
  const configuredGates = [...configuredDeterministicGates, ...configuredSemanticGates, ...configuredManualGates]
  if (new Set(configuredGates).size !== configuredGates.length || configuredGates.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))) {
    bag.error('WORKFLOW_GATE_ID', 'Workflow gate identifiers must be unique canonical kebab-case values.', 'config/validation.yaml')
  }
  if ([...configuredDeterministicGates].sort().join('\n') !== [...DETERMINISTIC_GATE_IDS].sort().join('\n') ||
      [...configuredSemanticGates].sort().join('\n') !== [...SEMANTIC_GATE_IDS].sort().join('\n') ||
      [...configuredManualGates].sort().join('\n') !== [...MANUAL_ONLY_GATE_IDS].sort().join('\n')) {
    bag.error('WORKFLOW_GATE_DRIFT', 'Configured human-gate identifiers do not match identifiers used by implementation.', 'config/validation.yaml')
  }

  const routes = [...(model.outcomes ?? []).map((item) => item.route), ...(model.supporting_routes ?? [])]
  for (const route of routes) {
    try { safeResolve(root, route) } catch { bag.error('WORKFLOW_ROUTE_MISSING', `Configured workflow route does not exist or is unsafe: ${route}.`, 'config/validation.yaml') }
  }
  const workflowDirectory = join(root, 'docs', 'workflows')
  for (const entry of readdirSync(workflowDirectory, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const route = `docs/workflows/${entry.name}`
      if (!routes.includes(route)) bag.error('WORKFLOW_ROUTE_ORPHAN', `Workflow has no outcome or supporting route: ${route}.`, route)
    }
  }
  for (const outcome of model.outcomes ?? []) {
    if (!outcome.id || !outcome.route || !outcome.inspector) bag.error('WORKFLOW_OUTCOME_INCOMPLETE', 'Every modeled outcome requires an ID, route, and inspector classification.', 'config/validation.yaml')
  }
  if (model.defaults?.terminal_action !== WORKFLOW_ACTIONS.outcomeSatisfied) {
    bag.error('WORKFLOW_TERMINAL_DRIFT', 'Workflow model terminal action does not match implementation.', 'config/validation.yaml')
  }
}

export function formatWorkflowStatus(status) {
  if (status.route) {
    const lines = [
      `Outcome: ${status.outcome}`,
      `Target: ${status.target ?? '<repository>'}`,
      `Route: ${status.route}`,
      `Next action: ${status.next_action}`
    ]
    if (status.human_gates.length) lines.push(`Human gate: ${status.human_gates.join(', ')}`)
    return `${lines.join('\n')}\n`
  }
  if (['fully-furnish-domain', 'refine-domain-content'].includes(status.outcome)) {
    const summary = status.content.summary
    const label = status.outcome === 'refine-domain-content' ? 'Refinement targets' : 'Furnishing targets'
    const lines = [
      `Domain: ${status.target}`,
      `Taxonomy: domain=${status.taxonomy.domain_status}, proposed candidates=${status.taxonomy.proposed_candidates.length}`,
      `${label}: active=${summary.active}, draft=${summary.draft}, absent=${summary.absent}`,
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
