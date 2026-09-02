import { existsSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import canonicalize from 'canonicalize'
import { stringify } from 'yaml'
import { safeResolve, toRepoPath, walkCanonicalRepository } from './repository.js'
import { loadYaml } from './yaml.js'

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

export function validateTaxonomyTransition(baselineManifests, proposedManifests, bag) {
  const gates = new Set()
  const before = new Map(baselineManifests.map((item) => [item.value.id, item.value]))
  const after = new Map(proposedManifests.map((item) => [item.value.id, item.value]))
  for (const [id, oldDomain] of before) {
    const next = after.get(id)
    if (!next) {
      bag.error('TAXONOMY_DOMAIN_REMOVED', `Domain ${id} was removed; retain it as deprecated.`, `domains/${id}/domain.yaml`)
      continue
    }
    if (oldDomain.taxonomy_status === 'accepted' && next.taxonomy_status === 'proposed') bag.error('TAXONOMY_STATUS_REGRESSION', `Accepted domain ${id} cannot regress to proposed.`, `domains/${id}/domain.yaml`)
    if (oldDomain.taxonomy_status !== next.taxonomy_status) gates.add('taxonomy-lifecycle')
    if (!equal(oldDomain.description, next.description) || !equal(oldDomain.human_intent, next.human_intent)) gates.add('protected-intent-change')
    if (!equal({ code: oldDomain.code, title: oldDomain.title }, { code: next.code, title: next.title })) gates.add('taxonomy-definition-change')
    const oldSubs = new Map((oldDomain.subdomains ?? []).map((item) => [item.id, item]))
    const nextSubs = new Map((next.subdomains ?? []).map((item) => [item.id, item]))
    for (const [subId, oldSub] of oldSubs) {
      const nextSub = nextSubs.get(subId)
      if (!nextSub) {
        bag.error('TAXONOMY_SUBDOMAIN_REMOVED', `Subdomain ${id}/${subId} was removed; retain it as deprecated.`, `domains/${id}/domain.yaml`)
        continue
      }
      if (oldSub.status === 'accepted' && nextSub.status === 'proposed') bag.error('TAXONOMY_STATUS_REGRESSION', `Accepted subdomain ${id}/${subId} cannot regress to proposed.`, `domains/${id}/domain.yaml`)
      if (oldSub.status !== nextSub.status) gates.add('taxonomy-lifecycle')
      if (!equal({ code: oldSub.code, title: oldSub.title, origin: oldSub.origin }, { code: nextSub.code, title: nextSub.title, origin: nextSub.origin })) gates.add('taxonomy-definition-change')
    }
    for (const [subId, nextSub] of nextSubs) {
      if (!oldSubs.has(subId) && nextSub.status !== 'proposed') bag.error('TAXONOMY_NEW_SCOPE_STATUS', `New subdomain ${id}/${subId} must begin proposed.`, `domains/${id}/domain.yaml`)
    }
  }
  for (const [id, next] of after) {
    if (!before.has(id) && next.taxonomy_status !== 'proposed') bag.error('TAXONOMY_NEW_DOMAIN_STATUS', `New domain ${id} must begin proposed.`, `domains/${id}/domain.yaml`)
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
    schema_version: 2,
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
