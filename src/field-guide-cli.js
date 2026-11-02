import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import { createFieldGuideService } from './field-guide.js'

function options(args) {
  const allowed = new Set(['--root', '--owner-revision', '--source-root', '--input', '--output'])
  const values = {}
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index]
    if (!allowed.has(key)) throw new Error(`Unknown option ${key}`)
    if (Object.hasOwn(values, key)) throw new Error(`Duplicate option ${key}`)
    const value = args[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`${key} requires a value`)
    values[key] = value
    index += 1
  }
  for (const key of ['--root', '--owner-revision', '--input']) if (!values[key]) throw new Error(`${key} is required`)
  return values
}

function input(path) {
  return JSON.parse(path === '-' ? readFileSync(0, 'utf8') : readFileSync(resolve(path), 'utf8'))
}

function output(path, root, value) {
  const serialized = `${JSON.stringify(value, null, 2)}\n`
  if (!path || path === '-') {
    process.stdout.write(serialized)
    return
  }
  const destination = resolve(path)
  const canonicalRoot = realpathSync(root)
  if (destination === canonicalRoot || destination.startsWith(`${canonicalRoot}${sep}`)) throw new Error('Field-guide output must be outside the canonical Principles corpus.')
  if (existsSync(destination)) throw new Error('Refusing to overwrite an existing field-guide output.')
  const parent = realpathSync(dirname(destination))
  if (parent === canonicalRoot || parent.startsWith(`${canonicalRoot}${sep}`)) throw new Error('Field-guide output directory must be outside the canonical Principles corpus.')
  writeFileSync(destination, serialized, { flag: 'wx', mode: 0o600 })
}

function usage() {
  return `field-guide COMMAND --root CORPUS --owner-revision SHA --input REQUEST.json [options]

Commands:
  create     Export a read-only guide from explicit active principle IDs.
  read       Cold-read a saved guide and refuse stale local inputs.

Options:
  --source-root PATH  Principles owner checkout used by Atlas.
  --output PATH|-     Create writes only outside the corpus; default is stdout.
`
}

export async function main(args) {
  if (args.length === 0 || ['-h', '--help', 'help'].includes(args[0])) {
    process.stdout.write(usage())
    return 0
  }
  try {
    const [command, ...rest] = args
    if (!['create', 'read'].includes(command)) throw new Error(`Unknown field-guide command ${command}`)
    const values = options(rest)
    const service = createFieldGuideService({ root: values['--root'], ownerRevision: values['--owner-revision'], sourceRoot: values['--source-root'] })
    const data = input(values['--input'])
    const result = command === 'create' ? service.create(data) : service.read(data)
    output(values['--output'], values['--root'], result)
    return 0
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 2
  }
}
