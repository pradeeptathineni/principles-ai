import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DiagnosticBag } from '../src/diagnostics.js'
import { validateInternalLinks } from '../src/internal-links.js'

test('internal links reject query, percent encoding, traversal, missing paths, and symlink escape', () => {
  const root = mkdtempSync(join(tmpdir(), 'principles-links-'))
  mkdirSync(join(root, 'docs'))
  writeFileSync(join(root, 'AGENTS.md'), '# Agent\n')
  writeFileSync(join(root, 'README.md'), '# Readme\n')
  symlinkSync(tmpdir(), join(root, 'outside'))
  writeFileSync(join(root, 'docs', 'links.md'), [
    '# Links',
    '',
    '[valid](../README.md)',
    '[query](../README.md?q=1)',
    '[encoded](../README%2emd)',
    '[traversal](../../escape.md)',
    '[missing](missing.md)',
    '[symlink](../outside)',
    '[file](file:///etc/passwd)',
    '[script](javascript:alert%281%29)',
    ''
  ].join('\n'))
  const bag = new DiagnosticBag()
  validateInternalLinks(root, bag)
  for (const code of ['INTERNAL_LINK_QUERY', 'INTERNAL_LINK_PERCENT', 'INTERNAL_LINK_TRAVERSAL', 'INTERNAL_LINK_MISSING', 'INTERNAL_LINK_UNSAFE', 'EXTERNAL_LINK_SCHEME']) assert.ok(bag.items.some((item) => item.code === code), code)
  rmSync(root, { recursive: true, force: true })
})
