import antfu from '@antfu/eslint-config'

export default antfu(
  {
    vue: true,
    formatters: {
      /**
       * Format CSS, LESS, SCSS files, also the `<style>` blocks in Vue
       * By default uses Prettier
       */
      css: true,
      /**
       * Format HTML files
       * By default uses Prettier
       */
      html: true,
      /**
       * Format Markdown files
       * Supports Prettier and dprint
       * By default uses Prettier
       */
      markdown: 'prettier',
    },
    ignores: [
      '**/assets/fonts',
    ],
  },
  {
    rules: {
      'no-console': 'warn',
      'n/prefer-global/process': 'off',
      'node/prefer-global/buffer': 'off',
    },
  },
  {
    files: ['apps/cli/**/*.ts'],
    rules: {
      'no-console': 'off',
      'ts/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.md'],
    rules: {
      'no-irregular-whitespace': 'off',
    },
  },
  {
    files: ['examples/function/*.js'],
    rules: {
      'no-undef': 'off',
    },
  },
)
