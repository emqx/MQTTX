import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import axios from 'axios'
import { BrowserWindow, dialog } from 'electron'
import { getAppDataPath } from 'appdata-path'
import sudo from 'sudo-prompt'
import version from '@/version'
import { exec } from 'child_process'
import { compareVersions } from 'compare-versions'
import { getCurrentLang } from './updateChecker'

const STORE_PATH = getAppDataPath('MQTTX')
const MQTTX_VERSION = `v${version}`

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
        const installedVersion = `v${stdout.trim().split('\n')[0]}`
        if (compareVersions(installedVersion, MQTTX_VERSION) >= 0) {
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
              resolve(response.response === 0 ? false : true)
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

  const response = await axios({
    method: 'get',
    url: downloadUrl,
    responseType: 'stream',
  })

  const writer = fs.createWriteStream(outputPath)
  response.data.pipe(writer)

  return await new Promise<string>((resolve, reject) => {
    const totalLength = parseInt(response.headers['content-length'])
    let downloadedLength = 0

    response.data.on('data', (chunk: Buffer) => {
      downloadedLength += chunk.length
      const percent = parseFloat((downloadedLength / totalLength).toFixed(2))
      win.webContents.send('downloadCLI', percent, true)
      win.setProgressBar(percent)
    })

    writer.on('finish', () => {
      win.webContents.send('downloadCLI', 1, false)
      win.setProgressBar(-1)
      resolve(outputPath)
    })

    writer.on('error', (err) => {
      win.setProgressBar(-1)
      win.webContents.send('downloadCLI', 0, false)
      writer.close()
      fs.unlink(outputPath, () => {})
      reject(err)
    })
  })
}

/**
 * Installs MQTTX CLI by executing a sudo command.
 *
 * @param installPath - The path of the installation file.
 * @param win - The BrowserWindow instance.
 * @returns A Promise that resolves when the installation is completed.
 */
async function sudoInstall(installPath: string, win: BrowserWindow): Promise<void> {
  const installCommand = `install "${installPath}" /usr/local/bin/mqttx`
  const options = { name: 'MQTTX' }

  sudo.exec(installCommand, options, (error, stdout, stderr) => {
    if (error || stderr) {
      const errorMessage = error ? error.message : stderr
      dialog.showErrorBox(
        'Installation Error',
        `An error occurred during the installation of MQTTX CLI: ${errorMessage}`,
      )
    } else {
      dialog.showMessageBox({
        type: 'info',
        title: 'Installation Completed',
        message: 'MQTTX CLI has been successfully installed.\n\nYou can run "mqttx" commands in the terminal now.',
      })
      fs.unlink(installPath, () => console.log('Downloaded file deleted.'))
    }
    win.webContents.send('installedCLI')
  })
}

/**
 * Displays a message box to inform the user that the MQTTX CLI has been successfully downloaded.
 * It also provides instructions on how to use the downloaded CLI.
 *
 * @param outputPath - The path where the MQTTX CLI is downloaded.
 * @param fileName - The name of the MQTTX CLI file.
 * @param win - The BrowserWindow instance.
 */
function showDownloadedWindowsCLI(outputPath: string, fileName: string, win: BrowserWindow) {
  dialog.showMessageBox({
    type: 'info',
    title: 'Download Completed',
    message: `MQTTX CLI has been successfully downloaded.\n\nPlease manually run '${fileName}' located at: ${outputPath} to use it.`,
  })
  win.webContents.send('installedCLI')
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
 * @param win - The BrowserWindow object.
 * @returns A Promise that resolves when the installation is complete.
 */
export default async function installCLI(win: BrowserWindow) {
  const { platform, arch } = {
    platform: os.platform(),
    arch: os.arch(),
  }
  const isWindows = platform === 'win32'
  const isMacOS = platform === 'darwin'

  const isInstalled = await checkInstalledMqttxCLI(win, isWindows)
  if (isInstalled) {
    win.webContents.send('installedCLI')
    return
  }

  const lang = await getCurrentLang()

  const suffix = isWindows ? 'win' : isMacOS ? 'macos' : 'linux'
  const archSuffix = getArchSuffix(arch, isWindows)
  const fileName = `mqttx-cli-${suffix}-${archSuffix}`
  const downloadUrl = `https://www.emqx.com/${lang}/downloads/MQTTX/${version}/${fileName}`
  const defaultOutputPath = path.join(STORE_PATH, fileName)

  try {
    const installPath = await downloadMqttxCLI(downloadUrl, defaultOutputPath, win, isWindows)
    if (!isWindows) {
      await sudoInstall(installPath, win)
    } else {
      showDownloadedWindowsCLI(installPath, fileName, win)
    }
  } catch (error) {
    const err = error as Error
    dialog.showErrorBox('Error', `Failed to install MQTTX CLI: ${err.message}`)
    win.webContents.send('installedCLI')
  }
}
