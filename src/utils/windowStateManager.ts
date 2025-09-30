import type { BrowserWindow, Rectangle } from 'electron'
import { screen } from 'electron'
import Store from 'electron-store'

const store = new Store()

interface WindowState {
  bounds: Rectangle
  isMaximized: boolean
  isFullScreen: boolean
}

// Default window size
export const defaultWindowSize = {
  width: 1025,
  height: 749,
  minHeight: 650,
  minWidth: 997,
}

// Restore window state
export function restoreWindowState(win: BrowserWindow): void {
  try {
    const savedState = store.get('windowState') as WindowState | undefined
    if (!savedState || typeof savedState !== 'object') return

    // Safely get display, fallback to primary if saved bounds are invalid
    let display
    try {
      display = screen.getDisplayMatching(savedState.bounds)
    } catch {
      display = screen.getPrimaryDisplay()
    }
    const screenArea = display.workArea

    // Adjust bounds to fit within screen
    if (savedState.bounds.width > screenArea.width) {
      savedState.bounds.width = screenArea.width
    }
    if (savedState.bounds.height > screenArea.height) {
      savedState.bounds.height = screenArea.height
    }
    if (savedState.bounds.x < screenArea.x) {
      savedState.bounds.x = screenArea.x
    }
    if (savedState.bounds.y < screenArea.y) {
      savedState.bounds.y = screenArea.y
    }

    win.setBounds(savedState.bounds)
    if (savedState.isMaximized) {
      win.maximize()
    }
    if (savedState.isFullScreen) {
      win.setFullScreen(true)
    }
  } catch (error) {
    console.error('Failed to restore window state:', error)
  }
}

// Save window state
export function saveWindowState(win: BrowserWindow): void {
  try {
    const windowState = {
      bounds: win.getBounds(),
      isMaximized: win.isMaximized(),
      isFullScreen: win.isFullScreen(),
    }
    store.set('windowState', windowState)
  } catch (error) {
    console.error('Failed to save window state:', error)
  }
}
