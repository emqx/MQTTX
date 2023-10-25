module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript/recommended',
    '@vue/eslint-config-prettier',
    'plugin:prettier/recommended',
  ],
  rules: {
    'vue/require-default-prop': 'off',
    'vue/multi-word-component-names': 'off',
    'prettier/prettier': ['warn', {}, { usePrettierrc: true }],
    '@typescript-eslint/no-explicit-any': 'off',
  },
  plugins: ['prettier'],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
  },
  ignorePatterns: ['node_modules/', 'dist/', 'out/'],
}
