import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createPrincipleAtlasService } from './principle-atlas.js'

const optionSets = {
  search: ['--root', '--owner-revision', '--source-root', '--query', '--domain', '--scope', '--limit'],
  show: ['--root', '--owner-revision', '--source-root', '--entry-id'],
  source: ['--root', '--owner-revision', '--source-root', '--source-id'],
  compare: ['--root', '--owner-revision', '--source-root', '--entry-ids'],
  coverage: ['--root', '--owner-revision', '--source-root', '--domain', '--expected-corpus-revision'],
  'decision.create': ['--root', '--owner-revision', '--source-root', '--store', '--request-id', '--input'],
  'decision.successor': ['--root', '--owner-revision', '--source-root', '--store', '--request-id', '--input'],
  'decision.list': ['--root', '--owner-revision', '--source-root', '--store'],
  'decision.read': ['--root', '--owner-revision', '--source-root', '--store', '--id'],
  'decision.revisit': ['--root', '--owner-revision', '--source-root', '--store', '--id'],
  'decision.recover': ['--root', '--owner-revision', '--source-root', '--store', '--request-id']
}

function parseOptions(args, allowed) {
  const values = {}
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index]
    if (!allowed.includes(key)) throw new Error(`Unknown option ${key}`)
    if (Object.hasOwn(values, key)) throw new Error(`Duplicate option ${key}`)
    const value = args[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`${key} requires a value`)
    values[key] = value
    index += 1
  }
  for (const key of ['--root', '--owner-revision']) if (!values[key]) throw new Error(`${key} is required`)
  return values
}

function inputFile(path) {
  return JSON.parse(path === '-' ? readFileSync(0, 'utf8') : readFileSync(resolve(path), 'utf8'))
}

function usage() {
  return `principle-atlas COMMAND --root ROOT --owner-revision SHA [options]

Commands:
  search --query TEXT [--domain ID] [--scope ID] [--limit N]
  show --entry-id PRN-......
  source --source-id SRC-......
  compare --entry-ids PRN-......,PRN-......
  coverage [--domain ID] [--expected-corpus-revision SHA256]
  decision create --store STORE --request-id UUID --input FILE|-
  decision successor --store STORE --request-id UUID --input FILE|-
  decision list --store STORE
  decision read --store STORE --id UUID
  decision revisit --store STORE --id UUID
  decision recover --store STORE --request-id UUID

Optional: --source-root ENGINE_ROOT (defaults to this CLI's owner checkout).

Atlas reads use canonical validated corpus/source identities. Decisions require an explicit private store outside the corpus and are caller-authored.
`
}

export async function main(args) {
  if (args.length === 0 || ['-h', '--help', 'help'].includes(args[0])) {
    process.stdout.write(usage())
    return 0
  }
  try {
    const command = args[0] === 'decision' ? `decision.${args[1] ?? ''}` : args[0]
    const optionStart = args[0] === 'decision' ? 2 : 1
    const allowed = optionSets[command]
    if (!allowed) throw new Error(`Unknown atlas command ${args.slice(0, optionStart).join(' ')}`)
    const options = parseOptions(args.slice(optionStart), allowed)
    const service = createPrincipleAtlasService({ root: options['--root'], ownerRevision: options['--owner-revision'], sourceRoot: options['--source-root'], store: options['--store'] })
    let result
    if (command === 'search') result = service.search({ query: options['--query'], domain: options['--domain'] ?? null, scope: options['--scope'] ?? null, limit: options['--limit'] ? Number(options['--limit']) : undefined })
    else if (command === 'show') result = service.show({ entryId: options['--entry-id'] })
    else if (command === 'source') result = service.source({ sourceId: options['--source-id'] })
    else if (command === 'compare') result = service.compare({ entryIds: options['--entry-ids']?.split(',') })
    else if (command === 'coverage') result = service.domainCoverage({ domainId: options['--domain'] ?? null, expectedCorpusRevision: options['--expected-corpus-revision'] ?? null })
    else if (command === 'decision.create' || command === 'decision.successor') {
      const input = inputFile(options['--input'])
      result = command === 'decision.create' ? service.createDecision({ requestId: options['--request-id'], input }) : service.createSuccessor({ requestId: options['--request-id'], input })
      if (result.status !== 'confirmed') {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
        return result.status === 'unknown' ? 3 : 1
      }
    } else if (command === 'decision.list') result = service.listDecisions()
    else if (command === 'decision.read') result = service.readDecision({ decisionId: options['--id'] })
    else if (command === 'decision.revisit') result = service.revisit({ decisionId: options['--id'] })
    else result = service.recoverMutation({ requestId: options['--request-id'] })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    return 0
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 2
  }
}
