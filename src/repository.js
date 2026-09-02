import { existsSync, lstatSync, readdirSync, realpathSync, readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { TextDecoder } from 'node:util'
import { DiagnosticBag } from './diagnostics.js'

const decoder = new TextDecoder('utf-8', { fatal: true })

export function discoverRepository(start = process.cwd()) {
  let candidate = realpathSync(start)
  if (!statSync(candidate).isDirectory()) candidate = dirname(candidate)
  while (true) {
    if (existsSync(join(candidate, 'AGENTS.md')) &&
        existsSync(join(candidate, 'config', 'schema.yaml')) &&
        existsSync(join(candidate, 'domains'))) return candidate
    const parent = dirname(candidate)
    if (parent === candidate) throw new Error(`No principles repository found from ${start}`)
    candidate = parent
  }
}

export function toRepoPath(root, absolutePath) {
  return relative(realpathSync(root), absolutePath).split(sep).join('/')
}

export function safeResolve(root, repositoryPath, { mustExist = true } = {}) {
  if (typeof repositoryPath !== 'string' || repositoryPath.length === 0 ||
      repositoryPath.includes('\0') || repositoryPath.includes('\\') || isAbsolute(repositoryPath)) {
    throw new Error(`Unsafe repository path: ${repositoryPath}`)
  }
  const segments = repositoryPath.split('/')
  if (segments.some((part) => part === '' || part === '.' || part === '..')) {
    throw new Error(`Unsafe repository path: ${repositoryPath}`)
  }
  const rootReal = realpathSync(root)
  const target = resolve(rootReal, ...segments)
  const rel = relative(rootReal, target)
  if (rel.startsWith(`..${sep}`) || rel === '..' || isAbsolute(rel)) {
    throw new Error(`Repository path escapes root: ${repositoryPath}`)
  }
  if (mustExist) {
    const real = realpathSync(target)
    const realRel = relative(rootReal, real)
    if (realRel.startsWith(`..${sep}`) || realRel === '..' || isAbsolute(realRel)) {
      throw new Error(`Repository symlink escapes root: ${repositoryPath}`)
    }
    return real
  }
  if (existsSync(target)) {
    const real = realpathSync(target)
    const realRel = relative(rootReal, real)
    if (realRel.startsWith(`..${sep}`) || realRel === '..' || isAbsolute(realRel)) {
      throw new Error(`Repository symlink escapes root: ${repositoryPath}`)
    }
    return target
  }
  let parent = dirname(target)
  while (!existsSync(parent)) parent = dirname(parent)
  const parentReal = realpathSync(parent)
  const parentRel = relative(rootReal, parentReal)
  if (parentRel.startsWith(`..${sep}`) || parentRel === '..' || isAbsolute(parentRel)) {
    throw new Error(`Repository output path escapes root: ${repositoryPath}`)
  }
  return target
}

export function walkRepository(root, startPath, { includeSymlinks = false } = {}) {
  const start = safeResolve(root, startPath)
  const results = []
  function walk(absolute) {
    for (const entry of readdirSync(absolute, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(absolute, entry.name)
      if (entry.isSymbolicLink()) {
        if (includeSymlinks) results.push(path)
        continue
      }
      if (entry.isDirectory()) walk(path)
      else if (entry.isFile()) results.push(path)
    }
  }
  if (lstatSync(start).isDirectory()) walk(start)
  else results.push(start)
  return results
}

export function walkCanonicalRepository(root, startPath, bag, { optional = false } = {}) {
  let paths
  try {
    paths = walkRepository(root, startPath, { includeSymlinks: true })
  } catch (error) {
    if (optional && !existsSync(join(realpathSync(root), startPath))) return []
    bag.error('PATH_DISCOVERY', error.message, startPath)
    return []
  }
  const safe = []
  for (const absolute of paths) {
    if (!lstatSync(absolute).isSymbolicLink()) {
      safe.push(absolute)
      continue
    }
    const repositoryPath = relative(realpathSync(root), absolute).split(sep).join('/')
    try {
      const resolved = safeResolve(root, repositoryPath)
      if (!statSync(resolved).isFile()) {
        bag.error('PATH_SYMLINK_DIRECTORY', 'Canonical directory symlinks are forbidden to avoid cycles and ambiguous discovery.', repositoryPath)
        continue
      }
      safe.push(absolute)
    } catch (error) {
      bag.error('PATH_UNSAFE', error.message, repositoryPath)
    }
  }
  return safe
}

export function readCanonicalText(root, repositoryPath, bag = new DiagnosticBag(), { maxBytes = Infinity, historical = false } = {}) {
  let absolute
  try {
    absolute = safeResolve(root, repositoryPath)
  } catch (error) {
    bag.error('PATH_UNSAFE', error.message, repositoryPath)
    return null
  }
  const bytes = readFileSync(absolute)
  if (bytes.length > maxBytes) {
    bag.error('TEXT_TOO_LARGE', `File is ${bytes.length} bytes; limit is ${maxBytes}.`, repositoryPath)
    return null
  }
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    bag.error('TEXT_BOM', 'UTF-8 byte-order marks are forbidden.', repositoryPath)
    return null
  }
  let text
  try {
    text = decoder.decode(bytes)
  } catch {
    bag.error('TEXT_UTF8', 'File is not valid UTF-8.', repositoryPath)
    return null
  }
  if (historical) return text
  if (text.includes('\r')) bag.error('TEXT_LINE_ENDING', 'Canonical text must use LF line endings.', repositoryPath)
  if (!text.endsWith('\n')) bag.error('TEXT_FINAL_NEWLINE', 'Canonical text must end with a newline.', repositoryPath)
  if (text.normalize('NFC') !== text) bag.error('TEXT_NFC', 'Canonical text must be Unicode NFC.', repositoryPath)
  for (const [index, line] of text.split('\n').entries()) {
    const match = /[ \t]+$/.exec(line)
    if (match) bag.error('TEXT_TRAILING_WHITESPACE', 'Trailing whitespace is forbidden.', repositoryPath, { line: index + 1, column: match.index + 1 })
  }
  return text
}

export function assertMetadataStrings(value, bag, path, pointer = '', skip = new Set()) {
  if (typeof value === 'string') {
    if (!skip.has(pointer) && (value.length === 0 || value.trim() !== value)) {
      bag.error('METADATA_STRING', `Metadata string at ${pointer || '/'} must be non-empty and trimmed.`, path)
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertMetadataStrings(item, bag, path, `${pointer}/${index}`, skip))
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) assertMetadataStrings(item, bag, path, `${pointer}/${key}`, skip)
  }
}
