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
        'xml',
      ],
      // plugins: ['line-numbers'],
      // theme: 'funky',
      css: true,
    },
  ],
  // These plugins transform optional chaining (?.) and nullish coalescing (??)
  // syntax into compatible JavaScript for environments that do not support these features.
  '@babel/plugin-proposal-optional-chaining',
  '@babel/plugin-proposal-nullish-coalescing-operator',
]
if (process.env.NODE_ENV === 'development') {
  plugins.push('dynamic-import-node')
}
module.exports = {
  presets: ['@vue/app'],
  plugins,
}
