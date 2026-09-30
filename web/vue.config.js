const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
  publicPath: process.env.BASE_URL,
  outputDir: process.env.VUE_APP_OUTPUT_DIR,
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === 'test') {
      // Service imports initialize lowdb; keep tests independent of browser storage.
      config.resolve.alias.set('lowdb/adapters/LocalStorage', require.resolve('lowdb/adapters/Memory'))
    }
  },
  configureWebpack: {
    plugins: [
      new MonacoWebpackPlugin({
        output: 'static/',
        languages: ['json'],
        features: [
          '!accessibilityHelp',
          '!bracketMatching',
          'caretOperations',
          'clipboard',
          'codeAction',
          'codelens',
          'colorDetector',
          '!comment',
          '!contextmenu',
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
          '!suggest',
          '!toggleHighContrast',
          'toggleTabFocusMode',
          'transpose',
          'wordHighlighter',
          'wordOperations',
          'wordPartOperations',
        ],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto',
        },
        {
          test: /\.md$/,
          use: 'raw-loader',
        },
      ],
    },
  },
}
