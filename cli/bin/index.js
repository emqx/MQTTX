#!/usr/bin/env node
import { Commander } from '../dist/index.js'

try {
  const commander = new Commander()
  commander.init()
  commander.program.parse(process.argv)
} catch (e) {
  console.log(e)
}
