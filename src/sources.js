import { basename } from 'node:path'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { detectCycles } from './identity.js'
import { loadYaml } from './yaml.js'
import { safeResolve, toRepoPath, walkCanonicalRepository } from './repository.js'

export function normalizeStoredUrl(value) {
  if (typeof value !== 'string' || value.normalize('NFC') !== value || value.includes('#')) return null
  const match = /^(https?):\/\/([^/?#]*)([^?#]*)(\?[^#]*)?$/i.exec(value)
  if (!match) return null
  const [, schemeRaw, authorityRaw, pathRaw, query = ''] = match
  if (authorityRaw.includes('@') || authorityRaw.includes('%')) return null
  let host = authorityRaw
  let port = ''
  if (authorityRaw.startsWith('[')) {
    const end = authorityRaw.indexOf(']')
    if (end < 0) return null
    host = authorityRaw.slice(0, end + 1)
    if (authorityRaw.length > end + 1) {
      if (authorityRaw[end + 1] !== ':') return null
      port = authorityRaw.slice(end + 2)
    }
  } else {
    const colon = authorityRaw.lastIndexOf(':')
    if (colon >= 0) {
      host = authorityRaw.slice(0, colon)
      port = authorityRaw.slice(colon + 1)
    }
  }
  if (!host || /[^\x00-\x7f]/.test(host) || (port && !/^[0-9]+$/.test(port))) return null
  const scheme = schemeRaw.toLowerCase()
  const normalizedPort = port && Number(port) === (scheme === 'http' ? 80 : 443) ? '' : port
  const authority = host.toLowerCase() + (normalizedPort ? `:${normalizedPort}` : '')
  const path = pathRaw || '/'
  return `${scheme}://${authority}${path}${query}`
}

function compareUtf8(a, b) {
  return Buffer.compare(Buffer.from(a), Buffer.from(b))
}

export function loadSources(root, schema, bag) {
  const discovered = walkCanonicalRepository(root, 'sources', bag, { optional: true })
    .map((path) => toRepoPath(root, path))
    .sort()
  for (const path of discovered) {
    if (/\.ya?ml$/.test(path) && !/^sources\/SRC-[0-9]{6}\.yaml$/.test(path)) bag.error('SOURCE_PATH', 'Source YAML records must match sources/SRC-......yaml.', path)
  }
  const files = discovered.filter((path) => /^sources\/SRC-[0-9]{6}\.yaml$/.test(path))
  const sources = []
  for (const path of files) {
    const value = loadYaml(root, path, bag)
    if (!value) continue
    if (!schema.validate('source_record', value, path)) continue
    const inputSha256 = createHash('sha256').update(readFileSync(safeResolve(root, path))).digest('hex')
    sources.push({ path, value, inputSha256 })
  }
  return sources
}

export function validateSources(sources, ledger, bag) {
  const byId = new Map()
  const urlOwner = new Map()
  const allocated = new Set(ledger?.sources?.allocated ?? [])
  const retired = new Set(ledger?.sources?.retired ?? [])
  for (const record of sources) {
    const { path, value } = record
    const filename = basename(path, '.yaml')
    if (filename !== value.id) bag.error('SOURCE_FILENAME', `Filename ${filename} must equal source id ${value.id}.`, path)
    if (byId.has(value.id)) bag.error('SOURCE_ID_DUPLICATE', `Duplicate source record ${value.id}.`, path)
    byId.set(value.id, record)
    if (!allocated.has(value.id) || retired.has(value.id)) bag.error('SOURCE_LEDGER', `Source ${value.id} must be allocated and non-retired.`, path)
    if (value.first_retrieved > value.last_reviewed) bag.error('SOURCE_DATE_ORDER', 'first_retrieved must not follow last_reviewed.', path)
    const allUrls = [value.canonical_url, ...(value.url_aliases ?? [])]
    if (new Set(allUrls).size !== allUrls.length) bag.error('SOURCE_URL_DUPLICATE', 'A source cannot repeat its canonical URL or aliases.', path)
    const sortedAliases = [...(value.url_aliases ?? [])].sort(compareUtf8)
    if ((value.url_aliases ?? []).some((url, index) => url !== sortedAliases[index])) bag.error('SOURCE_ALIAS_ORDER', 'URL aliases must use ascending unsigned UTF-8 byte order.', path)
    for (const url of allUrls) {
      const normalized = normalizeStoredUrl(url)
      if (normalized === null || normalized !== url) bag.error('SOURCE_URL_NORMALIZATION', `URL is not in required normalized storage form: ${url}`, path)
      if (urlOwner.has(url)) bag.error('SOURCE_URL_COLLISION', `URL ${url} is already owned by ${urlOwner.get(url)}.`, path)
      else urlOwner.set(url, value.id)
      if (url.startsWith('http://')) bag.warning('SOURCE_HTTP', `Insecure HTTP source URL: ${url}`, path)
    }
  }
  const edges = []
  for (const { path, value } of sources) {
    if (value.status !== 'superseded') continue
    if (value.superseded_by === value.id) bag.error('SOURCE_SUPERSESSION_SELF', `${value.id} cannot supersede itself.`, path)
    const target = byId.get(value.superseded_by)
    if (!target || retired.has(value.superseded_by)) bag.error('SOURCE_SUPERSESSION_TARGET', `Replacement ${value.superseded_by} must be registered and non-retired.`, path)
    edges.push({ from: value.id, to: value.superseded_by })
  }
  detectCycles(edges, bag, 'sources', 'SOURCE_SUPERSESSION_CYCLE')
  for (const { path, value } of sources) {
    if (value.status !== 'superseded') continue
    const seen = new Set([value.id])
    let terminal = byId.get(value.superseded_by)?.value
    while (terminal?.status === 'superseded' && !seen.has(terminal.id)) {
      seen.add(terminal.id)
      terminal = byId.get(terminal.superseded_by)?.value
    }
    if (terminal && !seen.has(terminal.id)) bag.info('SOURCE_SUPERSESSION_TERMINAL', `${value.id} currently resolves to ${terminal.id} with terminal status ${terminal.status}.`, path)
  }
  return { byId, urlOwner }
}

export function validateSourceTransition(baselineSources, proposedSources, baselineLedger, proposedLedger, bag, sourcePolicy = null) {
  const before = new Map(baselineSources.map((item) => [item.value.id, item.value]))
  const after = new Map(proposedSources.map((item) => [item.value.id, item.value]))
  for (const [id, oldSource] of before) {
    const next = after.get(id)
    if (!next) {
      bag.error('SOURCE_RECORD_REMOVED', `Existing source record ${id} was removed.`, `sources/${id}.yaml`)
      continue
    }
    if (oldSource.canonical_url !== next.canonical_url) {
      if (next.status !== 'moved') bag.error('SOURCE_MOVE_STATUS', `Source ${id} changed canonical URL without status moved.`, `sources/${id}.yaml`)
      if (!next.url_aliases.includes(oldSource.canonical_url)) bag.error('SOURCE_MOVE_ALIAS', `Source ${id} did not retain its previous canonical URL as an alias.`, `sources/${id}.yaml`)
    }
    for (const alias of oldSource.url_aliases) {
      if (alias !== next.canonical_url && !next.url_aliases.includes(alias)) bag.error('SOURCE_ALIAS_REMOVED', `Source ${id} removed historical alias ${alias}.`, `sources/${id}.yaml`)
    }
    const replacementChanged = next.status === 'superseded' &&
      (oldSource.status !== 'superseded' || oldSource.superseded_by !== next.superseded_by)
    if (replacementChanged) {
      const target = after.get(next.superseded_by)
      const allowed = sourcePolicy?.lifecycle?.superseded?.new_replacement_target_statuses ?? ['active', 'moved']
      if (target && !allowed.includes(target.status)) {
        bag.error('SOURCE_SUPERSESSION_TARGET_STATUS', `New replacement ${next.superseded_by} for ${id} must have status ${allowed.join(' or ')}; found ${target.status}.`, `sources/${id}.yaml`)
      }
    }
  }
  const retiredBefore = new Set(baselineLedger.sources.retired)
  for (const id of proposedLedger.sources.retired) {
    if (retiredBefore.has(id)) continue
    if (before.has(id) || after.has(id)) bag.error('SOURCE_RETIREMENT_RECORD', `Newly retired source allocation ${id} has a baseline or proposed record.`, 'config/identity-ledger.yaml')
  }
}
