#!/usr/bin/env node

import { main } from '../src/principle-atlas-cli.js'

process.exitCode = await main(process.argv.slice(2))
