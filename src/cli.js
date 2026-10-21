import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { discoverRepository, safeResolve } from './repository.js'
import { formatHuman, formatJson, DiagnosticBag } from './diagnostics.js'
import { validateRepository } from './validator.js'
import { materializeGitTree } from './baseline.js'
import { buildContext } from './context.js'
import { runOperationalChecks } from './operational.js'
import {
  applyActivationManifest,
  buildActivationManifest,
  allocatePrincipleIdentities,
  buildActivationPackage,
  buildActivationReview,
  buildDomainPreparation,
  buildEvidenceScaffold,
  buildRunCheckpoint,
  loadMutationPlan,
  materializeContent,
  materializeContents,
  registerSource,
  registerSources,
  renderContentScaffold,
  synchronizeCitations,
  synchronizeDomainCitations,
  verifyRunCheckpoint,
  yaml
} from './mutation.js'
import {
  formatWorkflowStatus,
  inspectDomainFurnishingWorkflow,
  inspectDomainRefinementWorkflow,
  inspectNewDomainWorkflow,
  inspectOutcomeWorkflow,
  inspectRoutedOutcome,
  validateWorkflowStatus
} from './workflow.js'

function option(args, name, fallback = null) {
  const index = args.indexOf(name)
  if (index < 0) return fallback
  const value = args[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`)
  return value
}

function options(args, name) {
  return args.flatMap((value, index) => {
    if (value !== name) return []
    const selected = args[index + 1]
    if (!selected || selected.startsWith('--')) throw new Error(`${name} requires a value`)
    return [selected]
  })
}

function outputDiagnostics(result, json) {
  process.stdout.write(json ? formatJson(result.bag, {
    transition_status: result.transitionStatus,
    routine_transitions: result.routineTransitions,
    human_gates: result.humanGates,
    architecture_review: result.architectureReview
  }) : formatHuman(result.bag))
  if (!json && result.routineTransitions?.length) process.stdout.write(`Outcome-authorized transition: ${result.routineTransitions.join(', ')}\n`)
  if (!json && result.humanGates?.length) process.stdout.write(`Human approval required: ${result.humanGates.join(', ')}\n`)
  if (!json && result.architectureReview?.required) process.stdout.write(`Architecture review required for: ${result.architectureReview.categories.join(', ')}\n`)
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
  return `principles commands:\n  validate [--json] [--baseline-ref REF] [--authorized-taxonomy-target DOMAIN[/SUBDOMAIN]]\n  workflow [--outcome OUTCOME] [--target domains/<domain>/<file>.md | --domain <domain>] [--json]\n  prepare --domain DOMAIN [--baseline-ref REF] [--output PATH]\n  run checkpoint --domain DOMAIN --input DECLARATIONS.yaml [--output PATH]\n  run checkpoint --check CHECKPOINT.json [--json]\n  identity allocate --kind principle --count N [--baseline-ref REF] [--json]\n  source register --input PLAN.yaml|- [--baseline-ref REF] [--json]\n  content scaffold --target domains/<domain>/<file>.md [--output PATH]\n  content materialize --input PLAN.yaml|- [--baseline-ref REF] [--json]\n  citations sync (--target domains/<domain>/<file>.md | --domain DOMAIN) [--apply] [--output PATH]\n  evidence scaffold --entry PRN-...... [--output PATH]\n  activation package [--domain DOMAIN] [--baseline-ref REF] [--output PATH] [--review-output PATH]\n  activation manifest --input PACKAGE.json --reviewed-at YYYY-MM-DD (--all | --target PATH...) [--output PATH]\n  activation apply --input MANIFEST.yaml [--baseline-ref REF] [--json]\n  taxonomy [--output PATH] [--check PATH]\n  parse [--output PATH]\n  context --profile PROFILE (--file ID|PATH | --principle PRN-......) --revision REV [--expected-input-sha256 SHA256] [--generated-at ISO] [--output PATH]\n  links external [--domain DOMAIN | --source SRC-......] [--baseline PATH] [--as-of YYYY-MM-DD] [--snapshot-output PATH] [--json]\n`
}

export async function main(args) {
  if (args.length === 0 || ['-h', '--help', 'help'].includes(args[0])) {
    process.stdout.write(usage())
    return 0
  }
  const knownOptions = new Set(['--root', '--offline', '--json', '--apply', '--all', '--baseline-ref', '--authorized-taxonomy-target', '--output', '--review-output', '--reviewed-at', '--input', '--entry', '--kind', '--count', '--check', '--profile', '--file', '--principle', '--source', '--revision', '--expected-input-sha256', '--generated-at', '--baseline', '--as-of', '--snapshot-output', '--target', '--domain', '--outcome'])
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
    const authorizedTaxonomyTargets = new Set(options(args, '--authorized-taxonomy-target'))
    for (const target of authorizedTaxonomyTargets) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/.test(target)) throw new Error(`Invalid authorized taxonomy target ${target}`)
    }
    const result = validateRepository(root, { baselineRoot: baseline?.root, authorizedTaxonomyTargets })
    const [command, subcommand] = args
    if (command === 'validate') {
      outputDiagnostics(result, args.includes('--json'))
      return result.bag.errorCount === 0 ? 0 : 1
    }
    if (result.bag.errorCount > 0) {
      outputDiagnostics(result, args.includes('--json'))
      return 1
    }
    const validateAfterMutation = () => validateRepository(root, { baselineRoot: baseline?.root, authorizedTaxonomyTargets })
    if (command === 'prepare') {
      const domain = option(args, '--domain')
      if (!domain) throw new Error('prepare requires --domain')
      writeOutput(root, option(args, '--output', '-'), `${JSON.stringify(buildDomainPreparation(root, result, domain), null, 2)}\n`)
      return 0
    }
    if (command === 'run' && subcommand === 'checkpoint') {
      const check = option(args, '--check')
      if (check) {
        if (option(args, '--domain') || option(args, '--input')) throw new Error('Run checkpoint verification accepts --check without --domain or --input')
        const outcome = verifyRunCheckpoint(root, result, loadMutationPlan(root, check))
        process.stdout.write(`${JSON.stringify(outcome, null, 2)}\n`)
        return outcome.valid ? 0 : 1
      }
      const domain = option(args, '--domain')
      const input = option(args, '--input')
      if (!domain || !input) throw new Error('Run checkpoint creation requires --domain and --input')
      writeOutput(root, option(args, '--output', '-'), `${JSON.stringify(buildRunCheckpoint(root, result, domain, loadMutationPlan(root, input)), null, 2)}\n`)
      return 0
    }
    if (command === 'identity' && subcommand === 'allocate') {
      if (option(args, '--kind') !== 'principle') throw new Error('identity allocate currently requires --kind principle')
      const count = Number(option(args, '--count'))
      const outcome = allocatePrincipleIdentities(root, result, count, validateAfterMutation)
      process.stdout.write(`${JSON.stringify(outcome, null, 2)}\n`)
      return 0
    }
    if (command === 'source' && subcommand === 'register') {
      const input = option(args, '--input')
      if (!input) throw new Error('source register requires --input')
      const plan = loadMutationPlan(root, input)
      const outcome = plan.version === 2 ? registerSources(root, result, plan, validateAfterMutation) : registerSource(root, result, plan, validateAfterMutation)
      process.stdout.write(`${JSON.stringify(outcome, null, 2)}\n`)
      return 0
    }
    if (command === 'content' && subcommand === 'scaffold') {
      const target = option(args, '--target')
      if (!target) throw new Error('content scaffold requires --target')
      writeOutput(root, option(args, '--output', '-'), renderContentScaffold(root, result, target))
      return 0
    }
    if (command === 'content' && subcommand === 'materialize') {
      const input = option(args, '--input')
      if (!input) throw new Error('content materialize requires --input')
      const plan = loadMutationPlan(root, input)
      const outcome = plan.version === 2 ? materializeContents(root, result, plan, validateAfterMutation) : materializeContent(root, result, plan, validateAfterMutation)
      process.stdout.write(`${JSON.stringify(outcome, null, 2)}\n`)
      return 0
    }
    if (command === 'citations' && subcommand === 'sync') {
      const target = option(args, '--target')
      const domain = option(args, '--domain')
      if (Boolean(target) === Boolean(domain)) throw new Error('citations sync requires exactly one of --target or --domain')
      const apply = args.includes('--apply')
      if (domain) {
        const outcome = synchronizeDomainCitations(root, result, domain, validateAfterMutation, { apply })
        process.stdout.write(`${JSON.stringify(outcome, null, 2)}\n`)
        return 0
      }
      const outcome = synchronizeCitations(root, result, target, validateAfterMutation, { apply })
      if (apply) process.stdout.write(`${JSON.stringify({ path: outcome.path, changed: outcome.changed, source_order: outcome.source_order, content_sha256: outcome.content_sha256 }, null, 2)}\n`)
      else writeOutput(root, option(args, '--output', '-'), outcome.content)
      return 0
    }
    if (command === 'evidence' && subcommand === 'scaffold') {
      const entry = option(args, '--entry')
      if (!entry) throw new Error('evidence scaffold requires --entry')
      writeOutput(root, option(args, '--output', '-'), `${JSON.stringify(buildEvidenceScaffold(result, entry), null, 2)}\n`)
      return 0
    }
    if (command === 'activation' && subcommand === 'package') {
      const baselineState = baseline ? validateRepository(baseline.root).state : null
      const activationPackage = buildActivationPackage(result, option(args, '--domain'), baselineState)
      const output = option(args, '--output', '-')
      const reviewOutput = option(args, '--review-output')
      if (output === '-' && reviewOutput === '-') throw new Error('Activation package and review output cannot both use stdout')
      writeOutput(root, output, `${JSON.stringify(activationPackage, null, 2)}\n`)
      if (reviewOutput) writeOutput(root, reviewOutput, `${JSON.stringify(buildActivationReview(activationPackage), null, 2)}\n`)
      return 0
    }
    if (command === 'activation' && subcommand === 'manifest') {
      const input = option(args, '--input')
      const reviewedAt = option(args, '--reviewed-at')
      if (!input || !reviewedAt) throw new Error('Activation manifest requires --input and --reviewed-at')
      const activationPackage = loadMutationPlan(root, input)
      const selected = options(args, '--target')
      const all = args.includes('--all')
      if (all === (selected.length > 0)) throw new Error('Activation manifest requires exactly one of --all or one or more --target values')
      const paths = all ? activationPackage.artifacts?.map((artifact) => artifact.path) ?? [] : selected
      writeOutput(root, option(args, '--output', '-'), yaml(buildActivationManifest(activationPackage, reviewedAt, paths)))
      return 0
    }
    if (command === 'activation' && subcommand === 'apply') {
      const input = option(args, '--input')
      if (!input) throw new Error('activation apply requires --input')
      const outcome = applyActivationManifest(root, result, loadMutationPlan(root, input), validateAfterMutation)
      process.stdout.write(`${JSON.stringify(outcome, null, 2)}\n`)
      return 0
    }
    if (command === 'workflow') {
      try {
        const target = option(args, '--target')
        const domain = option(args, '--domain')
        const requestedOutcome = option(args, '--outcome')
        if (target && domain) throw new Error('Workflow accepts at most one of --target or --domain')
        const outcome = requestedOutcome ?? (target ? 'create-or-complete-content' : domain ? 'fully-furnish-domain' : null)
        if (!outcome) throw new Error('Workflow requires --outcome, --target, or --domain')
        let status
        if (outcome === 'create-or-complete-content') {
          if (!target) throw new Error('create-or-complete-content requires --target')
          status = inspectOutcomeWorkflow(result.state, target)
        } else if (outcome === 'fully-furnish-domain') {
          if (!domain) throw new Error('fully-furnish-domain requires --domain')
          status = inspectDomainFurnishingWorkflow(result.state, domain)
        } else if (outcome === 'refine-domain-content') {
          if (!domain) throw new Error('refine-domain-content requires --domain')
          status = inspectDomainRefinementWorkflow(result.state, domain)
        } else if (outcome === 'create-domain') {
          if (!domain) throw new Error('create-domain requires --domain')
          status = inspectNewDomainWorkflow(result.state, domain)
        } else {
          if (['update-content', 'review-content'].includes(outcome) && !target) throw new Error(`${outcome} requires --target`)
          if (outcome === 'update-taxonomy' && !domain) throw new Error('update-taxonomy requires --domain')
          status = inspectRoutedOutcome(result.state.policies.validation, outcome, { target, domain })
        }
        validateWorkflowStatus(status, result.state.policies.validation)
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
          expectedInputSha256: option(args, '--expected-input-sha256', null),
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
      const scopedDomain = option(args, '--domain')
      const scopedSourceIds = options(args, '--source')
      if (scopedDomain && scopedSourceIds.length) throw new Error('links external accepts --domain or --source, not both')
      let operationalSources = result.state.sources
      if (scopedDomain) {
        if (!result.state.manifests.some((item) => item.value.id === scopedDomain)) throw new Error(`Unknown operational domain ${scopedDomain}`)
        const ids = new Set(result.state.corpus.documents
          .filter((document) => document.frontmatter.domain === scopedDomain)
          .flatMap((document) => document.references.map((reference) => reference.sourceId)))
        operationalSources = result.state.sources.filter((source) => ids.has(source.value.id))
      } else if (scopedSourceIds.length) {
        const requested = new Set(scopedSourceIds)
        for (const id of requested) if (!result.state.sourceById.has(id)) throw new Error(`Unknown operational source ${id}`)
        operationalSources = result.state.sources.filter((source) => requested.has(source.value.id))
      }
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
          sources: operationalSources,
          sourcePolicy: result.state.policies['source-policy'],
          bag,
          baseline: operationalBaseline,
          asOf: option(args, '--as-of'),
          includeRepositoryLinks: !scopedDomain && scopedSourceIds.length === 0
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
