import { createHash } from 'node:crypto'
import canonicalize from 'canonicalize'
import { buildContext } from './context.js'
import { createPrincipleAtlasService } from './principle-atlas.js'
import { validateRepository } from './validator.js'

const PRINCIPLE_ID = /^PRN-[A-Z0-9]{6}$/
const OWNER_REVISION = /^[a-f0-9]{40,64}$/
const MAX_SELECTED = 8
const MAX_TEXT = 4000

function digest(value) {
  const text = canonicalize(value)
  if (typeof text !== 'string') throw new Error('Field guide cannot be canonically serialized.')
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function text(value, label, limit = MAX_TEXT) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) throw new Error(`${label} must be non-empty text of at most ${limit} characters.`)
  return value.trim()
}

function exactObject(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !keys.includes(key)) || keys.some((key) => !Object.hasOwn(value, key))) throw new Error(`${label} fields must be exactly: ${keys.join(', ')}.`)
}

function validateInput(input) {
  exactObject(input, ['task', 'selectionRationale', 'principleIds', 'expectedCorpusRevision', 'conflictReview', 'conflicts', 'exceptionNotes', 'coverageUnknowns'], 'Field guide request')
  const task = text(input.task, 'Task')
  const selectionRationale = text(input.selectionRationale, 'Selection rationale')
  const conflictReview = text(input.conflictReview, 'Conflict review declaration')
  if (!Array.isArray(input.principleIds) || input.principleIds.length < 1 || input.principleIds.length > MAX_SELECTED || new Set(input.principleIds).size !== input.principleIds.length || input.principleIds.some((id) => typeof id !== 'string' || !PRINCIPLE_ID.test(id))) throw new Error(`Select 1 to ${MAX_SELECTED} unique canonical principle IDs.`)
  if (!/^[a-f0-9]{64}$/.test(input.expectedCorpusRevision ?? '')) throw new Error('An exact current Atlas corpus revision is required.')
  if (!Array.isArray(input.conflicts) || input.conflicts.length > 32) throw new Error('Conflicts must be a bounded array of caller-authored declarations.')
  const selected = new Set(input.principleIds)
  const conflicts = input.conflicts.map((item) => {
    exactObject(item, ['principleIds', 'description', 'resolutionStatus', 'precedence', 'rationale', 'conditions'], 'Conflict declaration')
    if (!Array.isArray(item.principleIds) || item.principleIds.length < 2 || item.principleIds.length > MAX_SELECTED || new Set(item.principleIds).size !== item.principleIds.length || item.principleIds.some((id) => !selected.has(id))) throw new Error('Each declared conflict must name at least two selected principles.')
    if (!['conditional', 'precedence-recorded', 'unresolved'].includes(item.resolutionStatus)) throw new Error('Conflict resolutionStatus must be conditional, precedence-recorded, or unresolved.')
    if (item.resolutionStatus === 'unresolved' && item.precedence !== null) throw new Error('Unresolved conflicts must leave precedence undecided.')
    return {
      principleIds: [...item.principleIds].sort(),
      description: text(item.description, 'Conflict description'),
      resolutionStatus: item.resolutionStatus,
      precedence: item.resolutionStatus === 'unresolved' ? null : text(item.precedence, 'Caller-declared precedence'),
      rationale: text(item.rationale, 'Precedence rationale'),
      conditions: text(item.conditions, 'Conflict conditions')
    }
  })
  if (!Array.isArray(input.exceptionNotes) || input.exceptionNotes.length > 64) throw new Error('Exception notes must be a bounded array.')
  const exceptionNotes = input.exceptionNotes.map((item) => {
    exactObject(item, ['principleId', 'exception', 'scope'], 'Exception note')
    if (!selected.has(item.principleId)) throw new Error('Exception notes must refer to a selected principle.')
    return { principleId: item.principleId, exception: text(item.exception, 'Exception'), scope: text(item.scope, 'Exception scope') }
  })
  if (!Array.isArray(input.coverageUnknowns) || input.coverageUnknowns.length > 64) throw new Error('Coverage unknowns must be a bounded array.')
  const coverageUnknowns = input.coverageUnknowns.map((item) => {
    exactObject(item, ['area', 'reason'], 'Coverage unknown')
    return { area: text(item.area, 'Unknown coverage area'), reason: text(item.reason, 'Unknown coverage reason') }
  })
  return {
    task,
    selectionRationale,
    principleIds: [...input.principleIds].sort(),
    expectedCorpusRevision: input.expectedCorpusRevision,
    conflictReview,
    conflicts,
    exceptionNotes,
    coverageUnknowns
  }
}

export function createFieldGuideService({ root, ownerRevision, sourceRoot } = {}) {
  if (!OWNER_REVISION.test(ownerRevision ?? '')) throw new Error('Configure the exact immutable Principles owner revision.')
  const atlas = createPrincipleAtlasService({ root, ownerRevision, sourceRoot })

  function build(request) {
    const input = validateInput(request)
    const current = atlas.domainCoverage({ expectedCorpusRevision: input.expectedCorpusRevision })
    if (current.basisStatus !== 'current') throw new Error(`Stale field guide selection: expected corpus ${input.expectedCorpusRevision}, found ${current.corpusRevision}.`)
    const validation = validateRepository(root)
    if (validation.bag.errorCount) throw new Error(`Principles repository does not currently validate: ${validation.bag.sorted().slice(0, 6).map((item) => `${item.path} ${item.code}`).join('; ')}`)

    const selectedEntries = input.principleIds.map((id) => {
      const shown = atlas.show({ entryId: id })
      if (shown.corpusRevision !== current.corpusRevision) throw new Error('Principles corpus changed while preparing the field guide.')
      if (shown.entry.lifecycle !== 'active') throw new Error(`Field guides require active principles; ${id} is ${shown.entry.lifecycle}.`)
      return shown.entry
    })
    const context = buildContext({
      documents: validation.state.corpus.documents,
      entryById: validation.state.corpus.entryById,
      sourceById: validation.state.sourceById,
      evidenceByEntryId: validation.state.evidenceByEntryId,
      evaluatorConfigs: validation.state.evaluatorConfigs,
      profile: 'standard',
      principleIds: input.principleIds,
      revision: ownerRevision
    })
    if (context.entries.some((entry) => entry.status !== 'active')) throw new Error('Context selection includes a non-active principle.')
    if (atlas.domainCoverage({ expectedCorpusRevision: current.corpusRevision }).basisStatus !== 'current') throw new Error('Principles corpus changed while preparing the field guide.')

    const domains = [...new Set(selectedEntries.map((entry) => entry.domain.id))].sort()
    const coverage = domains.map((domainId) => {
      const result = atlas.domainCoverage({ domainId, expectedCorpusRevision: current.corpusRevision })
      if (result.basisStatus !== 'current') throw new Error('Principles corpus changed while reading domain coverage.')
      const domain = result.domains.find((item) => item.domain.id === domainId)
      return { domainId, structural: domain, semantic: { status: 'unknown', qualification: 'File presence and active lifecycle do not establish semantic adequacy.' } }
    })
    const comparison = input.principleIds.length > 1 ? atlas.compare({ entryIds: input.principleIds }) : null
    if (comparison && comparison.corpusRevision !== current.corpusRevision) throw new Error('Principles corpus changed while comparing selected entries.')

    const body = {
      schema: 'principles.field-guide/1',
      owner: 'principles-ai',
      ownerRevision,
      corpusRevision: current.corpusRevision,
      request: input,
      context,
      selection: {
        principleIds: input.principleIds,
        rationale: input.selectionRationale,
        status: 'caller-selected; not approval or activation'
      },
      comparison: comparison ? {
        structuralSignals: comparison.structuralSignals,
        qualification: comparison.qualification,
        semanticConflicts: 'unknown; Atlas does not infer conflicts or precedence'
      } : {
        structuralSignals: [],
        qualification: 'One principle selected; no comparison performed.',
        semanticConflicts: 'unknown; no comparison performed'
      },
      conflicts: {
        review: input.conflictReview,
        declared: input.conflicts.map((item) => ({ ...item, provenance: 'caller-asserted' })),
        completeness: 'unknown; undeclared or unrecognized conflicts may remain'
      },
      exceptions: {
        authoredApplicability: context.entries.map((entry) => ({ principleId: entry.id, claims: entry.applicability })),
        callerNotes: input.exceptionNotes.map((item) => ({ ...item, provenance: 'caller-asserted' }))
      },
      coverage: {
        domains: coverage,
        unknowns: input.coverageUnknowns,
        semanticCoverage: 'unknown; this export does not assess completeness or sufficiency'
      },
      authority: {
        purpose: 'read-only task-specific guidance export',
        approved: false,
        activated: false,
        universalTruthClaim: false,
        qualification: 'Selection, conflict notes, and exception notes are caller-authored input. Sources and citations are retained identities, not proof of truth, entailment, fitness, or current external content.'
      }
    }
    return { ...body, guideSha256: digest(body) }
  }

  function read(guide) {
    if (!guide || guide.schema !== 'principles.field-guide/1' || typeof guide.guideSha256 !== 'string') throw new Error('Unsupported or malformed field guide.')
    const { guideSha256, ...body } = guide
    if (digest(body) !== guideSha256) throw new Error('Field guide digest mismatch.')
    const currentGuide = build(guide.request)
    if (currentGuide.guideSha256 !== guideSha256) throw new Error('Stale field guide: canonical corpus, source, selection, or guide inputs changed.')
    return { status: 'current', guide: currentGuide, qualification: 'Currentness binds local declared inputs. It does not authenticate ownerRevision or establish external source currency.' }
  }

  return { create: build, read }
}
