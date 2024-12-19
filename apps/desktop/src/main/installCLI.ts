import type { InstallCLIEvent } from '../preload/index.d'
import { exec } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { promisify } from 'node:util'
import { compareVersions, validate } from 'compare-versions'
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import sudo from 'sudo-prompt'

const STORE_PATH = app.getPath('userData')
const MQTTX_VERSION = app.getVersion()

/**
 * Checks if the MQTTX CLI is installed and up to date.
 *
 * @param win - The BrowserWindow instance.
 * @param isWindows - Boolean indicating if the OS is Windows.
 * @returns A promise that resolves to a boolean indicating whether the MQTTX CLI is installed and up to date.
 */
async function checkInstalledMqttxCLI(win: BrowserWindow, isWindows: boolean): Promise<boolean> {
  if (isWindows) {
    return Promise.resolve(false)
  }

  return new Promise((resolve) => {
    exec('mqttx --version', (error, stdout, stderr) => {
      if (error) {
        resolve(false)
      } else if (stderr) {
        const errorMessage = stderr.toString().trim()
        dialog.showErrorBox('Error', `An error occurred while checking the MQTTX CLI version: ${errorMessage}`)
        resolve(false)
      } else {
        const installedVersion = stdout.trim().split('\n')[0]
        if (validate(installedVersion) && compareVersions(installedVersion, MQTTX_VERSION) >= 0) {
          dialog.showMessageBox(win, {
            type: 'info',
            title: 'Check Existing Installation',
            message: `MQTTX CLI is already installed and up to date (version: ${installedVersion}).`,
          })
          resolve(true)
        } else {
          dialog
            .showMessageBox(win, {
              type: 'question',
              buttons: ['Yes', 'No'],
              title: 'Found Older Version',
              message: `Installed version: ${installedVersion}\nNew version: ${MQTTX_VERSION}\n\nDo you want to upgrade?`,
            })
            .then((response) => {
              resolve(response.response !== 0)
            })
        }
      }
    })
  })
}

/**
 * Downloads the Mqttx CLI from the specified URL and saves it to the specified output path.
 *
 * @param downloadUrl - The URL from which to download the Mqttx CLI.
 * @param defaultOutputPath - The default output path where the downloaded CLI will be saved.
 * @param win - The BrowserWindow instance.
 * @param isWindows - A boolean indicating whether the current platform is Windows.
 * @returns A Promise that resolves to the output path of the downloaded CLI.
 * @throws An error if no download folder is selected on Windows.
 */
async function downloadMqttxCLI(
  downloadUrl: string,
  defaultOutputPath: string,
  win: BrowserWindow,
  isWindows: boolean,
): Promise<string> {
  let outputPath = defaultOutputPath

  if (isWindows) {
    const result = dialog.showOpenDialogSync(win, {
      title: 'Select Download Folder',
      properties: ['openDirectory', 'createDirectory'],
    })

    if (result && result.length > 0) {
      const fileName = path.basename(downloadUrl)
      outputPath = path.join(result[0], fileName)
    } else {
      throw new Error('No download folder selected.')
    }
  }

  const response = await fetch(downloadUrl)

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download MQTTX CLI: ${response.statusText}`)
  }

  const totalLength = Number(response.headers.get('content-length')) || 0
  const writer = fs.createWriteStream(outputPath)
  const reader = response.body.getReader()

  return new Promise<string>((resolve, reject) => {
    let downloadedLength = 0
    sendInstallCLIStatus({ status: 'download-progress', data: { percent: 0 } })
    win.setProgressBar(0)

    function read() {
      reader.read().then(({ done, value }) => {
        if (done) {
          writer.end()
          sendInstallCLIStatus({ status: 'cli-downloaded' })
          win.setProgressBar(-1)
          resolve(outputPath)
          return
        }

        downloadedLength += value.length
        const percent = totalLength ? Math.round((downloadedLength / totalLength) * 100) : 0
        sendInstallCLIStatus({ status: 'download-progress', data: { percent } })
        win.setProgressBar(percent / 100)
        writer.write(Buffer.from(value))
        read()
      }).catch((err) => {
        win.setProgressBar(-1)
        writer.close()
        fs.unlink(outputPath, () => {})
        reject(err)
      })
    }

    read()
  })
}

type ExecFunctionParams = Parameters<typeof sudo.exec>

/**
 * Installs MQTTX CLI by executing a sudo command.
 *
 * @param installPath - The path of the installation file.
 * @returns A Promise that resolves when the installation is completed.
 */
async function sudoInstall(installPath: string): Promise<void> {
  const installCommand = `install "${installPath}" /usr/local/bin/mqttx`
  const options = { name: 'MQTTX' }
  const execPromise = promisify<ExecFunctionParams['0'], ExecFunctionParams['1']>(sudo.exec)
  try {
    await execPromise(installCommand, options)
    dialog.showMessageBox({
      type: 'info',
      title: 'Installation Completed',
      message: 'MQTTX CLI has been successfully installed.\n\nYou can run "mqttx" commands in the terminal now.',
    })
    fs.unlink(installPath, () => console.log('Downloaded file deleted.'))
  } catch (error) {
    const err = error as Error
    dialog.showErrorBox(
      'Installation Error',
      `An error occurred during the installation of MQTTX CLI: ${err.message}`,
    )
  }
}

/**
 * Displays a message box to inform the user that the MQTTX CLI has been successfully downloaded.
 * It also provides instructions on how to use the downloaded CLI.
 *
 * @param outputPath - The path where the MQTTX CLI is downloaded.
 * @param fileName - The name of the MQTTX CLI file.
 */
function showDownloadedWindowsCLI(outputPath: string, fileName: string) {
  dialog.showMessageBox({
    type: 'info',
    title: 'Download Completed',
    message: `MQTTX CLI has been successfully downloaded.\n\nPlease manually run '${fileName}' located at: ${outputPath} to use it.`,
  })
}

/**
 * Returns the architecture suffix based on the provided architecture and operating system.
 * @param arch - The architecture string.
 * @param isWindows - Indicates whether the operating system is Windows.
 * @returns The architecture suffix.
 */
function getArchSuffix(arch: string, isWindows: boolean): string {
  let suffix: string
  switch (arch) {
    case 'arm':
    case 'arm64':
    case 'aarch64':
      suffix = 'arm64'
      break
    case 'x64':
    case 'amd64':
      suffix = 'x64'
      break
    default:
      suffix = 'x64'
      break
  }
  if (isWindows) {
    suffix += '.exe'
  }
  return suffix
}

/**
 * Installs MQTTX CLI if it is not already installed.
 *
 * @returns A Promise that resolves when the installation is complete.
 */
async function installCLI() {
  const win = BrowserWindow.getFocusedWindow()!
  const { platform, arch } = {
    platform: os.platform(),
    arch: os.arch(),
  }
  const isWindows = platform === 'win32'
  const isMacOS = platform === 'darwin'

  const isInstalled = await checkInstalledMqttxCLI(win, isWindows)

  if (isInstalled) return

  const suffix = isWindows ? 'win' : isMacOS ? 'macos' : 'linux'
  const archSuffix = getArchSuffix(arch, isWindows)
  const fileName = `mqttx-cli-${suffix}-${archSuffix}`
  // TODO: Remove before official release
  const downloadUrl = `https://www.emqx.com/en/downloads/MQTTX/1.11.1/${fileName}`
  // const downloadUrl = `https://www.emqx.com/en/downloads/MQTTX/${MQTTX_VERSION}/${fileName}`
  const defaultOutputPath = path.join(STORE_PATH, fileName)

  try {
    const installPath = await downloadMqttxCLI(downloadUrl, defaultOutputPath, win, isWindows)
    if (!isWindows) {
      await sudoInstall(installPath)
    } else {
      showDownloadedWindowsCLI(installPath, fileName)
    }
  } catch (error) {
    const err = error as Error
    dialog.showErrorBox('Error', `Failed to install MQTTX CLI: ${err.message}`)
  }
}

function sendInstallCLIStatus(installCLIEvent: InstallCLIEvent) {
  const windows = BrowserWindow.getAllWindows()
  windows.forEach((window) => {
    if ('data' in installCLIEvent) {
      window.webContents.send('install-cli-status', installCLIEvent.status, installCLIEvent.data)
    } else {
      window.webContents.send('install-cli-status', installCLIEvent.status)
    }
  })
}

function useInstallCLI() {
  ipcMain.handle('install-cli', async () => {
    return await installCLI()
  })
}

export { useInstallCLI }
