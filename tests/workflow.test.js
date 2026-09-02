import test from 'node:test'
import assert from 'node:assert/strict'
import { inspectDomainFurnishingWorkflow, inspectOutcomeWorkflow } from '../src/workflow.js'

function state(domainStatus, subdomainStatus, contentStatus = null) {
  return {
    manifests: [{ value: {
      id: 'coding', taxonomy_status: domainStatus,
      subdomains: [{ id: 'design', status: subdomainStatus }]
    } }],
    corpus: { documents: contentStatus ? [{ path: 'domains/coding/design.md', frontmatter: { status: contentStatus }, semanticSha256: 'a'.repeat(64) }] : [] }
  }
}

test('workflow inspection advances through autonomous prerequisites and genuine gates', () => {
  assert.equal(inspectOutcomeWorkflow(state('proposed', 'proposed'), 'domains/coding/design.md').next_action, 'research-target-fit-and-accept-unchanged-requested-scope')
  assert.equal(inspectOutcomeWorkflow(state('accepted', 'proposed'), 'domains/coding/design.md').next_action, 'research-target-fit-and-accept-unchanged-requested-scope')
  assert.equal(inspectOutcomeWorkflow(state('accepted', 'accepted'), 'domains/coding/design.md').next_action, 'research-and-create-content-draft')
  assert.deepEqual(inspectOutcomeWorkflow(state('accepted', 'accepted', 'draft'), 'domains/coding/design.md').human_gates, ['approve-exact-principles-for-activation'])
  assert.equal(inspectOutcomeWorkflow(state('accepted', 'accepted', 'active'), 'domains/coding/design.md').next_action, 'outcome-satisfied')
})

test('outcome authorization covers prerequisites but not unseen semantics', () => {
  const result = inspectOutcomeWorkflow(state('proposed', 'proposed'), 'domains/coding/design.md')
  assert.equal(result.authorization.prerequisite_workflows, 'authorized-by-outcome-request')
  assert.equal(result.authorization.draft_generation_after_taxonomy_acceptance, 'authorized-by-outcome-request')
  assert.equal(result.authorization.unchanged_registered_target, 'authorized-by-explicit-target-request')
  assert.equal(result.authorization.new_or_changed_taxonomy_and_unseen_principles, 'not-preapproved')
})

test('domain furnishing inventories only universal, accepted, and required scopes without recreating content', () => {
  const workflowState = {
    manifests: [{ value: {
      id: 'coding', taxonomy_status: 'accepted',
      human_intent: { required_subdomains: [] },
      subdomains: [
        { id: 'design', title: 'Design', status: 'accepted' },
        { id: 'testing', title: 'Testing', status: 'proposed' },
        { id: 'legacy', title: 'Legacy', status: 'deprecated' }
      ]
    } }],
    corpus: { documents: [
      { path: 'domains/coding/principles.md', frontmatter: { status: 'active' }, semanticSha256: 'a'.repeat(64) },
      { path: 'domains/coding/design.md', frontmatter: { status: 'draft' }, semanticSha256: 'b'.repeat(64) }
    ] }
  }
  const result = inspectDomainFurnishingWorkflow(workflowState, 'coding')
  assert.deepEqual(result.content.targets.map((target) => target.path), [
    'domains/coding/principles.md',
    'domains/coding/personal-growth.md',
    'domains/coding/design.md'
  ])
  assert.deepEqual(result.content.summary, { absent: 1, draft: 1, active: 1 })
  assert.deepEqual(result.taxonomy.proposed_candidates, [{ id: 'testing', title: 'Testing' }])
  assert.deepEqual(result.taxonomy.deprecated_scopes, ['legacy'])
  assert.equal(result.next_action, 'evaluate-registered-proposed-subdomains-for-safe-unchanged-acceptance-or-skip')
  assert.equal(result.delegated_content_workflow, 'docs/workflows/create-content.md')
  assert.deepEqual(result.human_gates, ['approve-exact-domain-principle-package-for-activation'])
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
