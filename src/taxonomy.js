import { existsSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
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

export function validateTaxonomy(root, manifests, sourceById, corpusPaths, bag) {
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
    const review = value.taxonomy_review
    if (review?.review_record) {
      const reviewPath = `domains/${value.id}/${review.review_record}`
      if (!existsSync(safeResolve(root, reviewPath, { mustExist: false }))) bag.error('TAXONOMY_REVIEW_MISSING', `Taxonomy review record ${reviewPath} does not exist.`, path)
      for (const sourceId of review.source_ids) if (!sourceById.has(sourceId)) bag.error('TAXONOMY_SOURCE_MISSING', `Taxonomy source ${sourceId} is not registered.`, path)
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

export function taxonomyAggregate(manifests, corpusDocuments = []) {
  const coverage = new Map()
  for (const document of corpusDocuments) {
    const domain = document.frontmatter.domain
    if (!coverage.has(domain)) coverage.set(domain, [])
    coverage.get(domain).push(document.path)
  }
  return {
    schema_version: 1,
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
        taxonomy_review: value.taxonomy_review,
        subdomains: [...value.subdomains].sort((a, b) => a.id.localeCompare(b.id)),
        content_files: [...(coverage.get(value.id) ?? [])].sort()
      }))
  }
}

export function renderTaxonomy(manifests, corpusDocuments = []) {
  return stringify(taxonomyAggregate(manifests, corpusDocuments), { lineWidth: 0, sortMapEntries: false })
}
