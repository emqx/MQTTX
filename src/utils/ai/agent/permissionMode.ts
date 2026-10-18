import type { PermissionMode } from './approval'

/**
 * The mode the user picked lives in `sessionStorage`: it survives a reload but not closing the app,
 * so Auto never stays on silently across sessions. Without a session value the settings default is
 * used.
 */
export const PERMISSION_MODE_STORAGE_KEY = 'agent.permissionMode'
/** Remembers that Auto was confirmed in this session, so the dialog is not shown again */
export const PERMISSION_MODE_CONFIRMED_KEY = 'agent.permissionModeConfirmed'

const readSession = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

const writeSession = (key: string, value: string): void => {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable; the mode then only lasts for this page instance
  }
}

/** The mode picked in this session, or null when the user has not picked one */
export const readSessionPermissionMode = (): PermissionMode | null => {
  const value = readSession(PERMISSION_MODE_STORAGE_KEY)
  return value === 'auto' || value === 'ask' ? value : null
}

export const writeSessionPermissionMode = (mode: PermissionMode): void => {
  writeSession(PERMISSION_MODE_STORAGE_KEY, mode)
}

export const isAutoConfirmedInSession = (): boolean => readSession(PERMISSION_MODE_CONFIRMED_KEY) === 'true'

export const rememberAutoConfirmed = (): void => writeSession(PERMISSION_MODE_CONFIRMED_KEY, 'true')

/** Session value wins, then the settings default, then ask */
export const resolveInitialPermissionMode = (
  sessionValue: string | null | undefined,
  defaultValue: string | null | undefined,
): PermissionMode => {
  if (sessionValue === 'auto' || sessionValue === 'ask') return sessionValue
  if (defaultValue === 'auto' || defaultValue === 'ask') return defaultValue
  return 'ask'
}
