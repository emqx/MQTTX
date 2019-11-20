import { app, shell, BrowserWindow } from 'electron'
import updateChecker from './updateChecker'

const isMac = process.platform === 'darwin'

const getMenuTemplate = (win: BrowserWindow): $TSFixed => {
  return [
    // App
    ...(isMac
      ? [
          {
            label: app.getName(),
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              {
                label: 'Preferences',
                accelerator: 'cmd + ,',
                click: () => {
                  win.webContents.send('preferences')
                },
              },
              {
                label: 'Check for update',
                click: () => {
                  updateChecker(false)
                },
              },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideothers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    // File
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },
    // EditMenu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }],
              },
            ]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // windowMenu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' },
            ]
          : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn more MQTTX',
          click: async () => {
            await shell.openExternal('https://github.com/emqx/MQTTX')
          },
        },
        {
          label: 'Report problem',
          click: async () => {
            await shell.openExternal('https://github.com/emqx/MQTTX/issues')
          },
        },
        { type: 'separator' },
        {
          label: 'EMQ X Website',
          click: async () => {
            await shell.openExternal('https://emqx.io')
          },
        },
      ],
    },
  ]
}

export default getMenuTemplate
