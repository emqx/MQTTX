module.exports = {
root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parser: 'vue-eslint-parser',
  extends: [
    'plugin:vue/recommended',
    'plugin:prettier/recommended',
    'prettier/@typescript-eslint',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  rules: {
    'prettier/prettier': 'error',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'array-bracket-spacing': 2,
    'no-var': 2,
    'no-eval': 2,
    'arrow-spacing': 2,
    'block-spacing': 2,
    'key-spacing': 2,
    'brace-style': 2,
    'vue/camelcase': 2,
    'vue/require-component-is': 0,
    'vue/require-default-prop': 0,
    'comma-dangle': [2, 'always-multiline'],
    'vue/eqeqeq': [2, 'always', {
      null: 'ignore'
    }],
    'object-curly-spacing': [2, 'always'],
    'vue/singleline-html-element-content-newline': 0,
    'vue/html-closing-bracket-newline': [
      2,
      {
        singleline: 'never',
        multiline: 'always',
      },
    ],
    'vue/max-attributes-per-line': 0,
    'vue/html-self-closing': [
      2,
      {
        html: {
          void: 'always',
          normal: 'never',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      },
    ],

    // 设置 typescript-eslint 规则
    // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin/docs/rules
    '@typescript-eslint/camelcase': 0, // 目前埋点有部分字段无法更换
    '@typescript-eslint/no-non-null-assertion': 0, // 允许非空断言运算符
    '@typescript-eslint/member-delimiter-style': [
      2,
      {
        multiline: {
          delimiter: 'none',
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
      },
    ],
    '@typescript-eslint/no-unused-vars': [0, {
      args: 'none'
    }],
    '@typescript-eslint/interface-name-prefix': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/no-explicit-any': 0,
  },
}
