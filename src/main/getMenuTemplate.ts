import { app, shell, BrowserWindow } from 'electron'
import updateChecker from './updateChecker'
import translations from '../lang/menu'

const isMac = process.platform === 'darwin'

const getMenuTemplate = (win: BrowserWindow, lang?: Language): $TSFixed => {
  const labels = {} as Record<keyof typeof translations, string>
  Object.keys(translations).forEach((key: keyof typeof translations) => {
    labels[key] = translations[key][lang || 'en']
  })

  return [
    // App
    ...(isMac
      ? [
          {
            label: app.getName(),
            submenu: [
              {
                label: labels.about,
                accelerator: 'cmd + b',
                click: () => {
                  win.webContents.send('about')
                },
              },
              { type: 'separator' },
              {
                label: labels.preferences,
                accelerator: 'cmd + ,',
                click: () => {
                  win.webContents.send('preferences')
                },
              },
              {
                label: labels.checkForUpdate,
                click: () => {
                  updateChecker(false)
                },
              },
              { type: 'separator' },
              { role: 'hide', label: labels.hideMQTTX },
              { role: 'hideothers', label: labels.hideOthers },
              { role: 'unhide', label: labels.unhid },
              { type: 'separator' },
              { role: 'quit', label: labels.quit },
            ],
          },
        ]
      : []),
    // File
    {
      label: labels.file,
      submenu: [
        {
          label: labels.newWindow,
          accelerator: 'CmdOrCtrl + Shift + N',
          click: () => {
            win.webContents.send('newWindow')
          },
        },
        { role: 'close', label: labels.closeWindow },
      ],
    },
    // EditMenu
    {
      label: labels.edit,
      submenu: [
        { role: 'undo', label: labels.undo },
        { role: 'redo', label: labels.redo },
        { type: 'separator' },
        { role: 'cut', label: labels.cut },
        { role: 'copy', label: labels.copy },
        { role: 'paste', label: labels.paste },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle', label: labels.pasteAndMatchStyle },
              { role: 'delete', label: labels.delete },
              { role: 'selectAll', label: labels.selectAll },
              { type: 'separator' },
              {
                label: labels.speech,
                submenu: [
                  { role: 'startspeaking', label: labels.startSpeaking },
                  { role: 'stopspeaking', label: labels.stopSpeaking },
                ],
              },
            ]
          : [
              { role: 'delete', label: labels.delete },
              { type: 'separator' },
              { role: 'selectAll', label: labels.selectAll },
            ]),
        { type: 'separator' },
        {
          label: labels.newConnections,
          accelerator: 'CmdOrCtrl + N',
          click: () => {
            win.webContents.send('newConnections')
          },
        },
        {
          label: labels.sendPayload,
          accelerator: 'CmdOrCtrl + Enter',
          click: () => {
            win.webContents.send('sendPayload')
          },
        },
        {
          label: labels.search,
          accelerator: 'CmdOrCtrl + F',
          click: () => {
            win.webContents.send('searchContent')
          },
        },
      ],
    },
    {
      label: labels.view,
      submenu: [
        { role: 'reload', label: labels.reload },
        { role: 'forcereload', label: labels.forceReload },
        { role: 'toggledevtools', label: labels.toggleDevTools },
        { type: 'separator' },
        { role: 'resetzoom', label: labels.actualSize },
        { role: 'zoomin', label: labels.zoomIn },
        { role: 'zoomout', label: labels.zoomOut },
        { type: 'separator' },
        { role: 'togglefullscreen', label: labels.toggleFullScreen },
      ],
    },
    // windowMenu
    {
      label: labels.window,
      submenu: [
        { role: 'minimize', label: labels.minimize },
        { role: 'zoom', label: labels.zoom },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front', label: labels.bringAllToFront }]
          : [{ role: 'close', label: labels.closeWindow }]),
      ],
    },
    {
      role: 'help',
      label: labels.help,
      submenu: [
        {
          label: labels.learnMoreMQTTX,
          click: async () => {
            await shell.openExternal('https://github.com/emqx/MQTTX')
          },
        },
        {
          label: labels.learnMoreEMQX,
          click: async () => {
            await shell.openExternal('https://github.com/emqx/emqx')
          },
        },
        {
          label: labels.reportProblem,
          click: async () => {
            await shell.openExternal('https://github.com/emqx/MQTTX/issues')
          },
        },
        { type: 'separator' },
        {
          label: labels.MQTTXWebsite,
          click: async () => {
            await shell.openExternal('https://mqttx.app')
          },
        },
        {
          label: labels.EMQXWebsite,
          click: async () => {
            await shell.openExternal('https://www.emqx.io')
          },
        },
      ],
    },
  ]
}

export default getMenuTemplate
