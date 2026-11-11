import fs from 'fs'
import path from 'path'
import YAML from 'js-yaml'
import logWrapper from './logWrapper'

const processPath = (savePath: boolean | string, defaultPath?: string) => {
  let filePath = ''
  if (savePath === true && defaultPath) {
    filePath = defaultPath
  } else if (typeof savePath === 'string') {
    filePath = path.normalize(savePath)
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(filePath)
    }
  }
  return filePath
}

const getPathExtname = (filePath: string): string => path.extname(filePath)

const fileExists = (filePath: string): boolean => fs.existsSync(filePath)

const isYaml = (filePath: string): boolean => {
  const fileExtension = getPathExtname(filePath)
  return fileExtension === '.yaml' || fileExtension === '.yml'
}

const parseYamlOrJson = (data: string, isYaml: boolean): Options => {
  return isYaml ? YAML.load(data) : JSON.parse(data)
}

const stringifyToYamlOrJson = (data: Options, isYaml: boolean): string => {
  return isYaml ? YAML.dump(data) : JSON.stringify(data, null, 2)
}

const readFile = (filePath: string): Buffer => {
  try {
    return fs.readFileSync(filePath)
  } catch (error) {
    const err = error as Error
    logWrapper.fail(err.toString())
    process.exit(1)
  }
}

const writeFile = (filePath: string, data: string | Buffer): void => {
  try {
    fs.writeFileSync(filePath, data)
  } catch (error) {
    const err = error as Error
    logWrapper.fail(err.toString())
    process.exit(1)
  }
}

/** Append scalar or list items in one write, preserving each item's encoding. */
const appendFile = (filePath: string, data: string | Buffer | (string | Buffer)[], delimiter = '\n'): void => {
  const items = Array.isArray(data) ? data : [data]
  if (items.length === 0) return
  try {
    const separator = Buffer.from(`${delimiter}`)
    const chunks: Buffer[] = []
    for (const item of items) {
      if (Buffer.isBuffer(item)) {
        chunks.push(item)
        if (separator.length) chunks.push(separator)
      } else {
        chunks.push(Buffer.from(`${item}${delimiter}`))
      }
    }
    fs.appendFileSync(filePath, chunks.length === 1 ? chunks[0] : Buffer.concat(chunks))
  } catch (error) {
    const err = error as Error
    logWrapper.fail(err.toString())
    process.exit(1)
  }
}

const createNextNumberedFileName = (filePath: string): string => {
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  try {
    if (!fileExists(filePath)) return filePath

    const dir = path.dirname(filePath)
    const baseNameWithoutExt = path.basename(filePath, path.extname(filePath))
    const ext = getPathExtname(filePath)
    const files = fs.readdirSync(dir)

    const regex = new RegExp(`${escapeRegExp(baseNameWithoutExt)}\\((\\d+)\\)(${escapeRegExp(ext)})?$`, 'i')

    let maxNumber = 0
    for (const file of files) {
      const match = file.match(regex)
      if (match) {
        const number = parseInt(match[1], 10)
        maxNumber = Math.max(maxNumber, number)
      }
    }
    const newNumber = maxNumber + 1
    const newFileName = `${baseNameWithoutExt}(${newNumber})${ext}`
    return path.join(dir, newFileName)
  } catch (err) {
    logWrapper.fail(`Error: Unable to create a new numbered file name for path '${filePath}'.`)
    process.exit(1)
  }
}

const fileDataSplitter = (data: string | Buffer, split: true | string): string[] => {
  let defaultSplit = '\n'
  if (split === true) {
    split = defaultSplit
  }
  const stringData = data.toString('utf-8')
  const splitRegex = new RegExp(split, 'g')
  return stringData.split(splitRegex)
}

/** Split batch file items, preserving empty lines and ignoring one trailing separator. */
const splitBatchFile = (data: string | Buffer, split: true | string = true): string[] => {
  let items: string[]
  if (split === true || split === '\n' || split === '\\n') {
    items = data.toString('utf-8').replace(/\r\n/g, '\n').split('\n')
  } else {
    items = fileDataSplitter(data, split)
  }
  if (items[items.length - 1] === '') {
    items.pop()
  }
  return items
}

export {
  processPath,
  getPathExtname,
  fileExists,
  isYaml,
  parseYamlOrJson,
  stringifyToYamlOrJson,
  readFile,
  writeFile,
  appendFile,
  createNextNumberedFileName,
  fileDataSplitter,
  splitBatchFile,
}
