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
      externals: ['mqtt', 'vm2', 'log4js'],
      builderOptions: {
        productName: 'MQTTX',
        win: {
          artifactName: 'MQTTX.Setup.${version}.${ext}',
          icon: './public/icons/app.ico',
        },
        mac: {
          icon: './public/icons/mac/Icon.icns',
          target: [
            {
              target: 'dmg',
              arch: 'universal',
            },
            {
              target: 'pkg',
              arch: 'universal',
            },
            {
              target: 'zip',
              arch: 'universal',
            },
          ],
        },
        linux: {
          icon: './public/icons/app.png',
          target: ['AppImage', 'deb', 'rpm', 'snap'],
        },
      },
    },
  },
}
