#!/usr/bin/env node
import { resolve } from 'node:path'
import { writeSyntheticStudyRepository } from '../tests/fixtures/study-repository.js'

try {
  if (process.argv.length !== 3) throw new Error('Usage: node scripts/study-fixture.mjs NEW_FIXTURE_ROOT (parent must exist)')
  const fixture = writeSyntheticStudyRepository(resolve(process.argv[2]))
  console.log(JSON.stringify({ root: fixture.root, principle_id: fixture.principleId, source_revision: 'synthetic-study-fixture-1', qualification: 'Synthetic test fixture; no corpus activation or efficacy claim.' }))
} catch (error) { console.error(JSON.stringify({ error: error.message })); process.exitCode = 1 }
