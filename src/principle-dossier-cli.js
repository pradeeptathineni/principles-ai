import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createPrincipleDossierService } from './principle-dossier.js'

const commands = new Set(['list', 'show', 'propose', 'revise', 'review', 'adopt', 'activate', 'retire', 'recover'])
const commonOptions = new Set(['--root', '--store', '--targets'])

function validateOptions(args, command) {
  const commandOptions = command === 'show' ? ['--id', '--version']
    : command === 'recover' ? ['--request-id']
      : ['--request-id', '--input']
  const allowed = new Set([...commonOptions, ...(command === 'list' ? [] : commandOptions)])
  const seen = new Set()
  for (let index = 1; index < args.length; index += 1) {
    const name = args[index]
    if (!name.startsWith('--') || !allowed.has(name)) throw new Error(`Unknown option or argument ${name}`)
    if (seen.has(name)) throw new Error(`Duplicate option ${name}`)
    seen.add(name)
    const value = args[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`)
    index += 1
  }
}

function option(args, name, fallback = null) {
  const index = args.indexOf(name)
  if (index < 0) return fallback
  const value = args[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`)
  return value
}

function jsonInput(path) {
  const text = path === '-' ? readFileSync(0, 'utf8') : readFileSync(resolve(path), 'utf8')
  return JSON.parse(text)
}

function usage() {
  return `principle-dossier COMMAND --root ROOT --store STORE --targets TARGETS.json [options]\n\nCommands:\n  list                               List retained proposal dossiers\n  show --id UUID [--version N]       Read one retained proposal version\n  propose --request-id UUID --input FILE|-\n  revise --request-id UUID --input FILE|-\n  review --request-id UUID --input FILE|-\n  adopt --request-id UUID --input FILE|-\n  activate --request-id UUID --input FILE|-\n  retire --request-id UUID --input FILE|-\n  recover --request-id UUID          Recover or durably fence this exact request\n\nMutation inputs are JSON objects matching the native Principles dossier service.\nTargets JSON is an array of {"id":"target-id","path":"domains/domain/scope.md"}.\nThe store must be a private directory outside ROOT. Human review fields and exact version/event digests are required by the service.\n`
}

function mutationExitCode(result) {
  if (result.status === 'confirmed') return 0
  if (result.status === 'unknown') return 3
  if (result.status === 'rejected' || result.status === 'not_seen') return 1
  return 2
}

function emit(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

export async function main(args) {
  if (args.length === 0 || ['-h', '--help', 'help'].includes(args[0])) {
    process.stdout.write(usage())
    return 0
  }
  try {
    const [command] = args
    if (!commands.has(command)) throw new Error(`Unknown dossier command: ${command}`)
    validateOptions(args, command)
    const root = option(args, '--root')
    if (!root) throw new Error('Dossier commands require explicit --root')
    const store = option(args, '--store')
    const targetsPath = option(args, '--targets')
    if (!store || !targetsPath) throw new Error('Dossier commands require --store and --targets')
    const targets = jsonInput(targetsPath)
    if (!Array.isArray(targets)) throw new Error('--targets must contain a JSON array')
    const service = createPrincipleDossierService({ root, store, adoptionTargets: targets })
    if (command === 'list') {
      const rows = readdirSync(store, { withFileTypes: true })
        .filter((entry) => entry.isFile() && /^[a-f0-9-]{36}\.json$/.test(entry.name))
        .map((entry) => service.read(entry.name.slice(0, -5)))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((record) => ({ id: record.id, version: record.version, status: record.status, title: record.proposal.title, versionSha256: record.versionSha256 }))
      emit(rows)
      return 0
    }
    if (command === 'show') {
      const id = option(args, '--id')
      if (!id) throw new Error('show requires --id UUID')
      const versionText = option(args, '--version')
      const version = versionText === null ? undefined : Number(versionText)
      if (versionText !== null && (!Number.isSafeInteger(version) || version < 1)) throw new Error('--version must be a positive integer')
      emit(service.read(id, version))
      return 0
    }
    const requestId = option(args, '--request-id')
    if (!requestId) throw new Error(`${command} requires --request-id UUID`)
    if (command === 'recover') {
      const result = service.recoverMutation({ requestId })
      emit(result)
      return mutationExitCode(result)
    }
    const inputPath = option(args, '--input')
    if (!inputPath) throw new Error(`${command} requires --input FILE|-`)
    const input = jsonInput(inputPath)
    const result = await service.mutate({ requestId, operation: command, input })
    emit(result)
    return mutationExitCode(result)
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 2
  }
}
