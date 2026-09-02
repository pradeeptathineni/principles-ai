import { collectExternalUrls } from './internal-links.js'
import { checkExternalUrls } from './external-links.js'

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value ? null : date
}

function validateBaseline(baseline, bag) {
  if (!baseline || baseline.version !== 1 || !baseline.observations || typeof baseline.observations !== 'object' || Array.isArray(baseline.observations)) {
    bag.error('SOURCE_CONTENT_BASELINE_INVALID', 'Operational content baseline must be a version 1 object with an observations mapping.', '<operational-baseline>')
    return false
  }
  for (const [url, observation] of Object.entries(baseline.observations)) {
    if (!/^https?:\/\//i.test(url) || !observation || !/^[a-f0-9]{64}$/.test(observation.sha256 ?? '')) {
      bag.error('SOURCE_CONTENT_BASELINE_INVALID', `Invalid operational baseline observation for ${url}.`, '<operational-baseline>')
      return false
    }
  }
  return true
}

export async function runOperationalChecks({ root, sources, sourcePolicy, bag, baseline = null, asOf, externalOptions = {} }) {
  const observedAt = asOf ?? new Date().toISOString().slice(0, 10)
  const observedDate = parseDate(observedAt)
  if (!observedDate) throw new Error(`Invalid operational --as-of date ${observedAt}`)
  const excludedPrefixes = sourcePolicy?.operational_observation?.external_markdown_excluded_prefixes ?? []
  const urls = collectExternalUrls(root, sources, bag, { excludedPrefixes })
  const sourceUrls = [...new Set(sources.flatMap((source) => [source.value.canonical_url, ...(source.value.url_aliases ?? [])]))].sort()
  const sourceUrlSet = new Set(sourceUrls)
  const sourceResults = await checkExternalUrls(sourceUrls, bag, { ...externalOptions, captureContent: true })
  const linkResults = await checkExternalUrls(urls.filter((url) => !sourceUrlSet.has(url)), bag, externalOptions)
  const results = [...sourceResults, ...linkResults].sort((left, right) => left.url.localeCompare(right.url))
  const observations = Object.fromEntries(sourceResults
    .filter((result) => result.contentSha256)
    .map((result) => [result.url, { final_url: result.finalUrl, sha256: result.contentSha256 }])
    .sort(([left], [right]) => left.localeCompare(right)))

  if (baseline === null) {
    bag.info('SOURCE_CONTENT_NOT_EVALUATED', 'No explicit operational content baseline was supplied; source-content change is not_evaluated.', '<operational-baseline>')
  } else if (validateBaseline(baseline, bag)) {
    for (const [url, observation] of Object.entries(observations)) {
      const previous = baseline.observations[url]
      if (previous && previous.sha256 !== observation.sha256) {
        bag.warning('SOURCE_CONTENT_CHANGED', `Observed content hash changed for ${url}; semantic re-review is required for affected uses.`, '<operational-baseline>')
      }
    }
  }

  const threshold = sourcePolicy?.lifecycle?.dates?.review_due_after_days
  if (!Number.isInteger(threshold) || threshold < 1) throw new Error('Source policy requires a positive review_due_after_days threshold')
  const reviewDue = []
  for (const source of sources) {
    const reviewed = parseDate(source.value.last_reviewed)
    if (!reviewed) continue
    const ageDays = Math.floor((observedDate - reviewed) / 86_400_000)
    if (ageDays > threshold) {
      reviewDue.push({ id: source.value.id, last_reviewed: source.value.last_reviewed, age_days: ageDays })
      bag.warning('SOURCE_REVIEW_DUE', `${source.value.id} review is due after ${ageDays} days (threshold ${threshold}); this does not prove semantic staleness.`, source.path)
    }
  }
  return {
    results,
    reviewDue,
    snapshot: { version: 1, observed_at: observedAt, observations }
  }
}
