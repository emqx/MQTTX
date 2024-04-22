import fs from 'fs'
import path from 'path'
import YAML from 'js-yaml'
import signale from 'signale'

export const processPath = (savePath: boolean | string, defaultPath?: string) => {
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

export const getPathExtname = (filePath: string): string => path.extname(filePath)

export const fileExists = (filePath: string): boolean => fs.existsSync(filePath)

export const isYaml = (filePath: string): boolean => {
  const fileExtension = getPathExtname(filePath)
  return fileExtension === '.yaml' || fileExtension === '.yml'
}

export const parseYamlOrJson = (data: string, isYaml: boolean): Config => {
  return isYaml ? YAML.load(data) : JSON.parse(data)
}

export const stringifyToYamlOrJson = (data: Config, isYaml: boolean): string => {
  return isYaml ? YAML.dump(data) : JSON.stringify(data, null, 2)
}

export const readFile = (filePath: string): Buffer => {
  try {
    return fs.readFileSync(filePath)
  } catch (error) {
    signale.error(error)
    process.exit(1)
  }
}

export const writeFile = (filePath: string, data: string | Buffer): void => {
  try {
    fs.writeFileSync(filePath, data)
  } catch (error) {
    signale.error(error)
    process.exit(1)
  }
}

export const appendFile = (filePath: string, data: string | Buffer): void => {
  try {
    fs.appendFileSync(filePath, `${data}\n`)
  } catch (error) {
    signale.error(error)
    process.exit(1)
  }
}

export const createNextNumberedFileName = (filePath: string): string => {
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  try {
    if(!fileExists(filePath))
      return filePath

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
  } catch(err) {
    signale.error(`Error: Unable to create a new numbered file name for path '${filePath}'.`)
    process.exit(1)
  }
}