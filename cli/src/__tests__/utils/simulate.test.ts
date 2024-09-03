import { loadSimulator } from '../../utils/simulate'
import { expect, describe, it, jest, beforeEach } from '@jest/globals'
import * as path from 'path'

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readdirSync: jest.fn().mockReturnValue(['IEM.js', 'tesla.js']),
  statSync: jest.fn().mockReturnValue({ birthtime: new Date() }),
}))

const actualPath = jest.requireActual('path')
jest.mock('path', () => {
  const actualPath = jest.requireActual('path') as typeof import('path')
  return {
    ...actualPath,
    join: jest.fn().mockImplementation((...args: any[]) => actualPath.join(...args)),
    resolve: jest.fn().mockImplementation((...args: any[]) => actualPath.resolve(...args)),
  }
})

describe('loadSimulator', () => {
  const mockGenerator = jest.fn()
  const mockSimulatorModule = {
    generator: mockGenerator,
    name: 'IEM',
    author: 'EMQX Team',
    dataFormat: 'JSON',
    version: '1.0.0',
    description: 'Test simulator description',
  }

  beforeEach(() => {
    jest.resetModules()
    const scenarioPath = path.join(__dirname, '../../scenarios/IEM.js')
    jest.doMock(scenarioPath, () => mockSimulatorModule, { virtual: true })
  })

  it('should load a simulator successfully', () => {
    const simulator = loadSimulator('IEM')

    expect(simulator).toEqual({
      ...mockSimulatorModule,
      generator: expect.any(Function),
      file: undefined,
      realFilePath: expect.stringContaining('IEM.js'),
    })

    const options: any = { clientId: 'test', count: 1 }
    simulator.generator(options)
    expect(mockGenerator).toHaveBeenCalledWith(expect.any(Object), options)
  })

  it('should throw an error for invalid file type', () => {
    expect(() => loadSimulator('invalidFile', 'invalid.txt')).toThrow('Invalid file type')
  })

  // it('should throw an error for non-existent file', () => {
  //   const fs = require('fs')
  //   fs.existsSync.mockReturnValueOnce(false)
  //   expect(() => loadSimulator(undefined, 'nonexistent.js')).toThrow((error: Error) => {
  //     expect(error).toBeInstanceOf(Error)
  //     expect(error.message).toMatch(/Load simulator error: Error: Cannot find module/)
  //     expect(error.message).toContain('nonexistent.js')
  //     return true
  //   })
  // })

  it('should throw an error for invalid simulator module', () => {
    const invalidModulePath = path.join(__dirname, '../../scenarios/invalidModule.js')
    jest.doMock(invalidModulePath, () => ({}), { virtual: true })
    expect(() => loadSimulator('invalidModule')).toThrow('Not a valid simulator module')
  })
})
