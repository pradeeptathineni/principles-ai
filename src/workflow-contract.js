export const WORKFLOW_ACTIONS = Object.freeze({
  prepareNewDomain: 'independently-research-and-prepare-new-domain',
  prepareNewSubdomain: 'independently-research-and-prepare-new-subdomain-definition',
  prepareDomainReactivation: 'independently-research-and-prepare-domain-reactivation-decision',
  prepareSubdomainReactivation: 'independently-research-and-prepare-subdomain-reactivation-decision',
  acceptRequestedScope: 'research-target-fit-and-accept-unchanged-requested-scope',
  acceptRequestedDomain: 'research-target-fit-and-accept-unchanged-requested-domain',
  createContentDraft: 'research-and-create-content-draft',
  reviewContent: 'complete-semantic-and-adversarial-content-review',
  evaluateProposedSubdomains: 'independently-evaluate-proposed-subdomains-for-acceptance-deprecation-or-unresolved',
  createMissingTargets: 'run-create-content-for-missing-furnishing-targets',
  refineDomainTargets: 'run-substantive-update-content-for-all-domain-targets',
  reviewDraftTargets: 'complete-per-file-semantic-and-adversarial-review',
  reviewDomainConsistency: 'run-domain-cross-file-consistency-and-quality-review',
  followCanonicalRoute: 'follow-canonical-outcome-workflow',
  outcomeSatisfied: 'outcome-satisfied'
})

export const WORKFLOW_GATES = Object.freeze({
  architectureReview: 'architecture-review',
  evidencePolicyChange: 'evidence-policy-change',
  governanceOrCiChange: 'governance-or-ci-change',
  policyOrSchemaChange: 'policy-or-schema-change',
  principleActivation: 'principle-activation',
  principleRemoval: 'principle-removal',
  principleSemanticChange: 'principle-semantic-change',
  protectedIntentChange: 'protected-intent-change',
  taxonomyAcceptance: 'taxonomy-acceptance',
  taxonomyAddition: 'taxonomy-addition',
  taxonomyDefinitionChange: 'taxonomy-definition-change',
  taxonomyDeprecation: 'taxonomy-deprecation',
  taxonomyReactivation: 'taxonomy-reactivation',
  unresolvedMaterialDisagreement: 'unresolved-material-disagreement'
})

export const DETERMINISTIC_GATE_IDS = Object.freeze([
  WORKFLOW_GATES.architectureReview,
  WORKFLOW_GATES.evidencePolicyChange,
  WORKFLOW_GATES.governanceOrCiChange,
  WORKFLOW_GATES.policyOrSchemaChange,
  WORKFLOW_GATES.principleActivation,
  WORKFLOW_GATES.principleRemoval,
  WORKFLOW_GATES.principleSemanticChange,
  WORKFLOW_GATES.protectedIntentChange,
  WORKFLOW_GATES.taxonomyAcceptance,
  WORKFLOW_GATES.taxonomyAddition,
  WORKFLOW_GATES.taxonomyDefinitionChange,
  WORKFLOW_GATES.taxonomyDeprecation,
  WORKFLOW_GATES.taxonomyReactivation
])

export const SEMANTIC_GATE_IDS = Object.freeze([
  WORKFLOW_GATES.unresolvedMaterialDisagreement
])

export const MANUAL_ONLY_GATE_IDS = Object.freeze([])

export const AGENT_ACTION_IDS = Object.freeze(
  Object.values(WORKFLOW_ACTIONS).filter((id) => id !== WORKFLOW_ACTIONS.outcomeSatisfied)
)

export const TERMINAL_ACTION_IDS = Object.freeze([WORKFLOW_ACTIONS.outcomeSatisfied])
