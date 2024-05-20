import fs from 'fs'
import path from 'path'
import getDirAndFileName from './getDirAndFileName.js'

const { __dirname } = getDirAndFileName(import.meta.url)

const packagePath = path.join(__dirname, '../../package.json')

function getVersion() {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  return packageJson.version
}

export default getVersion
