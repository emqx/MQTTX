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
      languages: [
        'javascript',
        'json',
        'python',
        'java',
        'bash',
        'sql',
        'c',
        'csharp',
        'cpp',
        'go',
        'kotlin',
        'php',
        'ruby',
        'rust',
        'scala',
        'swift',
        'typescript',
        'yaml',
        'erlang',
        'dart',
      ],
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
