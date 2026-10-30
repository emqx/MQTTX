import { expect } from 'chai'
import { findChecksum, getCLIArch, quoteShellPath } from '@/main/installCLI'

const ARM64_HASH = 'ebd11a44744f2968914becac7efaee503bf760c66a5528b28e37960e3f87aa6f'
const ARCHIVE_HASH = '1111111111111111111111111111111111111111111111111111111111111111'
const LINUX_X64_HASH = '2222222222222222222222222222222222222222222222222222222222222222'
const WINDOWS_HASH = 'ab'.repeat(32)

const SUMS = [
  `${ARM64_HASH}  mqttx-cli-macos-arm64`,
  `${ARCHIVE_HASH}  mqttx-cli-macos-arm64.tar.gz`,
  `${LINUX_X64_HASH}  *mqttx-cli-linux-x64`,
  `${WINDOWS_HASH.toUpperCase()}  mqttx-cli-win-x64.exe`,
].join('\n')

describe('getCLIArch', () => {
  it('uses arm64 when an x64 build runs under Rosetta', () => {
    expect(getCLIArch('x64', true)).to.equal('arm64')
  })

  it('keeps the process architecture otherwise', () => {
    expect(getCLIArch('x64', false)).to.equal('x64')
    expect(getCLIArch('arm64', false)).to.equal('arm64')
  })
})

describe('findChecksum', () => {
  it('finds the hash for an exact asset name', () => {
    expect(findChecksum(SUMS, 'mqttx-cli-macos-arm64')).to.equal(ARM64_HASH)
  })

  it('does not match an asset name against an archive with the same prefix', () => {
    expect(findChecksum(`${ARCHIVE_HASH}  mqttx-cli-macos-arm64.tar.gz`, 'mqttx-cli-macos-arm64')).to.equal(null)
  })

  it('returns null when the asset is absent', () => {
    expect(findChecksum(SUMS, 'mqttx-cli-linux-arm64')).to.equal(null)
  })

  it('handles binary-mode markers, CRLF line endings and uppercase hashes', () => {
    expect(findChecksum(`${WINDOWS_HASH.toUpperCase()} *mqttx-cli-win-x64.exe\r\n`, 'mqttx-cli-win-x64.exe')).to.equal(
      WINDOWS_HASH,
    )
    expect(findChecksum(SUMS, 'mqttx-cli-linux-x64')).to.equal(LINUX_X64_HASH)
  })
})

describe('quoteShellPath', () => {
  it('single-quotes the path and escapes embedded single quotes', () => {
    expect(quoteShellPath(`/tmp/App Data/mqttx-cli's$(whoami)`)).to.equal("'/tmp/App Data/mqttx-cli'\\''s$(whoami)'")
  })

  it('keeps shell metacharacters literal', () => {
    expect(quoteShellPath('/tmp/mqttx-cli-$(rm -rf /)`id`')).to.equal("'/tmp/mqttx-cli-$(rm -rf /)`id`'")
  })
})
