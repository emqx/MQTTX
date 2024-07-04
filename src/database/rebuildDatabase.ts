import fs from 'fs'

const rebuildDatabase = (filePath: string) => {
  fs.writeFile(filePath, '', (error) => {
    if (error) {
      console.error('Error rebuilding database:', error)
    } else {
      console.log('Database rebuilt successfully.')
    }
  })
}

export default rebuildDatabase
