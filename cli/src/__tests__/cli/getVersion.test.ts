import { execSync } from 'child_process'
import { expect } from '@jest/globals'
import packageJson from '../../../package.json'

describe('-v, --version', () => {
  it('should print version', async () => {
    const result = await execSync('node ./bin/index.js -v')
    expect(result.toString().trim()).toEqual(
      `${packageJson.version}\nhttps://mqttx.app/changelogs/v${packageJson.version}`,
    )
  })
})
