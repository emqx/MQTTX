import { BrowserWindow, dialog } from 'electron'
import fs from 'fs'

const saveFile = (win: BrowserWindow, filename: string, content: string, type: string) => {
  dialog
    .showSaveDialog(win, {
      title: 'Dowload file',
      defaultPath: `${filename}.${type}`,
    })
    .then((res) => {
      const { filePath } = res
      if (filePath) {
        fs.writeFile(filePath, content, 'utf8', (err) => {
          if (err) {
            dialog.showMessageBox({
              type: 'error',
              title: 'System',
              message: `An error ocurred creating the file ${err.message}`,
            })
          }
          win.webContents.send('saved')
        })
      }
    })
}

export default saveFile
