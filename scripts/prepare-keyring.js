const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')

let prepared = false

module.exports = ({ packager }) => {
  if (prepared) return
  const projectDir = packager.projectDir
  const { optionalDependencies } = require(path.join(projectDir, 'node_modules/@napi-rs/keyring/package.json'))
  const packages = [
    'darwin-x64',
    'darwin-arm64',
    'win32-x64-msvc',
    'win32-ia32-msvc',
    'linux-x64-gnu',
    'linux-arm64-gnu',
  ].map((target) => `@napi-rs/keyring-${target}`)
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-keyring-'))
  try {
    fs.writeJsonSync(path.join(directory, 'package.json'), {
      private: true,
      dependencies: Object.fromEntries(packages.map((name) => [name, optionalDependencies[name]])),
    })
    fs.copyFileSync(path.join(projectDir, 'yarn.lock'), path.join(directory, 'yarn.lock'))
    // Yarn normally skips other CPUs/OSes. Prepare every supported binary before
    // electron-builder caches the dependency tree for the first architecture.
    execFileSync(
      'yarn',
      ['install', '--frozen-lockfile', '--ignore-platform', '--ignore-scripts', '--non-interactive', '--no-progress'],
      { cwd: directory, stdio: 'inherit', shell: process.platform === 'win32' },
    )
    for (const name of packages) {
      fs.copySync(path.join(directory, 'node_modules', name), path.join(projectDir, 'node_modules', name))
    }
    prepared = true
  } finally {
    fs.removeSync(directory)
  }
}
