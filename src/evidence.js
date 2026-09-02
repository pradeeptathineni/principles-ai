import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import canonicalize from 'canonicalize'
import { loadYaml } from './yaml.js'
import { safeResolve, toRepoPath, walkCanonicalRepository } from './repository.js'

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function inspectIJson(value, bag, path, pointer = '/settings') {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) bag.error('EVALUATOR_IJSON_NUMBER', `${pointer} contains a non-finite or overflowing number.`, path)
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) bag.error('EVALUATOR_IJSON_INTEGER', `${pointer} contains an integer outside the interoperable safe range; store it as a string.`, path)
  } else if (Array.isArray(value)) value.forEach((item, index) => inspectIJson(item, bag, path, `${pointer}/${index}`))
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (/(?:secret|password|credential|authorization|cookie|api[_-]?key|(?:^|[_-])token(?:$|[_-])|(?:access|refresh|auth|api)[_-]?token)/i.test(key)) bag.error('EVALUATOR_SECRET_FIELD', `${pointer}/${key} appears to contain forbidden credential material.`, path)
      inspectIJson(item, bag, path, `${pointer}/${key}`)
    }
  }
}

export function loadEvaluatorConfigurations(root, schema, bag) {
  const discovered = walkCanonicalRepository(root, 'evals', bag, { optional: true })
    .map((path) => toRepoPath(root, path))
    .sort()
  for (const path of discovered) {
    if (path.startsWith('evals/configurations/') && /\.ya?ml$/.test(path) && !/^evals\/configurations\/[a-z0-9][a-z0-9-]*\.yaml$/.test(path)) bag.error('EVALUATOR_PATH', 'Evaluator configurations must match evals/configurations/<kebab-id>.yaml.', path)
  }
  const files = discovered.filter((path) => /^evals\/configurations\/[a-z0-9][a-z0-9-]*\.yaml$/.test(path))
  const byPath = new Map()
  for (const path of files) {
    const value = loadYaml(root, path, bag)
    if (!value) continue
    if (!schema.validate('evaluator_configuration_record', value, path)) continue
    if (basename(path, '.yaml') !== value.id) bag.error('EVALUATOR_FILENAME', `Evaluator filename must equal id ${value.id}.`, path)
    inspectIJson(value.settings, bag, path)
    let settingsCanonical
    try {
      settingsCanonical = canonicalize(value.settings)
      if (settingsCanonical === undefined) throw new Error('settings are not RFC 8785 canonicalizable')
    } catch (error) {
      bag.error('EVALUATOR_CANONICALIZATION', error.message, path)
    }
    const prompt = value.prompt.normalize('NFC').replace(/\r\n?/g, '\n')
    byPath.set(path, {
      path,
      value,
      inputSha256: sha256(readFileSync(safeResolve(root, path), 'utf8')),
      promptSha256: sha256(prompt),
      settingsSha256: settingsCanonical === undefined ? null : sha256(settingsCanonical)
    })
  }
  return byPath
}

export function loadEvidence(root, schema, bag) {
  const records = []
  const discovered = walkCanonicalRepository(root, 'evidence', bag, { optional: true })
    .map((path) => toRepoPath(root, path))
    .sort()
  for (const path of discovered) {
    if (/\.ya?ml$/.test(path) && !/^evidence\/claims\/PRN-[0-9]{6}\.yaml$/.test(path)) bag.error('EVIDENCE_PATH', 'Claim-review records must match evidence/claims/PRN-......yaml.', path)
  }
  const files = discovered.filter((path) => /^evidence\/claims\/PRN-[0-9]{6}\.yaml$/.test(path))
  for (const path of files) {
    const value = loadYaml(root, path, bag)
    if (!value) continue
    if (!schema.validate('claim_review_record', value, path)) continue
    records.push({ path, value, inputSha256: sha256(readFileSync(safeResolve(root, path), 'utf8')) })
  }
  return records
}

function sameArray(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

export function validateEvidence(root, records, entryById, evaluatorConfigs, sourceById, bag) {
  const byEntryId = new Map()
  for (const record of records) {
    const { path, value } = record
    if (!value || !Array.isArray(value.claims) || typeof value.entry_id !== 'string') {
      bag.error('EVIDENCE_INVALID_RECORD', 'Evidence record is not safe for cross-file validation after schema failure.', path)
      continue
    }
    if (basename(path, '.yaml') !== value.entry_id) bag.error('EVIDENCE_FILENAME', `Evidence filename must equal entry_id ${value.entry_id}.`, path)
    if (byEntryId.has(value.entry_id)) bag.error('EVIDENCE_DUPLICATE', `Duplicate evidence record for ${value.entry_id}.`, path)
    byEntryId.set(value.entry_id, record)
    const resolved = entryById.get(value.entry_id)
    if (!resolved) {
      bag.error('EVIDENCE_ENTRY', `Evidence entry ${value.entry_id} does not resolve to a current corpus entry.`, path)
      continue
    }
    const expectedClaims = resolved.entry.claims
    const roles = value.claims.map((claim) => claim.role)
    const expectedRoles = expectedClaims.map((claim) => claim.role)
    if (!sameArray(roles, expectedRoles)) bag.error('EVIDENCE_COVERAGE', `Evidence roles must exactly equal ${expectedRoles.join(', ')} in document order.`, path)
    const referenceSources = new Map(resolved.document.references.map((reference) => [reference.label, reference.sourceId]))
    for (const [index, review] of value.claims.entries()) {
      const claim = expectedClaims[index]
      if (!claim || review.role !== claim.role) continue
      if (review.claim_sha256 !== claim.claimSha256) bag.error('EVIDENCE_CLAIM_HASH', `${review.role} claim hash does not match current normalized wording.`, path)
      const expectedSources = [...new Set(claim.citationLabels.map((label) => referenceSources.get(label)).filter(Boolean))]
      if (!sameArray(review.source_ids, expectedSources)) bag.error('EVIDENCE_SOURCE_SEQUENCE', `${review.role} source_ids must exactly equal ${expectedSources.join(', ')}.`, path)
      const locatorPairs = new Set()
      const locatedSources = new Set()
      for (const locator of review.locators) {
        const key = `${locator.source_id}\0${locator.locator}`
        if (locatorPairs.has(key)) bag.error('EVIDENCE_LOCATOR_DUPLICATE', `${review.role} repeats locator ${locator.source_id}: ${locator.locator}.`, path)
        locatorPairs.add(key)
        if (!review.source_ids.includes(locator.source_id)) bag.error('EVIDENCE_LOCATOR_SOURCE', `${review.role} locator names a source outside source_ids.`, path)
        locatedSources.add(locator.source_id)
      }
      for (const sourceId of review.source_ids) {
        if (!sourceById.has(sourceId)) bag.error('EVIDENCE_SOURCE_MISSING', `${review.role} source ${sourceId} is not registered.`, path)
        if (!locatedSources.has(sourceId)) bag.error('EVIDENCE_LOCATOR_MISSING', `${review.role} source ${sourceId} has no locator.`, path)
      }
      if (resolved.document.frontmatter.status === 'active' && !['strong', 'disputed'].includes(review.outcome)) bag.error('EVIDENCE_OUTCOME', `Active ${review.role} cannot publish outcome ${review.outcome}.`, path)
      const reviewer = review.reviewer
      if (reviewer.type !== 'human') {
        const config = evaluatorConfigs.get(reviewer.configuration.configuration_ref)
        if (!config) bag.error('EVALUATOR_REFERENCE', `${review.role} evaluator configuration does not resolve.`, path)
        else {
          if (reviewer.configuration.system !== config.value.system || reviewer.configuration.model !== config.value.model) bag.error('EVALUATOR_IDENTITY', `${review.role} evaluator system/model do not match the referenced configuration.`, path)
          if (reviewer.configuration.prompt_sha256 !== config.promptSha256 || reviewer.configuration.settings_sha256 !== config.settingsSha256) bag.error('EVALUATOR_HASH', `${review.role} evaluator hashes do not match the referenced configuration.`, path)
        }
      }
    }
  }
  for (const requiredPath of ['domains/coding/principles.md', 'domains/coding/personal-growth.md', 'domains/coding/design.md']) {
    for (const [entryId, resolved] of entryById) {
      if (resolved.document.path === requiredPath && !byEntryId.has(entryId)) bag.error('EVIDENCE_PILOT_REQUIRED', `${requiredPath} requires complete evidence for ${entryId}.`, requiredPath)
    }
  }
  return byEntryId
}

export function validateEvidenceTransition(baselineRecords, proposedRecords, baselineSources, proposedSources, bag) {
  const before = new Map(baselineRecords.map((record) => [record.value.entry_id, record.value]))
  const after = new Map(proposedRecords.map((record) => [record.value.entry_id, record.value]))
  for (const [entryId, oldRecord] of before) {
    const next = after.get(entryId)
    if (!next) continue
    const nextClaims = new Map(next.claims.map((claim) => [claim.role, claim]))
    for (const oldClaim of oldRecord.claims) {
      const claim = nextClaims.get(oldClaim.role)
      if (claim && JSON.stringify(oldClaim.locators) !== JSON.stringify(claim.locators)) bag.info('SEMANTIC_REREVIEW_LOCATOR', `${entryId} ${claim.role} locator transition requires semantic re-review.`, `evidence/claims/${entryId}.yaml`)
    }
  }
  const beforeSource = new Map(baselineSources.map((source) => [source.value.id, source.value]))
  for (const source of proposedSources) {
    const old = beforeSource.get(source.value.id)
    if (old && old.status !== source.value.status && ['superseded', 'withdrawn', 'unavailable'].includes(source.value.status)) bag.info('SEMANTIC_REREVIEW_SOURCE', `${source.value.id} status changed to ${source.value.status}; affected claims require semantic re-review.`, source.path)
  }
}
