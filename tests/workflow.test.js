import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parse } from 'yaml'
import {
  inspectDomainFurnishingWorkflow,
  inspectDomainRefinementWorkflow,
  inspectNewDomainWorkflow,
  inspectOutcomeWorkflow,
  inspectRoutedOutcome,
  validateWorkflowModel,
  validateWorkflowStatus
} from '../src/workflow.js'
import { DiagnosticBag } from '../src/diagnostics.js'

const validationPolicy = parse(readFileSync('config/validation.yaml', 'utf8'))

function state(domainStatus, subdomainStatus, contentStatus = null) {
  return {
    manifests: [{ value: {
      id: 'coding', taxonomy_status: domainStatus,
      subdomains: [{ id: 'design', description: 'Coding design decisions and practices.', status: subdomainStatus }]
    } }],
    corpus: { documents: contentStatus ? [{ path: 'domains/coding/design.md', frontmatter: { status: contentStatus }, semanticSha256: 'a'.repeat(64) }] : [] }
  }
}

test('workflow inspection advances through autonomous prerequisites and genuine gates', () => {
  assert.equal(inspectOutcomeWorkflow(state('accepted', 'accepted'), 'domains/coding/design.md').schema_version, 3)
  assert.equal(inspectOutcomeWorkflow(state('proposed', 'proposed'), 'domains/coding/design.md').next_action, 'research-target-fit-and-accept-unchanged-requested-scope')
  assert.equal(inspectOutcomeWorkflow(state('accepted', 'proposed'), 'domains/coding/design.md').next_action, 'research-target-fit-and-accept-unchanged-requested-scope')
  assert.equal(inspectOutcomeWorkflow(state('accepted', 'accepted'), 'domains/coding/design.md').next_action, 'research-and-create-content-draft')
  assert.equal(inspectOutcomeWorkflow(state('accepted', 'accepted'), 'domains/coding/design.md').taxonomy.subdomain_description, 'Coding design decisions and practices.')
  assert.deepEqual(inspectOutcomeWorkflow(state('accepted', 'accepted', 'draft'), 'domains/coding/design.md').human_gates, ['principle-activation'])
  assert.equal(inspectOutcomeWorkflow(state('accepted', 'accepted', 'active'), 'domains/coding/design.md').next_action, 'outcome-satisfied')
})

test('workflow inspection distinguishes new and deprecated targets from routine proposed acceptance', () => {
  const deprecated = inspectOutcomeWorkflow(state('accepted', 'deprecated'), 'domains/coding/design.md')
  assert.equal(deprecated.next_action, 'independently-research-and-prepare-subdomain-reactivation-decision')
  assert.deepEqual(deprecated.human_gates, ['taxonomy-reactivation'])

  const missing = inspectOutcomeWorkflow(state('accepted', 'accepted'), 'domains/coding/new-scope.md')
  assert.equal(missing.next_action, 'independently-research-and-prepare-new-subdomain-definition')
  assert.deepEqual(missing.human_gates, ['taxonomy-addition'])

  const routine = inspectOutcomeWorkflow(state('accepted', 'proposed'), 'domains/coding/design.md')
  assert.deepEqual(routine.human_gates, [])
})

test('outcome authorization covers prerequisites but not unseen semantics', () => {
  const result = inspectOutcomeWorkflow(state('proposed', 'proposed'), 'domains/coding/design.md')
  assert.equal(result.authorization.prerequisite_workflows, 'authorized-by-outcome-request')
  assert.equal(result.authorization.draft_generation_after_taxonomy_acceptance, 'authorized-by-outcome-request')
  assert.equal(result.authorization.unchanged_proposed_registered_target, 'authorized-by-explicit-target-request-after-independent-fit-research')
  assert.equal(result.authorization.taxonomy_addition_definition_change_deprecation_or_reactivation, 'requires-exact-human-decision')
})

test('domain furnishing inventories only universal, accepted, and required scopes without recreating content', () => {
  const workflowState = {
    manifests: [{ value: {
      id: 'coding', taxonomy_status: 'accepted',
      human_intent: { required_subdomains: [] },
      subdomains: [
        { id: 'design', title: 'Design', status: 'accepted' },
        { id: 'testing', title: 'Testing', description: 'Coding testing decisions and practices.', status: 'proposed' },
        { id: 'legacy', title: 'Legacy', status: 'deprecated' }
      ]
    } }],
    corpus: { documents: [
      { path: 'domains/coding/principles.md', frontmatter: { status: 'active' }, semanticSha256: 'a'.repeat(64) },
      { path: 'domains/coding/design.md', frontmatter: { status: 'draft' }, semanticSha256: 'b'.repeat(64) }
    ] }
  }
  const result = inspectDomainFurnishingWorkflow(workflowState, 'coding')
  assert.equal(result.schema_version, 3)
  assert.deepEqual(result.content.targets.map((target) => target.path), [
    'domains/coding/principles.md',
    'domains/coding/personal-growth.md',
    'domains/coding/design.md'
  ])
  assert.deepEqual(result.content.summary, { absent: 1, draft: 1, active: 1 })
  assert.deepEqual(result.taxonomy.proposed_candidates, [{ id: 'testing', title: 'Testing', description: 'Coding testing decisions and practices.' }])
  assert.deepEqual(result.taxonomy.deprecated_scopes, ['legacy'])
  assert.equal(result.next_action, 'independently-evaluate-proposed-subdomains-for-acceptance-deprecation-or-unresolved')
  assert.equal(result.delegated_content_workflow, 'docs/workflows/create-content.md')
  assert.deepEqual(result.human_gates, ['principle-activation'])
})

test('domain furnishing carries required scopes through a pending unchanged domain acceptance', () => {
  const workflowState = {
    manifests: [{ value: {
      id: 'ai', taxonomy_status: 'proposed',
      human_intent: { required_subdomains: ['safety'] },
      subdomains: [{ id: 'safety', title: 'Safety', status: 'proposed' }]
    } }],
    corpus: { documents: [] }
  }
  const result = inspectDomainFurnishingWorkflow(workflowState, 'ai')
  assert.equal(result.next_action, 'research-target-fit-and-accept-unchanged-requested-domain')
  assert.equal(result.content.targets.find((target) => target.scope === 'safety').taxonomy_status, 'pending-required-domain-acceptance')
  assert.deepEqual(result.taxonomy.proposed_candidates, [])
})

test('domain furnishing blocks content work for a deprecated domain pending reactivation', () => {
  const result = inspectDomainFurnishingWorkflow({
    manifests: [{ value: {
      id: 'legacy', taxonomy_status: 'deprecated',
      human_intent: { required_subdomains: [] },
      subdomains: [{ id: 'old', title: 'Old', status: 'deprecated' }]
    } }],
    corpus: { documents: [] }
  }, 'legacy')
  assert.equal(result.next_action, 'independently-research-and-prepare-domain-reactivation-decision')
  assert.deepEqual(result.human_gates, ['taxonomy-reactivation'])
  assert.ok(!result.autonomous_steps.includes('run-create-content-for-missing-furnishing-targets'))
})

test('workflow composition reaches terminal state across proposed, accepted, draft, and active states', () => {
  const sequence = [
    [state('proposed', 'proposed'), 'research-target-fit-and-accept-unchanged-requested-scope'],
    [state('accepted', 'accepted'), 'research-and-create-content-draft'],
    [state('accepted', 'accepted', 'draft'), 'complete-semantic-and-adversarial-content-review'],
    [state('accepted', 'accepted', 'active'), 'outcome-satisfied']
  ]
  for (const [workflowState, expected] of sequence) {
    assert.equal(inspectOutcomeWorkflow(workflowState, 'domains/coding/design.md').next_action, expected)
  }
})

test('new-domain workflow resumes after its exact addition decision and terminates when accepted', () => {
  const absent = { manifests: [], corpus: { documents: [] } }
  assert.deepEqual(inspectNewDomainWorkflow(absent, 'psychology').human_gates, ['taxonomy-addition'])
  assert.equal(inspectNewDomainWorkflow(state('proposed', 'proposed'), 'coding').next_action, 'research-target-fit-and-accept-unchanged-requested-domain')
  assert.equal(inspectNewDomainWorkflow(state('accepted', 'accepted'), 'coding').next_action, 'outcome-satisfied')
})

test('a complete furnished domain is a clean terminal no-op', () => {
  const workflowState = state('accepted', 'accepted', 'active')
  workflowState.manifests[0].value.human_intent = { required_subdomains: [] }
  workflowState.corpus.documents.push(
    { path: 'domains/coding/principles.md', frontmatter: { status: 'active' }, semanticSha256: 'b'.repeat(64) },
    { path: 'domains/coding/personal-growth.md', frontmatter: { status: 'active' }, semanticSha256: 'c'.repeat(64) }
  )
  assert.equal(inspectDomainFurnishingWorkflow(workflowState, 'coding').next_action, 'outcome-satisfied')
})

test('domain refinement reopens selection for every active target without changing furnishing idempotence', () => {
  const workflowState = state('accepted', 'accepted', 'active')
  workflowState.manifests[0].value.human_intent = { required_subdomains: [] }
  workflowState.corpus.documents.push(
    { path: 'domains/coding/principles.md', frontmatter: { status: 'active' }, semanticSha256: 'b'.repeat(64) },
    { path: 'domains/coding/personal-growth.md', frontmatter: { status: 'active' }, semanticSha256: 'c'.repeat(64) }
  )

  const furnishing = inspectDomainFurnishingWorkflow(workflowState, 'coding')
  const refinement = inspectDomainRefinementWorkflow(workflowState, 'coding')
  assert.equal(furnishing.next_action, 'outcome-satisfied')
  assert.equal(refinement.outcome, 'refine-domain-content')
  assert.equal(refinement.next_action, 'run-substantive-update-content-for-all-domain-targets')
  assert.deepEqual(refinement.content.summary, { absent: 0, draft: 0, active: 3 })
  assert.deepEqual(refinement.content.targets.map((target) => target.path), [
    'domains/coding/principles.md',
    'domains/coding/personal-growth.md',
    'domains/coding/design.md'
  ])
  assert.equal(refinement.delegated_content_workflow, 'docs/workflows/update-content.md')
  assert.equal(refinement.selection_refresh.active_status_proves_coverage, false)
  assert.deepEqual(refinement.selection_refresh.stages, [
    'candidate-discovery',
    'coverage-analysis',
    'candidate-comparison-and-consolidation',
    'final-selection'
  ])
  assert.ok(refinement.conditional_human_gates.includes('principle-activation'))
})

test('domain refinement resolves furnishing prerequisites before renewed selection', () => {
  const workflowState = state('accepted', 'accepted')
  workflowState.manifests[0].value.human_intent = { required_subdomains: [] }
  const result = inspectDomainRefinementWorkflow(workflowState, 'coding')
  assert.equal(result.next_action, 'run-create-content-for-missing-furnishing-targets')
  assert.ok(result.autonomous_steps.indexOf('run-create-content-for-missing-furnishing-targets') < result.autonomous_steps.indexOf('run-substantive-update-content-for-all-domain-targets'))
  assert.equal(result.autonomous_steps.at(-1), 'run-domain-cross-file-consistency-and-quality-review')
})

test('canonical model accounts for every workflow route and rejects missing routes, orphans, and invalid gates', () => {
  const current = new DiagnosticBag()
  validateWorkflowModel(process.cwd(), validationPolicy, current)
  assert.equal(current.errorCount, 0, current.items.map((item) => `${item.code}: ${item.message}`).join('\n'))

  const root = mkdtempSync(join(tmpdir(), 'principles-workflow-model-'))
  mkdirSync(join(root, 'docs', 'workflows'), { recursive: true })
  for (const route of [...validationPolicy.workflow_model.outcomes.map((item) => item.route), ...validationPolicy.workflow_model.supporting_routes]) {
    const path = join(root, route)
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, '# Workflow\n')
  }
  writeFileSync(join(root, 'docs', 'workflows', 'orphan.md'), '# Orphan\n')
  const invalid = structuredClone(validationPolicy)
  invalid.classes.human_approval.gates.semantic.push('Not Canonical')
  invalid.workflow_model.outcomes.push({ id: 'missing', route: 'docs/workflows/missing.md', inspector: 'ai-routed' })
  const bag = new DiagnosticBag()
  validateWorkflowModel(root, invalid, bag)
  assert.ok(bag.items.some((item) => item.code === 'WORKFLOW_ROUTE_ORPHAN'))
  assert.ok(bag.items.some((item) => item.code === 'WORKFLOW_ROUTE_MISSING'))
  assert.ok(bag.items.some((item) => item.code === 'WORKFLOW_GATE_ID'))
  rmSync(root, { recursive: true, force: true })
})

test('resolved semantic outcome classes expose canonical routes without parsing natural language', () => {
  const architecture = inspectRoutedOutcome(validationPolicy, 'review-architecture')
  assert.equal(architecture.route, 'docs/workflows/review-architecture.md')
  assert.equal(architecture.next_action, 'follow-canonical-outcome-workflow')
  assert.equal(validateWorkflowStatus(architecture, validationPolicy), architecture)
  assert.throws(() => validateWorkflowStatus({ ...architecture, next_action: 'unknown-action' }, validationPolicy), /unknown action/)
})
