import type { MenuItem, MenuItemConstructorOptions } from 'electron'
import type { Lang, Settings } from 'mqttx'
import { app, BrowserWindow, Menu, shell } from 'electron'
import Store from 'electron-store'
import menuLabels from './menuLabels'

// FIXME: https://github.com/sindresorhus/electron-store/issues/276
const store = new Store() as any

function getMenuLabels(lang: Lang) {
  const labels: Record<keyof typeof menuLabels, string> = Object.keys(menuLabels).reduce((acc, key) => {
    acc[key] = menuLabels[key][lang]
    return acc
  }, {} as Record<keyof typeof menuLabels, string>)
  return labels
}

const isMac = process.platform === 'darwin'

function getMenuTemplate(win: BrowserWindow, lang?: Lang) {
  const language = lang || 'en'
  const labels = getMenuLabels(language)
  const MQTTXWebsite = `https://mqttx.app${['zh', 'ja'].includes(language) ? `/${lang}` : ''}`
  const EMQWebsite = `https://emqx.com${['en', 'zh', 'ja'].includes(language) ? `/${lang}` : '/en'}`

  const macAppMenu: MenuItemConstructorOptions = {
    label: app.getName(),
    submenu: [
      {
        label: labels.about,
        click: () => {
          win.webContents.send('menu-clicked', 'about')
        },
      },
      { type: 'separator' },
      {
        label: labels.preferences,
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          win.webContents.send('menu-clicked', 'preferences')
        },
      },
      {
        label: labels.checkForUpdates,
        click: () => {
          win.webContents.send('menu-clicked', 'checkForUpdate')
        },
      },
      {
        label: labels.installCLI,
        click: () => {
          win.webContents.send('menu-clicked', 'installCLI')
        },
      },
      { type: 'separator' },
      { role: 'hide', label: labels.hideMQTTX },
      { role: 'hideOthers', label: labels.hideOthers },
      { role: 'unhide', label: labels.unhid },
      { type: 'separator' },
      { role: 'quit', label: labels.quit },
    ],
  }

  const menuTemplate: Array<(MenuItemConstructorOptions) | (MenuItem)> = [
    // App
    ...(isMac ? [macAppMenu] : []),
    // File
    {
      label: labels.file,
      submenu: [
        {
          label: labels.newConnection,
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            win.webContents.send('menu-clicked', 'newConnection')
          },
        },
        {
          label: labels.newWindow,
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            // TODO: implement new window
            win.webContents.send('menu-clicked', 'newWindow')
          },
        },
        { role: 'close', label: labels.closeWindow },
      ],
    },
    // Edit
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
              { role: 'pasteAndMatchStyle' as const, label: labels.pasteAndMatchStyle },
              { role: 'delete' as const, label: labels.delete },
              { role: 'selectAll' as const, label: labels.selectAll },
              { type: 'separator' as const },
              {
                label: labels.speech,
                submenu: [
                  { role: 'startSpeaking' as const, label: labels.startSpeaking },
                  { role: 'stopSpeaking' as const, label: labels.stopSpeaking },
                ],
              },
            ]
          : [
              { role: 'delete' as const, label: labels.delete },
              { type: 'separator' as const },
              { role: 'selectAll' as const, label: labels.selectAll },
            ]),
        { type: 'separator' },
      ],
    },
    // View
    {
      label: labels.view,
      submenu: [
        { role: 'reload', label: labels.reload },
        { role: 'forceReload', label: labels.forceReload },
        { role: 'toggleDevTools', label: labels.toggleDevTools },
        { type: 'separator' },
        { role: 'resetZoom', label: labels.actualSize },
        { role: 'zoomIn', label: labels.zoomIn },
        { role: 'zoomOut', label: labels.zoomOut },
        { type: 'separator' },
        { role: 'togglefullscreen', label: labels.toggleFullScreen },
      ],
    },
    // Window
    {
      // TODO: Since a good way to localize the submenu of this menu has not been found, only the top-level menu is localized for now
      role: 'windowMenu',
      label: labels.window,
      // submenu: [
      //   { role: 'minimize', label: labels.minimize },
      //   { role: 'zoom', label: labels.zoom },
      //   ...(isMac
      //     ? [
      //         { type: 'separator' as const },
      //         { role: 'front' as const, label: labels.bringAllToFront },
      //       ]
      //     : [
      //         { role: 'close' as const, label: labels.closeWindow },
      //       ]),
      // ],
    },
    // Help
    {
      role: 'help',
      label: labels.help,
      submenu: [
        {
          label: labels.documentation,
          click: async () => {
            await shell.openExternal(`${MQTTXWebsite}/docs?utm_source=mqttx&utm_medium=referral&utm_campaign=menu-to-docs`)
          },
        },
        {
          label: labels.reportIssue,
          click: async () => {
            await shell.openExternal('https://github.com/emqx/MQTTX/issues')
          },
        },
        {
          label: labels.contactUs,
          click: async () => {
            await shell.openExternal(`${EMQWebsite}/contact?utm_source=mqttx&utm_medium=referral&utm_campaign=menu-to-contact`)
          },
        },
        { type: 'separator' },
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
        { type: 'separator' },
        {
          label: labels.MQTTXWebsite,
          click: async () => {
            await shell.openExternal(`${MQTTXWebsite}?utm_source=mqttx&utm_medium=referral&utm_campaign=menu-to-homepage`)
          },
        },
        {
          label: labels.EMQWebsite,
          click: async () => {
            await shell.openExternal(`${EMQWebsite}?utm_source=mqttx&utm_medium=referral&utm_campaign=menu-to-homepage`)
          },
        },
      ],
    },
  ]

  return menuTemplate
}

export function setMenu() {
  const win = BrowserWindow.getFocusedWindow()!
  const settings = store.get('settings') as Settings | undefined
  const menuTemplate = getMenuTemplate(win, settings?.currentLang || 'en')
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
}
