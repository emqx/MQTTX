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
 * @returns A promise that resolves to a boolean indicating whether the MQTTX CLI is installed and up to date.
 */
async function checkInstalledMqttxCLI(win: BrowserWindow): Promise<boolean> {
  return new Promise((resolve) => {
    exec('mqttx --version', (error, stdout, stderr) => {
      if (error) {
        // MQTTX CLI is not installed
        resolve(false)
      } else {
        // Extract the version from the stdout
        const lines = stdout.trim().split('\n')
        const installedVersion = `v${lines[0]}`

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
              if (response.response === 0) {
                // User chose 'Yes' to upgrade
                resolve(false)
              } else {
                // User chose 'No' to cancel the upgrade
                resolve(true)
              }
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

    response.data.on('data', (chunk: string | any[]) => {
      downloadedLength += chunk.length
      const percent = ((downloadedLength / totalLength) * 100).toFixed(2)
      // Send progress to UI
      win.webContents.send('showProgress', percent)
    })

    writer.on('finish', () => {
      resolve()
    })

    writer.on('error', (err) => {
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
  const options = {
    name: 'MQTTX',
  }

  sudo.exec(installCommand, options, (error: any, stdout: any, stderr: any) => {
    if (error) {
      dialog.showErrorBox('Installation Error', `An error occurred during the installation of MQTTX CLI: ${stderr}`)
    } else {
      dialog.showMessageBox({
        type: 'info',
        title: 'Installation Completed',
        message: 'MQTTX CLI has been successfully installed. You can run "mqttx" commands in the terminal now.',
      })
      fs.unlink(outputPath, () => console.log('Downloaded file deleted.'))
    }
  })
}

function showDownloadedWindowsCLI(outputPath: string, fileName: string) {
  dialog.showMessageBox({
    type: 'info',
    title: 'Download Completed',
    message: `MQTTX CLI has been successfully downloaded. Please manually run '${fileName}' located at: ${outputPath} to use it.`,
  })
}

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
  const isInstalled = await checkInstalledMqttxCLI(win)
  if (isInstalled) {
    return
  }

  const lang = await getCurrentLang()

  const { platform, arch } = {
    platform: os.platform(),
    arch: os.arch(),
  }
  const isWindows = platform === 'win32'
  const isMacOS = platform === 'darwin'
  const suffix = isWindows ? 'win' : isMacOS ? 'macos' : 'linux'
  let archSuffix = getArchSuffix(arch, isWindows)
  const fileName = `mqttx-cli-${suffix}-${archSuffix}`
  const downloadUrl = `https://www.emqx.com/${lang}/downloads/MQTTX/${version}/${fileName}`
  const outputPath = path.join(STORE_PATH, fileName)

  try {
    await downloadMqttxCLI(downloadUrl, outputPath, win)
    if (!isWindows) {
      await sudoInstall(outputPath, win)
    } else {
      showDownloadedWindowsCLI(outputPath, fileName)
    }
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to install MQTTX CLI: ${error}`)
  }
}
