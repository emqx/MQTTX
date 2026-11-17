const assert = require('assert')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')
const { Platform } = require('app-builder-lib')
const { createLazyProductionDeps } = require('app-builder-lib/out/util/packageDependencies')
const { computeNodeModuleFileSets } = require('app-builder-lib/out/util/appFileCopier')
const { getNodeModuleFileMatcher } = require('app-builder-lib/out/fileMatcher')
const config = require('../../vue.config').pluginOptions.electronBuilder.builderOptions

const targets = [
  ['mac', Platform.MAC, 'darwin', 'x64', 'darwin-x64'],
  ['mac', Platform.MAC, 'darwin', 'arm64', 'darwin-arm64'],
  ['win', Platform.WINDOWS, 'win32', 'x64', 'win32-x64-msvc'],
  ['win', Platform.WINDOWS, 'win32', 'ia32', 'win32-ia32-msvc'],
  ['linux', Platform.LINUX, 'linux', 'x64', 'linux-x64-gnu'],
  ['linux', Platform.LINUX, 'linux', 'arm64', 'linux-arm64-gnu'],
]

describe('keyring cross-architecture packaging', function () {
  this.timeout(30000)
  let directory
  let dependencies
  let appDir

  before(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-keyring-test-'))
    const optionalDependencies = {}
    for (const [, , platform, arch, target] of targets) {
      const name = `@napi-rs/keyring-${target}`
      const source = path.join(directory, 'sources', target)
      fs.ensureDirSync(source)
      fs.writeJsonSync(path.join(source, 'package.json'), {
        name,
        version: '2.1.2',
        os: [platform],
        cpu: [arch],
        main: `keyring.${target}.node`,
      })
      fs.writeFileSync(path.join(source, `keyring.${target}.node`), target)
      optionalDependencies[name] = `file:${source}`
    }
    const wrapper = path.join(directory, 'sources', 'keyring')
    fs.ensureDirSync(wrapper)
    fs.writeJsonSync(path.join(wrapper, 'package.json'), {
      name: '@napi-rs/keyring',
      version: '2.1.2',
      optionalDependencies,
    })
    fs.writeFileSync(path.join(wrapper, 'index.js'), '')
    fs.writeJsonSync(path.join(directory, 'package.json'), {
      private: true,
      dependencies: { '@napi-rs/keyring': `file:${wrapper}` },
    })
    // A normal install reproduces Yarn skipping binaries for the other targets.
    execFileSync('yarn', ['install', '--offline', '--ignore-scripts', '--non-interactive', '--no-progress'], {
      cwd: directory,
      stdio: 'pipe',
      shell: process.platform === 'win32',
    })
    const scope = path.join(directory, 'node_modules/@napi-rs')
    assert(fs.readdirSync(scope).length < targets.length + 1)
    config.beforePack({ packager: { projectDir: directory } })
    appDir = path.join(directory, 'bundled')
    fs.ensureDirSync(path.join(appDir, 'node_modules'))
    fs.copyFileSync(path.join(directory, 'package.json'), path.join(appDir, 'package.json'))
    // Reuse one cached dependency tree, as electron-builder does across targets.
    dependencies = createLazyProductionDeps(appDir, null)
    await dependencies.value
  })

  after(() => {
    if (directory) fs.removeSync(directory)
  })

  for (const [key, platform, , arch, target] of targets) {
    it(`includes only the ${target} binary from the hoisted dependencies`, async () => {
      const info = {
        config,
        projectDir: directory,
        debugLogger: { isEnabled: false },
        getNodeDependencyInfo: () => dependencies,
      }
      const matcher = getNodeModuleFileMatcher(
        appDir,
        path.join(directory, 'output', target),
        (value) => value.replace(/\$\{arch\}/g, arch),
        config[key],
        info,
      )
      const sets = await computeNodeModuleFileSets({ info, platform, config }, matcher)
      const files = sets.flatMap((set) => set.files)
      assert.deepStrictEqual(
        files.filter((file) => file.endsWith('.node')).map((file) => path.basename(file)),
        [`keyring.${target}.node`],
      )
      assert(files.some((file) => file.endsWith(path.join('@napi-rs', 'keyring', 'index.js'))))
    })
  }
})
