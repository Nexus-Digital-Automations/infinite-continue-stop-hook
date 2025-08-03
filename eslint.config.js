const js = require('@eslint/js');

module.exports = [
  // Global ignores must be first
  {
    ignores: ['**/*.md', '**/*.json', '**/*.txt', '**/*.yml', '**/*.yaml', '**/*.xml', '**/*.csv', '**/*.log', 'node_modules/**', '**/*.backup.*']
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      // Allow console.log for debugging and logging
      'no-console': 'off',
      // Allow unused vars with underscore prefix
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
      // Allow constant binary expressions (for test conditions)
      'no-constant-binary-expression': 'off'
    }
  },
  // Test files configuration
  {
    files: ['**/*.test.js', '**/test/**/*.js', '**/tests/**/*.js', 'demo/**/*.test.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    }
  }
];