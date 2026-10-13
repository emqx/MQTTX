import { expect } from 'chai'
import { closeFocusedWindow } from '@/main/getMenuTemplate'

describe('closeFocusedWindow', () => {
  const createWindow = () => {
    const window = { closed: false, close: () => (window.closed = true) } as any
    return window
  }

  it('keeps the main window open when Ctrl+W is pressed', () => {
    const mainWindow = createWindow()
    closeFocusedWindow(mainWindow, mainWindow, true)
    expect(mainWindow.closed).to.equal(false)
  })

  it('closes a secondary window when Ctrl+W is pressed', () => {
    const secondaryWindow = createWindow()
    closeFocusedWindow(createWindow(), secondaryWindow, true)
    expect(secondaryWindow.closed).to.equal(true)
  })

  it('closes the main window from the menu item', () => {
    const mainWindow = createWindow()
    closeFocusedWindow(mainWindow, mainWindow, false)
    expect(mainWindow.closed).to.equal(true)
  })
})
