import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { discoverRepository, safeResolve } from './repository.js'
import { formatHuman, formatJson, DiagnosticBag } from './diagnostics.js'
import { validateRepository } from './validator.js'
import { materializeGitTree } from './baseline.js'
import { buildContext } from './context.js'
import { runOperationalChecks } from './operational.js'
import { formatWorkflowStatus, inspectDomainFurnishingWorkflow, inspectOutcomeWorkflow } from './workflow.js'

function option(args, name, fallback = null) {
  const index = args.indexOf(name)
  if (index < 0) return fallback
  const value = args[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`)
  return value
}

function options(args, name) {
  return args.flatMap((value, index) => value === name ? [args[index + 1]] : []).filter(Boolean)
}

function outputDiagnostics(result, json) {
  process.stdout.write(json ? formatJson(result.bag, { transition_status: result.transitionStatus, human_gates: result.humanGates }) : formatHuman(result.bag))
  if (!json && result.humanGates?.length) process.stdout.write(`Human approval required: ${result.humanGates.join(', ')}\n`)
}

function claimModel({ role, text, citationLabels, claimSha256 }) {
  return { role, text, citation_labels: citationLabels, claim_sha256: claimSha256 }
}

function writeOutput(root, destination, content) {
  if (!destination || destination === '-') process.stdout.write(content)
  else {
    const absolute = safeResolve(root, destination, { mustExist: false })
    mkdirSync(dirname(absolute), { recursive: true })
    writeFileSync(absolute, content, 'utf8')
  }
}

function usage() {
  return `principles commands:\n  validate [--json] [--baseline-ref REF]\n  workflow (--target domains/<domain>/<file>.md | --domain <domain>) [--json]\n  taxonomy [--output PATH] [--check PATH]\n  parse [--output PATH]\n  context --profile PROFILE (--file ID|PATH | --principle PRN-......) --revision REV [--generated-at ISO] [--output PATH]\n  links external [--baseline PATH] [--as-of YYYY-MM-DD] [--snapshot-output PATH] [--json]\n`
}

export async function main(args) {
  if (args.length === 0 || ['-h', '--help', 'help'].includes(args[0])) {
    process.stdout.write(usage())
    return 0
  }
  const knownOptions = new Set(['--root', '--offline', '--json', '--baseline-ref', '--output', '--check', '--profile', '--file', '--principle', '--revision', '--generated-at', '--baseline', '--as-of', '--snapshot-output', '--target', '--domain'])
  const unknown = args.find((argument) => argument.startsWith('--') && !knownOptions.has(argument))
  if (unknown) {
    process.stderr.write(`Unknown option ${unknown}\n`)
    return 2
  }
  let root
  try { root = discoverRepository(option(args, '--root', process.cwd())) } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 2
  }
  let baseline
  try {
    const baselineRef = option(args, '--baseline-ref')
    if (baselineRef) baseline = materializeGitTree(root, baselineRef)
    const result = validateRepository(root, { baselineRoot: baseline?.root })
    const [command, subcommand] = args
    if (command === 'validate') {
      outputDiagnostics(result, args.includes('--json'))
      return result.bag.errorCount === 0 ? 0 : 1
    }
    if (result.bag.errorCount > 0) {
      outputDiagnostics(result, args.includes('--json'))
      return 1
    }
    if (command === 'workflow') {
      try {
        const target = option(args, '--target')
        const domain = option(args, '--domain')
        if (Boolean(target) === Boolean(domain)) throw new Error('Workflow requires exactly one of --target or --domain')
        const status = domain ? inspectDomainFurnishingWorkflow(result.state, domain) : inspectOutcomeWorkflow(result.state, target)
        process.stdout.write(args.includes('--json') ? `${JSON.stringify(status, null, 2)}\n` : formatWorkflowStatus(status))
        return 0
      } catch (error) {
        process.stderr.write(`${error.message}\n`)
        return 2
      }
    }
    if (command === 'taxonomy') {
      const check = option(args, '--check')
      if (check) {
        const actual = readFileSync(safeResolve(root, check), 'utf8')
        if (actual !== result.generated.taxonomy) {
          process.stderr.write(`${check} is not reproducible from canonical inputs.\n`)
          return 1
        }
      } else writeOutput(root, option(args, '--output', '-'), result.generated.taxonomy)
      return 0
    }
    if (command === 'parse') {
      const models = result.state.corpus.documents.map((document) => ({
        path: document.path,
        frontmatter: document.frontmatter,
        title: document.title,
        introduction: document.introduction,
        input_sha256: document.inputSha256,
        entries: document.entries.map((entry) => ({
          id: entry.id,
          title: entry.title,
          statement: claimModel(entry.statement),
          why: entry.why.map(claimModel),
          practices: entry.practices.map(claimModel),
          applicability: entry.applicability.map(claimModel),
          goals: entry.goals.map(claimModel),
          tags: entry.tags,
          reviewed_claims: entry.claims.map(claimModel)
        })),
        references: document.references.map(({ label, sourceId, title, definition }) => ({ label, source_id: sourceId, title, url: definition?.url ?? null }))
      }))
      writeOutput(root, option(args, '--output', '-'), `${JSON.stringify({ schema_version: 1, documents: models }, null, 2)}\n`)
      return 0
    }
    if (command === 'context') {
      try {
        const context = buildContext({
          documents: result.state.corpus.documents,
          entryById: result.state.corpus.entryById,
          sourceById: result.state.sourceById,
          evidenceByEntryId: result.state.evidenceByEntryId,
          evaluatorConfigs: result.state.evaluatorConfigs,
          profile: option(args, '--profile', 'standard'),
          fileIds: options(args, '--file'),
          principleIds: options(args, '--principle'),
          revision: option(args, '--revision'),
          generatedAt: option(args, '--generated-at')
        })
        writeOutput(root, option(args, '--output', '-'), `${JSON.stringify(context, null, 2)}\n`)
        return 0
      } catch (error) {
        process.stderr.write(`${error.message}\n`)
        return 2
      }
    }
    if (command === 'links' && subcommand === 'external') {
      const bag = new DiagnosticBag()
      let operationalBaseline = null
      const baselinePath = option(args, '--baseline')
      if (baselinePath) {
        try {
          operationalBaseline = JSON.parse(readFileSync(safeResolve(root, baselinePath), 'utf8'))
        } catch (error) {
          bag.error('SOURCE_CONTENT_BASELINE_INVALID', error.message, baselinePath)
        }
      }
      let operational
      try {
        operational = await runOperationalChecks({
          root,
          sources: result.state.sources,
          sourcePolicy: result.state.policies['source-policy'],
          bag,
          baseline: operationalBaseline,
          asOf: option(args, '--as-of')
        })
      } catch (error) {
        bag.error('OPERATIONAL_CHECK_FAILED', error.message, '<operational>')
      }
      const snapshotOutput = option(args, '--snapshot-output')
      if (snapshotOutput && operational) writeOutput(root, snapshotOutput, `${JSON.stringify(operational.snapshot, null, 2)}\n`)
      process.stdout.write(args.includes('--json') ? formatJson(bag, { class: 'operational', ...(operational ?? {}) }) : formatHuman(bag))
      return bag.errorCount === 0 ? 0 : 1
    }
    process.stderr.write(usage())
    return 2
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 2
  } finally {
    baseline?.cleanup()
  }
}
