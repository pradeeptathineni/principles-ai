import { existsSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import canonicalize from 'canonicalize'
import { stringify } from 'yaml'
import { safeResolve, toRepoPath, walkCanonicalRepository } from './repository.js'
import { loadYaml } from './yaml.js'
import { WORKFLOW_GATES } from './workflow-contract.js'

export function loadManifests(root, schema, bag) {
  const domainsRoot = safeResolve(root, 'domains')
  for (const entry of readdirSync(domainsRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && !existsSync(join(domainsRoot, entry.name, 'domain.yaml'))) {
      bag.error('MANIFEST_MISSING', `Domain directory ${entry.name} requires domains/${entry.name}/domain.yaml.`, `domains/${entry.name}`)
    }
  }
  const files = walkCanonicalRepository(root, 'domains', bag)
    .filter((path) => basename(path) === 'domain.yaml')
    .map((path) => toRepoPath(root, path))
    .sort()
  const manifests = []
  for (const path of files) {
    const value = loadYaml(root, path, bag)
    if (!value) continue
    if (!/^domains\/[^/]+\/domain\.yaml$/.test(path)) {
      bag.error('MANIFEST_PATH', 'Domain manifests must match the exact path domains/<domain>/domain.yaml.', path)
      continue
    }
    if (!schema.validate('domain_manifest', value, path)) continue
    manifests.push({ path, value })
  }
  return manifests
}

export function validateTaxonomy(root, manifests, corpusPaths, bag) {
  const ids = new Map()
  const codes = new Map()
  for (const manifest of manifests) {
    const { path, value } = manifest
    const directory = path.split('/')[1]
    if (directory !== value.id) bag.error('MANIFEST_PATH', `Directory ${directory} must equal manifest id ${value.id}.`, path)
    for (const [map, key, label] of [[ids, value.id, 'domain id'], [codes, value.code, 'domain code']]) {
      if (map.has(key)) bag.error('TAXONOMY_DUPLICATE', `Duplicate ${label} ${key}; first declared in ${map.get(key)}.`, path)
      else map.set(key, path)
    }
    const subIds = new Set()
    const subCodes = new Set()
    const bySubId = new Map()
    for (const subdomain of value.subdomains ?? []) {
      if (subIds.has(subdomain.id)) bag.error('SUBDOMAIN_ID_DUPLICATE', `Duplicate subdomain id ${subdomain.id} within ${value.id}.`, path)
      if (subCodes.has(subdomain.code)) bag.error('SUBDOMAIN_CODE_DUPLICATE', `Duplicate subdomain code ${subdomain.code} within ${value.id}.`, path)
      subIds.add(subdomain.id)
      subCodes.add(subdomain.code)
      bySubId.set(subdomain.id, subdomain)
    }
    for (const required of value.human_intent?.required_subdomains ?? []) {
      const subdomain = bySubId.get(required)
      if (!subdomain) bag.error('REQUIRED_SUBDOMAIN_MISSING', `Protected required subdomain ${required} is not registered.`, path)
      else if (subdomain.status === 'deprecated') bag.error('REQUIRED_SUBDOMAIN_DEPRECATED', `Protected required subdomain ${required} cannot be deprecated.`, path)
      else if (value.taxonomy_status === 'accepted' && subdomain.status !== 'accepted') bag.error('REQUIRED_SUBDOMAIN_NOT_ACCEPTED', `Required subdomain ${required} must be accepted with its domain.`, path)
    }
    for (const subdomain of value.subdomains ?? []) {
      const corpusPath = `domains/${value.id}/${subdomain.id}.md`
      if (subdomain.status === 'deprecated' && corpusPaths.has(corpusPath)) bag.error('DEPRECATED_SCOPE_CONTENT', `Deprecated scope ${value.id}/${subdomain.id} has a corpus file.`, corpusPath)
    }
    if (value.taxonomy_status === 'deprecated') {
      for (const name of ['principles.md', 'personal-growth.md']) {
        const corpusPath = `domains/${value.id}/${name}`
        if (corpusPaths.has(corpusPath)) bag.error('DEPRECATED_SCOPE_CONTENT', `Deprecated domain ${value.id} has corpus file ${name}.`, corpusPath)
      }
    }
  }
}

function equal(left, right) {
  return canonicalize(left) === canonicalize(right)
}

function addTransitionGate(gates, onGate, gate, path) {
  gates.add(gate)
  onGate?.(gate, path)
}

function classifyLifecycleTransition(before, after, gates, bag, path, label, target, definitionUnchanged, acceptanceAuthorized, routineTransitions, onGate) {
  if (before === after) return
  if (after === 'proposed' && before !== 'proposed') {
    bag.error('TAXONOMY_STATUS_REGRESSION', `${label} cannot regress from ${before} to proposed.`, path)
    return
  }
  if (before === 'proposed' && after === 'accepted') {
    if (definitionUnchanged && acceptanceAuthorized) routineTransitions.add(`taxonomy-acceptance:${target}`)
    else addTransitionGate(gates, onGate, WORKFLOW_GATES.taxonomyAcceptance, path)
  }
  else if (after === 'deprecated') addTransitionGate(gates, onGate, WORKFLOW_GATES.taxonomyDeprecation, path)
  else if (before === 'deprecated' && after === 'accepted') addTransitionGate(gates, onGate, WORKFLOW_GATES.taxonomyReactivation, path)
  else bag.error('TAXONOMY_STATUS_TRANSITION', `${label} has unsupported lifecycle transition ${before} to ${after}.`, path)
}

export function validateTaxonomyTransition(baselineManifests, proposedManifests, bag, options = {}) {
  const gates = new Set()
  const authorizedAcceptances = options.authorizedAcceptances ?? new Set()
  const routineTransitions = options.routineTransitions ?? new Set()
  const onGate = options.onGate
  const before = new Map(baselineManifests.map((item) => [item.value.id, item.value]))
  const after = new Map(proposedManifests.map((item) => [item.value.id, item.value]))
  for (const [id, oldDomain] of before) {
    const next = after.get(id)
    if (!next) {
      bag.error('TAXONOMY_DOMAIN_REMOVED', `Domain ${id} was removed; retain it as deprecated.`, `domains/${id}/domain.yaml`)
      continue
    }
    const domainDefinitionChanged = !equal({ code: oldDomain.code, title: oldDomain.title, description: oldDomain.description }, { code: next.code, title: next.title, description: next.description })
    const domainPath = `domains/${id}/domain.yaml`
    classifyLifecycleTransition(oldDomain.taxonomy_status, next.taxonomy_status, gates, bag, domainPath, `Domain ${id}`, id, !domainDefinitionChanged, authorizedAcceptances.has(id), routineTransitions, onGate)
    if (domainDefinitionChanged) addTransitionGate(gates, onGate, WORKFLOW_GATES.taxonomyDefinitionChange, domainPath)
    if (!equal(oldDomain.description, next.description) || !equal(oldDomain.human_intent, next.human_intent)) addTransitionGate(gates, onGate, WORKFLOW_GATES.protectedIntentChange, domainPath)
    const oldSubs = new Map((oldDomain.subdomains ?? []).map((item) => [item.id, item]))
    const nextSubs = new Map((next.subdomains ?? []).map((item) => [item.id, item]))
    for (const [subId, oldSub] of oldSubs) {
      const nextSub = nextSubs.get(subId)
      if (!nextSub) {
        bag.error('TAXONOMY_SUBDOMAIN_REMOVED', `Subdomain ${id}/${subId} was removed; retain it as deprecated.`, `domains/${id}/domain.yaml`)
        continue
      }
      const definitionChanged = !equal(
        { code: oldSub.code, title: oldSub.title, description: oldSub.description, origin: oldSub.origin },
        { code: nextSub.code, title: nextSub.title, description: nextSub.description, origin: nextSub.origin }
      )
      const protectedBefore = new Set(oldDomain.human_intent?.required_subdomains ?? [])
      const protectedAfter = new Set(next.human_intent?.required_subdomains ?? [])
      const acceptanceAuthorized = authorizedAcceptances.has(`${id}/${subId}`) || (authorizedAcceptances.has(id) && (protectedBefore.has(subId) || protectedAfter.has(subId)))
      classifyLifecycleTransition(oldSub.status, nextSub.status, gates, bag, domainPath, `Subdomain ${id}/${subId}`, `${id}/${subId}`, !definitionChanged, acceptanceAuthorized, routineTransitions, onGate)
      if (definitionChanged) {
        addTransitionGate(gates, onGate, WORKFLOW_GATES.taxonomyDefinitionChange, domainPath)
        if (protectedBefore.has(subId) || protectedAfter.has(subId)) addTransitionGate(gates, onGate, WORKFLOW_GATES.protectedIntentChange, domainPath)
      }
    }
    for (const [subId, nextSub] of nextSubs) {
      if (!oldSubs.has(subId)) {
        addTransitionGate(gates, onGate, WORKFLOW_GATES.taxonomyAddition, domainPath)
      }
    }
  }
  for (const [id, next] of after) {
    if (!before.has(id)) {
      addTransitionGate(gates, onGate, WORKFLOW_GATES.taxonomyAddition, `domains/${id}/domain.yaml`)
    }
  }
  return gates
}

export function taxonomyAggregate(manifests, corpusDocuments = []) {
  const coverage = new Map()
  for (const document of corpusDocuments) {
    const domain = document.frontmatter.domain
    if (!coverage.has(domain)) coverage.set(domain, [])
    coverage.get(domain).push({ path: document.path, status: document.frontmatter.status, semantic_sha256: document.semanticSha256 })
  }
  return {
    schema_version: 3,
    derived_from: ['domains/*/domain.yaml', 'domains/*/*.md'],
    domains: [...manifests]
      .sort((a, b) => a.value.id.localeCompare(b.value.id))
      .map(({ value }) => ({
        id: value.id,
        code: value.code,
        title: value.title,
        status: value.taxonomy_status,
        description: value.description,
        human_intent: value.human_intent,
        subdomains: [...value.subdomains].sort((a, b) => a.id.localeCompare(b.id)),
        content: [...(coverage.get(value.id) ?? [])].sort((a, b) => a.path.localeCompare(b.path))
      }))
  }
}

export function renderTaxonomy(manifests, corpusDocuments = []) {
  return stringify(taxonomyAggregate(manifests, corpusDocuments), { lineWidth: 0, sortMapEntries: false })
}
