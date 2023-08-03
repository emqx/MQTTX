const plugins = [
  [
    'component',
    {
      libraryName: 'element-ui',
      styleLibraryName: 'theme-chalk',
    },
  ],
  [
    'prismjs',
    {
      languages: ['javascript'],
      // plugins: ['line-numbers'],
      // theme: 'funky',
      css: true,
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
