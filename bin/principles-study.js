#!/usr/bin/env node

import { createStudyService } from '../src/study.js'

const allowed = {
  list: ['query'], start: ['name', 'principles'], sessions: [], show: ['session'],
  cue: ['session', 'principle', 'text'], attempt: ['session', 'principle', 'text'],
  reveal: ['session', 'principle', 'attempt'], rate: ['session', 'principle', 'attempt', 'rating', 'example', 'revisit'],
  revisit: ['session', 'principle', 'date'], refresh: ['session', 'principle'],
  export: ['session', 'format'], 'knowledge-export': ['instance'],
  'path-create': ['name', 'goal', 'principles', 'steps'], 'path-revise': ['session', 'expected-revision', 'goal', 'steps'],
  'path-view': ['session'], 'path-attempt': ['session', 'step', 'expected-revision', 'text'],
  'path-record': ['session', 'step', 'expected-revision', 'attempt', 'observation']
}
const HELP = `Principles practice (Node 24). All state stays in an explicit external private store.
Usage: node bin/principles-study.js COMMAND --root ROOT --revision REV [--store DIR] [flags]
Commands: list [--query TEXT]; start --name TEXT --principles PRN-ID[,PRN-ID]; path-create/path-view/path-attempt/path-revise/path-record; sessions;
show --session ID; cue/attempt --session ID --principle PRN-ID --text TEXT;
reveal --session ID --principle PRN-ID --attempt ID;
rate --session ID --principle PRN-ID --attempt ID --rating again|partial|comfortable --example TEXT --revisit YYYY-MM-DD;
revisit --session ID --principle PRN-ID --date YYYY-MM-DD; refresh --session ID --principle PRN-ID;
export --session ID --format json|markdown; knowledge-export --instance ID [--store DIR].
path-create --name TEXT --goal TEXT --principles PRN-ID[,PRN-ID] --steps JSON creates a private ordered path atomically with its study session.
path-view --session ID; path-attempt --session ID --step STEP-ID --expected-revision N --text TEXT;
path-revise --session ID --expected-revision N --goal TEXT --steps JSON;
path-record --session ID --step STEP-ID --expected-revision N [--attempt ID] [--observation TEXT].
Session commands require --store. knowledge-export includes private sessions only with --store.
Self-ratings are personal reports, not measured mastery or empirical efficacy.\n`

try {
  const [command, ...args] = process.argv.slice(2)
  if (!command || ['help', '--help', '-h'].includes(command)) process.stdout.write(HELP)
  else {
    if (!allowed[command]) throw new Error(`Unknown study command ${command}`)
    const options = {}
    const flags = new Set(['root', 'revision', 'store', ...allowed[command]])
    for (let index = 0; index < args.length; index += 2) {
      const key = args[index]?.slice(2)
      if (!args[index]?.startsWith('--') || !flags.has(key) || options[key] !== undefined || args[index + 1] === undefined) throw new Error(`Invalid or duplicate option ${args[index]}`)
      options[key] = args[index + 1]
    }
    const service = createStudyService({ root: options.root, revision: options.revision, store: options.store })
    let result
    switch (command) {
      case 'list': result = service.list(options.query); break
      case 'start': result = service.start({ name: options.name, principleIds: options.principles?.split(',') }); break
      case 'path-create': result = service.createPath({ name: options.name, goal: options.goal, principleIds: options.principles?.split(','), steps: JSON.parse(options.steps ?? 'null') }); break
      case 'path-view': result = service.pathView(options.session); break
      case 'path-attempt': result = service.pathAttempt(options.session, options.step, { expected_revision: Number(options['expected-revision']), text: options.text }); break
      case 'path-revise': result = service.revisePath(options.session, { expected_revision: Number(options['expected-revision']), goal: options.goal, steps: JSON.parse(options.steps ?? 'null') }); break
      case 'path-record': result = service.recordPathStep(options.session, options.step, { expected_revision: Number(options['expected-revision']), attempt_id: options.attempt ?? null, observation: options.observation ?? null }); break
      case 'sessions': result = service.sessions(); break
      case 'show': result = service.show(options.session); break
      case 'cue': result = service.cue(options.session, options.principle, options.text); break
      case 'attempt': result = service.attempt(options.session, options.principle, options.text); break
      case 'reveal': result = service.reveal(options.session, options.principle, options.attempt); break
      case 'rate': result = service.rate(options.session, options.principle, options.attempt, { rating: options.rating, example: options.example, revisitOn: options.revisit }); break
      case 'revisit': result = service.revisit(options.session, options.principle, options.date); break
      case 'refresh': result = service.refresh(options.session, options.principle); break
      case 'export': result = service.exportSession(options.session, options.format); break
      case 'knowledge-export': result = service.knowledgeExport(options.instance, { includeSessions: options.store !== undefined }); break
    }
    process.stdout.write(typeof result === 'string' ? result : `${JSON.stringify(result, null, 2)}\n`)
  }
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: error.message })}\n`)
  process.exitCode = 1
}
