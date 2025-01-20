import { BrowserWindow, screen } from 'electron'
import Store from 'electron-store'

const electronStore = new Store()

interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

interface WindowState {
  bounds: WindowBounds
  isMaximized: boolean
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
    const savedState = electronStore.get('windowState') as WindowState | undefined
    if (savedState && typeof savedState === 'object') {
      const screenArea = screen.getDisplayMatching(savedState.bounds).workArea
      // Check if the window is within the bounds of the screen
      if (
        savedState.bounds.x >= screenArea.x &&
        savedState.bounds.x <= screenArea.x + screenArea.width &&
        savedState.bounds.y >= screenArea.y &&
        savedState.bounds.y <= screenArea.y + screenArea.height
      ) {
        try {
          win.setBounds(savedState.bounds)
          if (savedState.isMaximized) {
            win.maximize()
          }
        } catch (error) {
          console.error('Failed to restore window bounds:', error)
          // Fallback to default window bounds
          win.setBounds({ width: defaultWindowSize.width, height: defaultWindowSize.height })
        }
      }
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
    }
    electronStore.set('windowState', windowState)
  } catch (error) {
    console.error('Failed to save window state:', error)
  }
}
