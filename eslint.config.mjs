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
    // ignores: [
    //   'public',
    //   'components/svg',
    // ],
  },
  {
    rules: {
      'no-console': 'warn',
    },
  },
)
