import testWithSpectron from 'vue-cli-plugin-electron-builder/lib/testWithSpectron'
import { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

describe('Application launch', function () {
  this.timeout(30000)

  let spectron

  beforeEach(async function () {
    spectron = await testWithSpectron()
    chaiAsPromised.transferPromiseness = spectron.app.transferPromiseness
  })

  afterEach(async function () {
    if (spectron && spectron.app && spectron.app.isRunning()) {
      await spectron.stopServe()
    }
  })

  it('opens a window', async function () {
    const { app } = spectron
    await expect(app.client.getWindowCount()).to.eventually.be.at.least(1)
    const win = app.browserWindow
    await expect(win.isMinimized()).to.eventually.be.false
    await expect(win.isVisible()).to.eventually.be.true
    const { width, height } = await win.getBounds()
    expect(width).to.be.above(0)
    expect(height).to.be.above(0)
  })
})
