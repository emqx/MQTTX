const plugins = [
  [
    'component',
    {
      libraryName: 'element-ui',
      styleLibraryName: 'theme-chalk',
    },
  ],
]
if (process.env.NODE_ENV === 'development') {
  plugins.push('dynamic-import-node')
}
module.exports = {
  presets: ['@vue/app'],
  plugins,
}
