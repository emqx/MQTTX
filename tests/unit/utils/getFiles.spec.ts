import { expect } from 'chai'
import { getSSLFile } from '@/utils/getFiles'
import fs from 'fs'

describe('getSSLFile', () => {
  it('should return SSL content when valid paths are provided', () => {
    const sslPath = {
      ca: 'test-ca.pem',
      cert: 'test-cert.pem',
      key: 'test-key.pem',
    }

    const originalReadFileSync = fs.readFileSync
    fs.readFileSync = ((path: string) => {
      if (path === 'test-ca.pem') return Buffer.from('ca-content')
      if (path === 'test-cert.pem') return Buffer.from('cert-content')
      if (path === 'test-key.pem') return Buffer.from('key-content')
      throw new Error('Unexpected file path')
    }) as typeof fs.readFileSync

    const result = getSSLFile(sslPath)

    expect(result).to.deep.equal({
      ca: [Buffer.from('ca-content')],
      cert: Buffer.from('cert-content'),
      key: Buffer.from('key-content'),
    })

    fs.readFileSync = originalReadFileSync
  })

  it('should return undefined for empty paths', () => {
    const sslPath = {
      ca: '',
      cert: '',
      key: '',
    }

    const result = getSSLFile(sslPath)

    expect(result).to.deep.equal({
      ca: undefined,
      cert: undefined,
      key: undefined,
    })
  })

  it('should throw an error when file reading fails', () => {
    const sslPath = {
      ca: 'non-existent.pem',
      cert: '',
      key: '',
    }

    expect(() => getSSLFile(sslPath)).to.throw()
  })
})
