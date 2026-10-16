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
  '@babel/plugin-proposal-logical-assignment-operators',
]
if (process.env.NODE_ENV === 'development') {
  plugins.push('dynamic-import-node')
}
module.exports = {
  presets: ['@vue/app'],
  plugins,
  // Transpiled CommonJS dependencies (zod v4's .cjs build, @vercel/oidc) must stay scripts, otherwise
  // the injected core-js polyfill imports turn them into ES modules and their `exports` break at runtime.
  sourceType: 'unambiguous',
}
