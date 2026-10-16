const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const path = require('path')

module.exports = {
  productionSourceMap: false,
  devServer: {
    hot: true,
    host: '0.0.0.0',
    disableHostCheck: true,
  },
  // Instruct Vue CLI to transpile dependencies that ship modern JavaScript
  // (ESM, optional chaining, nullish coalescing) with Babel, since webpack 4
  // cannot parse that syntax on its own.
  transpileDependencies: ['zod-to-json-schema', 'ai', /[\\/]node_modules[\\/]@ai-sdk[\\/]/, '@vercel/oidc', 'zod'],
  chainWebpack: (config) => {
    // The AI SDK v5+ packages rely on package `exports` subpaths that webpack 4
    // cannot resolve, so resolve them with Node, which honors `exports` and finds
    // copies nested under the importing package. For zod v4 this picks the CJS
    // build, which webpack 4 can parse.
    const aliases = {
      '@ai-sdk/provider-utils/experimental-decision$': require.resolve('@ai-sdk/provider-utils/experimental-decision'),
      '@ai-sdk/deepseek/internal$': require.resolve('@ai-sdk/deepseek/internal'),
      '@ai-sdk/openai/internal$': require.resolve('@ai-sdk/openai/internal'),
      'eventsource-parser/stream$': require.resolve('eventsource-parser/stream', {
        paths: [path.dirname(require.resolve('@ai-sdk/provider-utils'))],
      }),
      '@vercel/oidc$': path.resolve(__dirname, 'node_modules/@vercel/oidc/dist/index-browser.js'),
      'zod/v4$': require.resolve('zod/v4'),
      'zod/v4/core$': require.resolve('zod/v4/core'),
    }
    Object.entries(aliases).forEach(([key, value]) => config.resolve.alias.set(key, value))

    // Some dependencies (e.g. zod v4's CJS build) use the .cjs extension, which
    // Vue CLI's JavaScript rule does not match by default.
    config.module.rule('js').test(/\.([cm]?js|jsx)$/)

    // Add a rule to handle .mjs files (JavaScript modules).
    // This ensures that .mjs files in node_modules are processed correctly.
    config.module
      .rule('mjs')
      .test(/\.mjs$/)
      .type('javascript/auto')
      .include.add(/node_modules/)
      .end()

    // Add a rule to handle .txt files as raw text
    config.module
      .rule('txt')
      .test(/\.txt$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()

    // Use Electron mock in test environment
    if (process.env.NODE_ENV === 'test') {
      config.resolve.alias.set(
        path.resolve(__dirname, 'src/store') + '$',
        path.resolve(__dirname, 'tests/unit/mocks/store.js'),
      )
      config.resolve.alias.set('electron', path.resolve(__dirname, 'tests/unit/mocks/electron.js'))
      config.resolve.alias.set('@electron/remote', path.resolve(__dirname, 'tests/unit/mocks/electron.js'))
      config.resolve.alias.set('electron-store', path.resolve(__dirname, 'tests/unit/mocks/electron-store.js'))
      // Keep the native SQLite driver out of the webpack test bundle.
      config.externals({ sqlite3: 'commonjs sqlite3', vm2: 'commonjs vm2' })
    }
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
      chainWebpackMainProcess: (config) => {
        // The MCP SDK is only reachable through package `exports` subpaths and ships syntax
        // webpack 4 cannot parse, so let Node require its subpaths at runtime.
        config.externals([
          config.get('externals'),
          (context, request, callback) =>
            /^@modelcontextprotocol\/sdk\//.test(request) ? callback(null, `commonjs ${request}`) : callback(),
        ])
      },
      builderOptions: {
        productName: 'MQTTX',
        publish: [
          {
            provider: 'generic',
            url: 'https://www.emqx.com/en/downloads/MQTTX',
          },
        ],
        nsis: {
          oneClick: false,
          allowElevation: true,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          artifactName: 'MQTTX-Setup-${version}-${arch}.${ext}',
        },
        win: {
          artifactName: 'MQTTX-${version}-${arch}-win.${ext}',
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
            {
              target: 'zip',
              arch: ['x64', 'ia32'],
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
          icon: './public/icons/512x512.png',
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
