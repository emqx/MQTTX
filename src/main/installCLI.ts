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
 * Downloads a file from the specified URL and saves it to the specified output path.
 * Also updates the download progress on the UI.
 *
 * @param downloadUrl - The URL of the file to download.
 * @param outputPath - The path where the downloaded file will be saved.
 * @param win - The BrowserWindow instance used to send progress updates to the UI.
 * @returns A Promise that resolves when the download is complete.
 */
async function downloadMqttxCLI(downloadUrl: string, outputPath: string, win: BrowserWindow): Promise<void> {
  const response = await axios({
    method: 'get',
    url: downloadUrl,
    responseType: 'stream',
  })

  if (!fs.existsSync(STORE_PATH)) {
    fs.mkdirSync(STORE_PATH, { recursive: true })
  }

  const writer = fs.createWriteStream(outputPath)
  response.data.pipe(writer)

  await new Promise<void>((resolve, reject) => {
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
      resolve()
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
 * @param outputPath - The path of the downloaded file to be installed.
 * @param win - The BrowserWindow instance.
 * @returns A Promise that resolves when the installation is completed.
 */
async function sudoInstall(outputPath: string, win: BrowserWindow): Promise<void> {
  const installCommand = `install "${outputPath}" /usr/local/bin/mqttx`
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
      fs.unlink(outputPath, () => console.log('Downloaded file deleted.'))
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
  const outputPath = path.join(STORE_PATH, fileName)

  try {
    await downloadMqttxCLI(downloadUrl, outputPath, win)
    if (!isWindows) {
      await sudoInstall(outputPath, win)
    } else {
      showDownloadedWindowsCLI(outputPath, fileName, win)
    }
  } catch (error) {
    const err = error as Error
    dialog.showErrorBox('Error', `Failed to install MQTTX CLI: ${err.message}`)
    win.webContents.send('installedCLI')
  }
}
