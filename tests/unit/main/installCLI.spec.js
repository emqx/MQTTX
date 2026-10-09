const { expect } = require('chai')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const ts = require('typescript')

async function requestedBinary(platform, arch, translated = false) {
  const requests = []
  const app = {}
  Object.defineProperty(app, 'runningUnderARM64Translation', {
    get() {
      if (platform !== 'darwin') throw new Error('Translation detection is only needed on macOS')
      return translated
    },
  })
  const mocks = {
    os: { platform: () => platform, arch: () => arch },
    fs,
    path,
    axios: async ({ url }) => {
      requests.push(url)
      throw new Error('Stop after capturing the download request')
    },
    electron: { app, dialog: { showErrorBox() {}, showOpenDialogSync: () => ['/tmp/mqttx-cli-test'] } },
    './appDataPath': { getUnifiedAppDataPath: () => '/tmp/mqttx-cli-test' },
    '@vscode/sudo-prompt': {},
    '@/version': '1.13.1',
    child_process: { exec: (_, callback) => callback(new Error('CLI is not installed'), '', '') },
    'compare-versions': require('compare-versions'),
    './updateChecker': { getCurrentLang: async () => 'en' },
  }
  const source = fs.readFileSync(path.join(process.cwd(), 'src/main/installCLI.ts'), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  })
  const exports = {}
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      if (!Object.prototype.hasOwnProperty.call(mocks, name)) throw new Error(`Unexpected import: ${name}`)
      return mocks[name]
    },
  })
  await exports.default({ webContents: { send() {} }, setProgressBar() {} })
  return requests
}

describe('Desktop CLI download architecture', () => {
  it('downloads the ARM64 CLI when an Intel desktop runs under Rosetta', async () => {
    expect(await requestedBinary('darwin', 'x64', true)).to.deep.equal([
      'https://www.emqx.com/en/downloads/MQTTX/1.13.1/mqttx-cli-macos-arm64',
    ])
  })

  it('downloads the ARM64 CLI for a native Apple Silicon desktop', async () => {
    expect(await requestedBinary('darwin', 'arm64')).to.deep.equal([
      'https://www.emqx.com/en/downloads/MQTTX/1.13.1/mqttx-cli-macos-arm64',
    ])
  })

  it('preserves the Intel CLI for Intel Macs', async () => {
    expect(await requestedBinary('darwin', 'x64')).to.deep.equal([
      'https://www.emqx.com/en/downloads/MQTTX/1.13.1/mqttx-cli-macos-x64',
    ])
  })

  it('preserves Windows downloads without reading macOS translation state', async () => {
    expect(await requestedBinary('win32', 'x64')).to.deep.equal([
      'https://www.emqx.com/en/downloads/MQTTX/1.13.1/mqttx-cli-win-x64.exe',
    ])
  })

  it('preserves Linux downloads without reading macOS translation state', async () => {
    expect(await requestedBinary('linux', 'arm64')).to.deep.equal([
      'https://www.emqx.com/en/downloads/MQTTX/1.13.1/mqttx-cli-linux-arm64',
    ])
  })
})
