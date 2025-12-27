import { app } from 'electron'
import path from 'path'
import fs from 'fs-extra'
import { getAppDataPath as getLegacyAppDataPath } from 'appdata-path'

/**
 * Get the unified application data path
 * This fixes the Windows %APPDATA% redirect issue by using Electron's native API
 *
 * @param subDir - Optional subdirectory name within the user data path
 * @returns The application data path
 */
export const getUnifiedAppDataPath = (subDir?: string): string => {
  // Handle both main and renderer process
  const isRenderer = process.type === 'renderer'
  const electronApp = isRenderer ? require('@electron/remote').app : app

  // Use Electron's native API which handles Windows %APPDATA% redirection correctly
  let userDataPath: string
  if (electronApp) {
    userDataPath = electronApp.getPath('userData')
  } else {
    // CLI / pure Node.js environment (e.g. running TypeORM migrations)
    userDataPath = getLegacyAppDataPath('MQTTX')
  }

  if (subDir) {
    // For backward compatibility, if subDir is 'MQTTX' and it's already in the path, don't duplicate it
    if (subDir === 'MQTTX' && userDataPath.includes('MQTTX')) {
      return userDataPath
    }
    return path.join(userDataPath, subDir)
  }

  return userDataPath
}

/**
 * Get the legacy path where data might have been stored
 * This is used for migration purposes only
 *
 * @param subDir - Optional subdirectory name
 * @returns The legacy application data path
 */
export const getLegacyDataPath = (subDir?: string): string => {
  try {
    return getLegacyAppDataPath(subDir || 'MQTTX')
  } catch (error) {
    console.warn('[AppDataPath] Failed to get legacy path:', error)
    // Fallback to Electron's native path if legacy method fails
    return getUnifiedAppDataPath(subDir)
  }
}

/**
 * Check if data migration is needed
 *
 * @param dbFileName - The database file name (default: 'MQTTX.db')
 * @returns Whether migration is needed and the paths involved
 */
export const checkMigrationNeeded = (
  dbFileName: string = 'MQTTX.db',
): {
  needed: boolean
  legacyPath?: string
  newPath?: string
  legacyDbPath?: string
  newDbPath?: string
} => {
  const newPath = getUnifiedAppDataPath('MQTTX')
  const legacyPath = getLegacyDataPath('MQTTX')

  // If paths are the same, no migration needed
  if (newPath === legacyPath) {
    return { needed: false }
  }

  const legacyDbPath = path.join(legacyPath, dbFileName)
  const newDbPath = path.join(newPath, dbFileName)

  // Check if legacy database exists but new one doesn't
  const legacyExists = fs.pathExistsSync(legacyDbPath)
  const newExists = fs.pathExistsSync(newDbPath)

  if (legacyExists && !newExists) {
    console.log('[AppDataPath] Migration needed:')
    console.log('  From:', legacyDbPath)
    console.log('  To:', newDbPath)
    return {
      needed: true,
      legacyPath,
      newPath,
      legacyDbPath,
      newDbPath,
    }
  }

  return { needed: false }
}

/**
 * Migrate data from legacy path to new path
 *
 * @param dbFileName - The database file name (default: 'MQTTX.db')
 * @returns Success status and error message if failed
 */
export const migrateDataIfNeeded = async (
  dbFileName: string = 'MQTTX.db',
): Promise<{
  success: boolean
  migrated: boolean
  error?: string
}> => {
  try {
    const migrationCheck = checkMigrationNeeded(dbFileName)

    if (!migrationCheck.needed) {
      return { success: true, migrated: false }
    }

    const { legacyPath, newPath, legacyDbPath, newDbPath } = migrationCheck

    if (!legacyPath || !newPath || !legacyDbPath || !newDbPath) {
      return { success: true, migrated: false }
    }

    // Ensure new directory exists
    await fs.ensureDir(newPath)

    // Copy all files from legacy directory to new directory
    console.log('[AppDataPath] Starting data migration...')

    try {
      // Get all files in legacy directory
      const files = await fs.readdir(legacyPath)

      for (const file of files) {
        const srcFile = path.join(legacyPath, file)
        const destFile = path.join(newPath, file)

        // Skip if destination already exists
        if (await fs.pathExists(destFile)) {
          console.log(`[AppDataPath] Skipping ${file} (already exists in destination)`)
          continue
        }

        // Copy file or directory
        const stat = await fs.stat(srcFile)
        if (stat.isDirectory()) {
          await fs.copy(srcFile, destFile)
        } else {
          await fs.copyFile(srcFile, destFile)
        }
        console.log(`[AppDataPath] Migrated: ${file}`)
      }

      console.log('[AppDataPath] Data migration completed successfully')

      // Optionally, rename old directory to indicate it's been migrated
      const backupPath = `${legacyPath}_backup_${Date.now()}`
      try {
        await fs.rename(legacyPath, backupPath)
        console.log(`[AppDataPath] Legacy directory renamed to: ${backupPath}`)
      } catch (renameError) {
        console.warn('[AppDataPath] Could not rename legacy directory:', renameError)
        // Not critical, continue
      }

      return { success: true, migrated: true }
    } catch (copyError) {
      console.error('[AppDataPath] Migration failed:', copyError)
      // If migration fails, we'll continue using the legacy path
      return {
        success: false,
        migrated: false,
        error: `Migration failed: ${copyError}`,
      }
    }
  } catch (error) {
    console.error('[AppDataPath] Error checking migration:', error)
    return {
      success: false,
      migrated: false,
      error: `Error checking migration: ${error}`,
    }
  }
}

/**
 * Ensure the app data directory exists
 *
 * @param dirPath - The directory path to ensure exists
 */
export const ensureAppDataDir = (dirPath: string): void => {
  try {
    if (!fs.pathExistsSync(dirPath)) {
      fs.mkdirpSync(dirPath)
    }
  } catch (err) {
    console.error('[AppDataPath] Failed to create app data directory:', err)
  }
}
