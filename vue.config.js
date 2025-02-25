const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
  productionSourceMap: false,
  devServer: {
    hot: true,
    host: '0.0.0.0',
    disableHostCheck: true,
  },
  configureWebpack: {
    plugins: [
      new MonacoWebpackPlugin({
        output: 'static/',
        languages: ['json', 'javascript'],
        features: [
          '!accessibilityHelp',
          '!bracketMatching',
          'caretOperations',
          'clipboard',
          'codeAction',
          'codelens',
          'colorDetector',
          '!comment',
          'contextmenu',
          'coreCommands',
          'cursorUndo',
          '!dnd',
          '!find',
          '!folding',
          '!fontZoom',
          '!format',
          '!gotoError',
          '!gotoLine',
          '!gotoSymbol',
          '!hover',
          '!iPadShowKeyboard',
          '!inPlaceReplace',
          'inspectTokens',
          'linesOperations',
          '!links',
          '!multicursor',
          '!parameterHints',
          'quickCommand',
          'quickOutline',
          '!referenceSearch',
          '!rename',
          'smartSelect',
          'snippets',
          'suggest',
          '!toggleHighContrast',
          'toggleTabFocusMode',
          'transpose',
          'wordHighlighter',
          'wordOperations',
          'wordPartOperations',
        ],
      }),
    ],
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      // Prevent bundling of certain imported packages and instead retrieve these external dependencies at runtime.
      // In order to connect to websocket.
      externals: ['mqtt', 'vm2', 'log4js', 'typeorm'],
      builderOptions: {
        productName: 'MQTTX',
        publish: null,
        nsis: {
          oneClick: false,
          allowElevation: true,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
        },
        win: {
          artifactName: 'MQTTX-Setup-${version}-${arch}.${ext}',
          icon: './public/icons/app.ico',
          target: [
            {
              target: 'nsis',
              arch: [
                'x64',
                'ia32',
                // FIXME: sqlite3 does not provide prebuilt binaries for Windows ARM64, needs to be compiled manually
                // Issue: https://github.com/TryGhost/node-sqlite3/issues/1799
                // 'arm64'
              ],
            },
          ],
        },
        mac: {
          icon: './public/icons/mac/Icon.icns',
          target: [
            {
              target: 'dmg',
              arch: ['x64', 'arm64'],
            },
            // FIXME: pkg target is not working, it will cause the app to crash when built.
            // Issue: https://github.com/electron-userland/electron-builder/issues/6015
            // {
            //   target: 'pkg',
            //   arch: ['x64', 'arm64'],
            // },
            {
              target: 'zip',
              arch: ['x64', 'arm64'],
            },
          ],
        },
        linux: {
          icon: './public/icons/app.png',
          target: [
            { target: 'AppImage', arch: ['x64', 'arm64'] },
            { target: 'deb', arch: ['x64', 'arm64'] },
            { target: 'rpm', arch: ['x64', 'arm64'] },
            { target: 'snap', arch: ['x64'] },
          ],
        },
      },
    },
  },
}
