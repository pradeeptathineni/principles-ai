import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

function javascriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? javascriptFiles(path) : /\.(?:js|mjs)$/.test(entry.name) ? [path] : []
  })
}

for (const file of [...javascriptFiles('src'), ...javascriptFiles('bin'), ...javascriptFiles('scripts')]) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
