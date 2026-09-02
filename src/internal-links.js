import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { join, posix } from 'node:path'
import { visit } from 'unist-util-visit'
import { processor } from './markdown.js'
import { readCanonicalText, safeResolve, toRepoPath, walkCanonicalRepository } from './repository.js'

function included(path) {
  return path === 'AGENTS.md' || path === 'README.md' ||
    /^(?:\.github|config\/templates|docs|domains|evidence|evals|generated|prompts|scripts|sources|tests)\/.*\.md$/.test(path)
}

function hasExactComponents(root, targetPath) {
  let current = realpathSync(root)
  for (const component of targetPath.split('/')) {
    if (!readdirSync(current).includes(component)) return false
    current = join(current, component)
  }
  return true
}

export function markdownPathsForInternalLinks(root, bag = { error() {} }) {
  const paths = [safeResolve(root, 'AGENTS.md'), safeResolve(root, 'README.md')]
  for (const directory of ['.github', 'config', 'docs', 'domains', 'evidence', 'evals', 'generated', 'prompts', 'scripts', 'sources', 'tests']) {
    paths.push(...walkCanonicalRepository(root, directory, bag, { optional: true }))
  }
  return [...new Set(paths.map((path) => toRepoPath(root, path)).filter((path) => included(path) && !path.startsWith('docs/reviews/')))].sort()
}

function validateDestination(root, sourcePath, destination, bag, location = {}) {
  const scheme = /^([A-Za-z][A-Za-z0-9+.-]*):/.exec(destination)?.[1]?.toLowerCase()
  if (scheme) {
    if (!['http', 'https'].includes(scheme)) bag.error('EXTERNAL_LINK_SCHEME', `External links permit only reviewed HTTP(S) destinations: ${destination}`, sourcePath, location)
    return
  }
  if (destination.startsWith('//') || destination.startsWith('/')) {
    bag.error('INTERNAL_LINK_ABSOLUTE', `Internal link must use a relative repository path: ${destination}`, sourcePath, location)
    return
  }
  const beforeFragment = destination.split('#', 1)[0]
  if (beforeFragment.includes('?')) bag.error('INTERNAL_LINK_QUERY', `Internal link queries are forbidden: ${destination}`, sourcePath, location)
  const pathPart = beforeFragment.split('?', 1)[0]
  if (pathPart.includes('%')) bag.error('INTERNAL_LINK_PERCENT', `Percent-encoded path octets are forbidden: ${destination}`, sourcePath, location)
  const targetPath = pathPart === '' ? sourcePath : posix.normalize(posix.join(posix.dirname(sourcePath), pathPart))
  if (targetPath === '..' || targetPath.startsWith('../')) {
    bag.error('INTERNAL_LINK_TRAVERSAL', `Internal link escapes the repository: ${destination}`, sourcePath, location)
    return
  }
  try {
    const candidate = safeResolve(root, targetPath, { mustExist: false })
    if (!existsSync(candidate)) bag.error('INTERNAL_LINK_MISSING', `Internal link destination does not exist: ${destination}`, sourcePath, location)
    else {
      safeResolve(root, targetPath)
      if (!hasExactComponents(root, targetPath)) bag.error('INTERNAL_LINK_CASE', `Internal link path casing does not exactly match repository components: ${destination}`, sourcePath, location)
    }
  } catch (error) {
    bag.error('INTERNAL_LINK_UNSAFE', error.message, sourcePath, location)
  }
}

export function validateInternalLinks(root, bag) {
  for (const path of markdownPathsForInternalLinks(root, bag)) {
    const text = readCanonicalText(root, path, bag, { historical: false })
    if (text === null) continue
    const tree = processor.parse(text)
    visit(tree, (node) => {
      if (node.type === 'link' || node.type === 'definition') validateDestination(root, path, node.url, bag, node.position ? { line: node.position.start.line, column: node.position.start.column } : {})
    })
  }
}

export function collectExternalUrls(root, sources, bag = { error() {} }, { excludedPrefixes = [] } = {}) {
  const urls = new Set()
  for (const source of sources) for (const url of [source.value.canonical_url, ...source.value.url_aliases]) urls.add(url)
  for (const path of markdownPathsForInternalLinks(root, bag)) {
    if (excludedPrefixes.some((prefix) => path.startsWith(prefix))) continue
    const text = readFileSync(safeResolve(root, path), 'utf8')
    const tree = processor.parse(text)
    visit(tree, (node) => {
      if ((node.type === 'link' || node.type === 'definition') && /^https?:\/\//i.test(node.url)) urls.add(node.url)
    })
  }
  return [...urls].sort()
}
