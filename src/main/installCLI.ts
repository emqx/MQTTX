import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import axios from 'axios'
import { BrowserWindow, dialog } from 'electron'
import { getAppDataPath } from 'appdata-path'
import sudo from 'sudo-prompt'
import version from '@/version'

const STORE_PATH = getAppDataPath('MQTTX')

export default async function installCLI(win: BrowserWindow) {
  const { platform, arch } = {
    platform: os.platform(),
    arch: os.arch(),
  }
  const mqttxVersion = `v${version}`
  const suffix = platform === 'darwin' ? 'macos' : 'linux'
  const binarySuffix = arch === 'x64' ? '-x64' : '-arm64'
  const fileName = `mqttx-cli-${suffix}${binarySuffix}`
  const downloadUrl = `https://www.emqx.com/en/downloads/MQTTX/${mqttxVersion}/${fileName}`
  const outputPath = path.join(STORE_PATH, fileName)

  try {
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
        console.log(`Downloading... ${percent}%`)
      })

      writer.on('finish', () => {
        console.log(`${fileName} downloaded.`)
        resolve()
      })

      writer.on('error', (err) => {
        console.error(`Error downloading the file: ${err.message}`)
        writer.close()
        fs.unlink(outputPath, () => {})
        reject(err)
      })
    })

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
          message: 'MQTTX CLI installed successfully.',
        })
        fs.unlink(outputPath, () => console.log('Downloaded file deleted.'))
      }
    })
  } catch (error) {
    dialog.showErrorBox('Download Error', `Failed to download: ${error}`)
  }
}
