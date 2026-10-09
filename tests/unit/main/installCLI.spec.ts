import { expect } from 'chai'
import { getCLIArch } from '@/main/installCLI'

describe('getCLIArch', () => {
  it('uses arm64 when an x64 build runs under Rosetta', () => {
    expect(getCLIArch('x64', true)).to.equal('arm64')
  })

  it('keeps the process architecture otherwise', () => {
    expect(getCLIArch('x64', false)).to.equal('x64')
    expect(getCLIArch('arm64', false)).to.equal('arm64')
  })
})
