const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
  configureWebpack: {
    plugins: [
      new MonacoWebpackPlugin({
        output: 'static/',
        languages: ['json'],
        features: ['!accessibilityHelp', '!bracketMatching', 'caretOperations', 'clipboard', 'codeAction', 
          'codelens', 'colorDetector', '!comment', '!contextmenu', 'coreCommands', 'cursorUndo', '!dnd', '!find',
          '!folding', '!fontZoom', '!format', '!gotoError', '!gotoLine', '!gotoSymbol', '!hover', '!iPadShowKeyboard',
          '!inPlaceReplace', 'inspectTokens', 'linesOperations', '!links', '!multicursor', '!parameterHints',
          'quickCommand', 'quickOutline', '!referenceSearch', '!rename', 'smartSelect', 'snippets', '!suggest',
          '!toggleHighContrast', 'toggleTabFocusMode', 'transpose','wordHighlighter',
          'wordOperations', 'wordPartOperations'],
      }),
    ],
  },
  pluginOptions: {
    electronBuilder: {
      // Prevent bundling of certain imported packages and instead retrieve these external dependencies at runtime.
      // In order to connect to websocket.
      externals: ['mqtt'],
      builderOptions: {
        productName: 'MQTTX',
        appId: 'mqttx-app.ysf.mqttx-app',
        win: {
          icon: './public/app.ico'
        },
        mac: {
          icon: './public/icons/Icon.icns',
          target: [
            'pkg',
            'dmg',
            'zip',
            'mas',
          ],
          extendInfo: {
            ElectronTeamID: '72J4Z38V6Q'
          }
        },
        mas: {
          icon: './public/icons/Icon.icns',
          extendInfo: {
            ElectronTeamID: '72J4Z38V6Q'
          },
        },
        linux: {
          icon: './public/app.png'
        }
      }
    }
  }
}
