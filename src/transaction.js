import { createHash } from 'node:crypto'
import { closeSync, existsSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { safeResolve } from './repository.js'

export function fileSha256(root, path) {
  const absolute = safeResolve(root, path)
  return createHash('sha256').update(readFileSync(absolute)).digest('hex')
}

export function applyRepositoryTransaction(root, changes, validate) {
  if (!Array.isArray(changes) || changes.length === 0) throw new Error('Transaction requires at least one file change')
  const paths = changes.map((change) => change.path)
  if (new Set(paths).size !== paths.length) throw new Error('Transaction cannot write the same path twice')
  const lockPath = join(root, '.principles-write.lock')
  let lock
  try {
    lock = openSync(lockPath, 'wx')
    writeFileSync(lock, `${process.pid}\n`, 'utf8')
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Another canonical repository mutation holds ${lockPath}`)
    throw error
  }
  const originals = new Map()
  const staged = []
  try {
    for (const change of changes) {
      const absolute = safeResolve(root, change.path, { mustExist: false })
      const existed = existsSync(absolute)
      const original = existed ? readFileSync(absolute) : null
      originals.set(change.path, original)
      if (change.expected_sha256) {
        if (!original) throw new Error(`${change.path} does not exist for expected hash verification`)
        const actual = createHash('sha256').update(original).digest('hex')
        if (actual !== change.expected_sha256) throw new Error(`${change.path} changed since the mutation plan was prepared`)
      }
      const temporary = join(dirname(absolute), `.${basename(absolute)}.principles-tmp-${process.pid}-${staged.length}`)
      writeFileSync(temporary, change.content, { encoding: 'utf8', flag: 'wx' })
      staged.push({ absolute, temporary })
    }
    for (const item of staged) renameSync(item.temporary, item.absolute)
    const validation = validate()
    if (validation?.bag?.errorCount > 0) {
      const messages = validation.bag.sorted().slice(0, 8).map((item) => `${item.path} ${item.code}: ${item.message}`).join('\n')
      throw new Error(`Transaction failed repository validation:\n${messages}`)
    }
    return validation
  } catch (error) {
    for (const item of staged) if (existsSync(item.temporary)) unlinkSync(item.temporary)
    for (const [path, original] of originals) {
      const absolute = safeResolve(root, path, { mustExist: false })
      if (original === null) {
        if (existsSync(absolute)) unlinkSync(absolute)
      } else writeFileSync(absolute, original)
    }
    throw error
  } finally {
    closeSync(lock)
    if (existsSync(lockPath)) unlinkSync(lockPath)
  }
}
