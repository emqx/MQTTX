#!/usr/bin/env node
const { Commander } = require('..')

try {
  const commander = new Commander()
  commander.init()
  commander.program.parse(process.argv)
}
catch (e) {
  console.error(e)
}
