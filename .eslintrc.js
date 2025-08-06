/**
 * ESLint Configuration
 * Linting rules for all platforms (web and mobile)
 */

module.exports = {
  root: true,
  extends: [
    '@react-native',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-native',
    'react-hooks',
    'prettier',
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
    'react-native/react-native': true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'off',

    // React rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/jsx-key': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-danger': 'error',
    'react/no-deprecated': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-find-dom-node': 'error',
    'react/no-is-mounted': 'error',
    'react/no-render-return-value': 'error',
    'react/no-string-refs': 'error',
    'react/no-unescaped-entities': 'error',
    'react/no-unknown-property': 'error',
    'react/no-unsafe': 'error',
    'react/self-closing-comp': 'error',
    'react/sort-comp': 'off',

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // React Native rules
    'react-native/no-unused-styles': 'error',
    'react-native/split-platform-components': 'error',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    'react-native/no-raw-text': 'off',
    'react-native/no-single-element-style-arrays': 'error',

    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'no-unused-expressions': 'error',
    'no-duplicate-imports': 'error',
    'no-multiple-empty-lines': ['error', { max: 2 }],
    'eol-last': 'error',
    'no-trailing-spaces': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'comma-spacing': ['error', { before: false, after: true }],
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    'keyword-spacing': ['error', { before: true, after: true }],
    'space-before-blocks': 'error',
    'space-before-function-paren': ['error', 'never'],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    'space-unary-ops': ['error', { words: true, nonwords: false }],
    'spaced-comment': ['error', 'always'],
    'arrow-spacing': ['error', { before: true, after: true }],
    'template-curly-spacing': ['error', 'never'],
    'yield-star-spacing': ['error', 'both'],
    'rest-spread-spacing': ['error', 'never'],
    'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
    'operator-linebreak': ['error', 'before'],
    'implicit-arrow-linebreak': ['error', 'beside'],
    'no-confusing-arrow': 'error',
    'no-useless-constructor': 'error',
    'no-useless-rename': 'error',
    'no-useless-return': 'error',
    'prefer-template': 'error',
    'template-literals': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-labels': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-escape': 'error',
    'no-void': 'error',
    'no-warning-comments': 'warn',
    'prefer-promise-reject-errors': 'error',
    'require-await': 'error',
    'yoda': 'error',

    // Prettier integration
    'prettier/prettier': 'error',
  },
  overrides: [
    {
      // Web-specific files
      files: ['src/web/**/*.{ts,tsx}', 'src/platform/web/**/*.{ts,tsx}'],
      env: {
        browser: true,
        node: false,
      },
      rules: {
        'react-native/no-unused-styles': 'off',
        'react-native/split-platform-components': 'off',
        'react-native/no-inline-styles': 'off',
        'react-native/no-color-literals': 'off',
        'react-native/no-single-element-style-arrays': 'off',
      },
    },
    {
      // Native-specific files
      files: ['src/native/**/*.{ts,tsx}', 'src/platform/native/**/*.{ts,tsx}'],
      env: {
        browser: false,
        node: false,
        'react-native/react-native': true,
      },
    },
    {
      // Core files (platform-agnostic)
      files: ['src/core/**/*.{ts,tsx}'],
      env: {
        browser: false,
        node: true,
        'react-native/react-native': false,
      },
      rules: {
        'react-native/no-unused-styles': 'off',
        'react-native/split-platform-components': 'off',
        'react-native/no-inline-styles': 'off',
        'react-native/no-color-literals': 'off',
        'react-native/no-single-element-style-arrays': 'off',
        'react/jsx-key': 'off',
        'react/jsx-no-duplicate-props': 'off',
        'react/jsx-no-undef': 'off',
        'react/no-array-index-key': 'off',
        'react/no-danger': 'off',
        'react/no-deprecated': 'off',
        'react/no-direct-mutation-state': 'off',
        'react/no-find-dom-node': 'off',
        'react/no-is-mounted': 'off',
        'react/no-render-return-value': 'off',
        'react/no-string-refs': 'off',
        'react/no-unescaped-entities': 'off',
        'react/no-unknown-property': 'off',
        'react/no-unsafe': 'off',
        'react/self-closing-comp': 'off',
      },
    },
    {
      // Test files
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'src/__tests__/**/*.{ts,tsx}'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        'react-native/no-inline-styles': 'off',
        'react-native/no-color-literals': 'off',
      },
    },
    {
      // Configuration files
      files: ['*.config.{js,ts}', '*.config.*.{js,ts}'],
      env: {
        node: true,
        browser: false,
        'react-native/react-native': false,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    '*.bundle.js',
    'metro.config.js',
    'babel.config.js',
    'jest.config.js',
  ],
}; 