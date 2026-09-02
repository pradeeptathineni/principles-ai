import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

export function materializeGitTree(root, ref) {
  if (!/^[0-9A-Za-z._\/-]+$/.test(ref) || ref.startsWith('-') || ref.includes('..')) throw new Error(`Unsafe git baseline ref ${ref}`)
  const directory = mkdtempSync(join(tmpdir(), 'principles-baseline-'))
  const archive = spawnSync('git', ['archive', '--format=tar', ref], { cwd: root, maxBuffer: 64 * 1024 * 1024 })
  if (archive.status !== 0) {
    rmSync(directory, { recursive: true, force: true })
    throw new Error(`Unable to archive trusted baseline ${ref}: ${archive.stderr.toString().trim()}`)
  }
  const extract = spawnSync('tar', ['-xf', '-', '-C', directory], { input: archive.stdout, maxBuffer: 64 * 1024 * 1024 })
  if (extract.status !== 0) {
    rmSync(directory, { recursive: true, force: true })
    throw new Error(`Unable to extract trusted baseline ${ref}: ${extract.stderr.toString().trim()}`)
  }
  return { root: directory, cleanup: () => rmSync(directory, { recursive: true, force: true }) }
}
