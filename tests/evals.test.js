import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

test('semantic fixtures have one expected classification and architecture coverage remains advisory', () => {
  const fixtures = parse(readFileSync('evals/fixtures/v1/adversarial.yaml', 'utf8')).fixtures
  const expectations = parse(readFileSync('evals/expected/v1.yaml', 'utf8')).expectations
  const calibration = parse(readFileSync('evals/calibration/v1.yaml', 'utf8'))
  const validation = parse(readFileSync('config/validation.yaml', 'utf8'))
  assert.equal(new Set(fixtures.map((item) => item.id)).size, fixtures.length)
  assert.deepEqual(fixtures.map((item) => item.id).sort(), expectations.map((item) => item.fixture_id).sort())
  assert.deepEqual(fixtures.filter((item) => item.dimension === 'principle-selection').map((item) => item.id).sort(), [
    'justified-larger-principle-set',
    'narrow-two-principle-selection-is-sufficient',
    'premature-two-principle-convergence',
    'reject-count-driven-candidate-inflation'
  ])
  const architectureDimensions = new Set(fixtures.filter((item) => item.dimension.startsWith('architecture-')).map((item) => item.dimension))
  assert.deepEqual([...architectureDimensions].sort(), [
    'architecture-authority',
    'architecture-boundary',
    'architecture-context',
    'architecture-gate',
    'architecture-outcome',
    'architecture-prerequisite'
  ])
  assert.equal(calibration.status, 'pending-human-calibration')
  for (const check of [
    'workflow_prerequisite_sufficiency', 'workflow_composition', 'human_gate_necessity',
    'state_ownership_clarity', 'authority_and_implementation_alignment',
    'deterministic_semantic_boundary', 'context_efficiency', 'natural_language_outcome_resolution',
    'candidate_discovery_breadth', 'candidate_coverage_analysis',
    'candidate_comparison_and_consolidation', 'subject_determined_final_selection',
    'generation_shaped_uniformity'
  ]) assert.ok(validation.classes.semantic.checks.includes(check))
})
