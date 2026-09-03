import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { safeResolve, toRepoPath, walkCanonicalRepository } from './repository.js'
import { WORKFLOW_GATES } from './workflow-contract.js'

function matches(path, pattern) {
  return pattern.endsWith('/') ? path.startsWith(pattern) : path === pattern
}

function excluded(path, patterns) {
  return patterns.some((pattern) => matches(path, pattern))
}

function candidatePaths(root, reviewPolicy, bag) {
  const paths = new Set()
  for (const patterns of Object.values(reviewPolicy?.trigger_groups ?? {})) {
    for (const pattern of patterns) {
      if (pattern.endsWith('/')) {
        const directory = pattern.slice(0, -1)
        for (const absolute of walkCanonicalRepository(root, directory, bag, { optional: true })) paths.add(toRepoPath(root, absolute))
      } else if (existsSync(join(root, pattern))) paths.add(pattern)
    }
  }
  return paths
}

function bytesAt(root, path) {
  const absolute = join(root, path)
  return existsSync(absolute) ? readFileSync(safeResolve(root, path)) : null
}

function equalBytes(left, right) {
  if (left === null || right === null) return left === right
  return left.equals(right)
}

export function classifyArchitectureChanges(root, baselineRoot, validationPolicy, bag) {
  const reviewPolicy = validationPolicy?.architecture_review
  if (!baselineRoot || !reviewPolicy) {
    return { status: 'not_evaluated', required: false, categories: [], changed_paths: [], context: { files: [], utf8_bytes: 0 } }
  }

  const candidates = new Set([
    ...candidatePaths(root, reviewPolicy, bag),
    ...candidatePaths(baselineRoot, reviewPolicy, bag)
  ])
  const excludedPatterns = reviewPolicy.excluded_paths ?? []
  const changedPaths = [...candidates]
    .filter((path) => !excluded(path, excludedPatterns))
    .filter((path) => !equalBytes(bytesAt(root, path), bytesAt(baselineRoot, path)))
    .sort()
  const categories = Object.entries(reviewPolicy.trigger_groups ?? {})
    .filter(([, patterns]) => changedPaths.some((path) => patterns.some((pattern) => matches(path, pattern))))
    .map(([category]) => category)
    .sort()
  const contextFiles = [...new Set([...(reviewPolicy.minimum_context ?? []), ...changedPaths])]
    .filter((path) => existsSync(join(root, path)) || existsSync(join(baselineRoot, path)))
    .sort()
  const utf8Bytes = contextFiles.reduce((total, path) => total + (bytesAt(root, path) ?? bytesAt(baselineRoot, path)).length, 0)
  return {
    status: 'evaluated',
    required: changedPaths.length > 0,
    categories,
    changed_paths: changedPaths,
    context: { files: contextFiles, utf8_bytes: utf8Bytes }
  }
}

export function validateArchitectureReviewPolicy(root, validationPolicy, bag) {
  const reviewPolicy = validationPolicy?.architecture_review
  if (!reviewPolicy) {
    bag.error('ARCHITECTURE_REVIEW_POLICY', 'Architecture-review policy is required.', 'config/validation.yaml')
    return
  }
  for (const path of [reviewPolicy.route, ...(reviewPolicy.minimum_context ?? [])]) {
    try { safeResolve(root, path) } catch (error) { bag.error('ARCHITECTURE_REVIEW_PATH', error.message, 'config/validation.yaml') }
  }
  const patterns = Object.values(reviewPolicy.trigger_groups ?? {}).flat()
  if (patterns.some((pattern) => pattern === 'domains/' || pattern === 'sources/' || pattern === 'evidence/')) {
    bag.error('ARCHITECTURE_REVIEW_SCOPE', 'Ordinary corpus, source, and evidence records must not trigger architecture review by directory alone.', 'config/validation.yaml')
  }
}

export function architectureReviewGates(review) {
  const gates = new Set()
  if (!review?.required) return gates
  gates.add(WORKFLOW_GATES.architectureReview)
  if (review.categories.includes('governance') || review.categories.includes('routing') || review.categories.includes('ci')) {
    gates.add(WORKFLOW_GATES.governanceOrCiChange)
  }
  return gates
}
