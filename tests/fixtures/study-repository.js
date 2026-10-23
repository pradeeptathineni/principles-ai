// Synthetic source factory for tests and the Deep consumer journey. This creates
// a separate fixture repository; it never activates or edits the real corpus.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stringify } from 'yaml'
import { DiagnosticBag } from '../../src/diagnostics.js'
import { loadState } from '../../src/validator.js'

const project = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
export const syntheticStudyText = readFileSync(join(project, 'tests/fixtures/corpus/valid.md'), 'utf8').replaceAll('coding', 'study-demo').replaceAll('Coding', 'Study Demo')

export function writeSyntheticStudyRepository(root) {
  mkdirSync(root)
  for (const directory of ['config', 'docs', 'tests']) cpSync(join(project, directory), join(root, directory), { recursive: true })
  cpSync(join(project, 'AGENTS.md'), join(root, 'AGENTS.md'))
  mkdirSync(join(root, 'domains/study-demo'), { recursive: true })
  mkdirSync(join(root, 'sources'))
  writeFileSync(join(root, 'domains/study-demo/domain.yaml'), stringify({ schema_version: 6, id: 'study-demo', code: 'SDM', title: 'Study Demo', taxonomy_status: 'accepted', description: 'Synthetic study fixture; not real accepted guidance.', human_intent: { required_subdomains: [], priorities: [], exclusions: [], scope_notes: [] }, subdomains: [] }))
  writeFileSync(join(root, 'config/identity-ledger.yaml'), stringify({ schema_version: 2, principles: { next_sequence: 2, allocated: ['PRN-000001'], retired: [] }, sources: { next_sequence: 3, allocated: ['SRC-000001', 'SRC-000002'], retired: [] }, principle_relationships: [] }))
  for (let index = 1; index <= 2; index++) writeFileSync(join(root, `sources/SRC-00000${index}.yaml`), stringify({ schema_version: 4, id: `SRC-00000${index}`, title: `Example Source ${index === 1 ? 'One' : 'Two'}`, publisher: 'Synthetic fixture', evidence_kind: 'expert-synthesis', canonical_url: `https://example.com/${index === 1 ? 'one' : 'two'}`, url_aliases: [], published_or_version: null, first_retrieved: '2026-10-23', last_reviewed: '2026-10-23', status: 'active', superseded_by: null }))
  const file = join(root, 'domains/study-demo/principles.md')
  function activate(text = syntheticStudyText) {
    writeFileSync(file, text)
    const bag = new DiagnosticBag()
    const draft = loadState(root, bag, { complete: false }).corpus.documents[0]
    if (bag.errorCount) throw new Error(`Synthetic fixture invalid: ${bag.items.filter((item) => item.severity === 'error').map((item) => `${item.code} ${item.message}`).join('; ')}`)
    writeFileSync(file, text.replace('status: draft', 'status: active').replace('last_reviewed: null', 'last_reviewed: 2026-10-23').replace('reviewed_content_sha256: null', `reviewed_content_sha256: ${draft.semanticSha256}`))
  }
  activate()
  return { root, file, activate, principleId: 'PRN-000001' }
}
