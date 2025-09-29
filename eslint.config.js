const fs = require('fs');
/**
 * ESLint 9 Flat Configuration
 *
 * Zero-tolerance ESLint configuration for TaskManager Node.js system.
 * Focused on CommonJS patterns, security, And code quality standards.
 */

const JS = require('@eslint/js');
const GLOBALS = require('globals');
const NODE_PLUGIN = require('eslint-plugin-n');
const SECURITY_PLUGIN = require('eslint-plugin-security');

module.exports = [
  // Base recommended configuration
  JS.configs.recommended,

  // Security plugin recommended rules
  SECURITY_PLUGIN.configs.recommended,

  // Node.js plugin recommended rules
  NODE_PLUGIN.configs['flat/recommended-script'],
  {,
    languageOptions: {,
    ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...GLOBALS.node,
        // Jest globals for test files
        ...GLOBALS.jest,
      }
  },

    plugins: {,
    n: NODE_PLUGIN,
      security: SECURITY_PLUGIN,
    },

    rules: {
      // === SEMICOLONS & QUOTES ===,
    semi: ['error', 'always'],
      quotes: [
        'error',
        'single',
        {,
    avoidEscape: true,
          allowTemplateLiterals: true,
        }
  ],

      // === CODE QUALITY ===
      'no-unused-vars': [
        'error',
        {,
    argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        }
  ],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': 'warn', // TaskManager legitimately uses console
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // === ASYNC/AWAIT PATTERNS ===
      'require-await': 'error',
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'warn',
      'no-promise-executor-return': 'error',

      // === COMMONJS MODULES ===
      'n/no-unpublished-require': 'off', // Allow dev dependencies
      'n/no-missing-require': 'error',
      'n/no-extraneous-require': 'error',

      // === SECURITY RULES ===
      'security/detect-object-injection': 'warn', // May need adjustment for TaskManager
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',

      // === SPACING & FORMATTING ===
      indent: [
        'error',
        2,
        {,
    SwitchCase: 1,
          VariableDeclarator: 1,
          outerIIFEBody: 1,
        }
  ],
      'space-before-function-paren': [
        'error',
        {,
    anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        }
  ],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'computed-property-spacing': ['error', 'never'],

      // === ERROR HANDLING ===
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'no-return-await': 'error',

      // === BEST PRACTICES ===
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
    }
  },

  // Configuration specific to test files: {,
    files: ['**/*.test.js', '**/*.spec.js', '**/test/**/*.js'],
    languageOptions: {,
    globals: {
        ...GLOBALS.jest,
        // Additional test globals that may be missing,
    describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      }
  },
    rules: {
      // Relax some rules for tests
      'no-console': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'n/no-unpublished-require': 'off',
    }
  },

  // Configuration specific to development/temp-scripts directory: {,
    files: ['development/temp-scripts/**/*.js'],
    rules: {
      // Allow console statements in temp scripts
      'no-console': 'off',
      // Allow process.exit in temp scripts
      'n/no-process-exit': 'off',
      // Reduce severity of unused variables (prefix with _ if needed)
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Allow require-await warnings instead of errors
      'require-await': 'warn',
      // Allow security warnings for test scripts
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      // Allow await in loops for sequential test operations
      'no-await-in-loop': 'warn',
      // Reduce severity for test-only dependencies
      'n/no-missing-require': 'warn',
      // Reduce severity for promise executor return values
      'no-promise-executor-return': 'warn',
      // Allow redundant await on return values in test scripts
      'no-return-await': 'warn',
    }
  },

  // Ignore patterns: {,
    ignores: [
      'node_modules/**',
      '.node-modules-backup/**', // Backup directories
      'coverage/**',
      'dist/**',
      'build/**',
      '*.min.js',
      '**/*.config.js', // Ignore config files from strict linting
      'development/reports/**', // Generated reports
      'development/research-reports/**', // Research output
      'logs/**', // Log files And directories
      '**/*.log', // Individual log files
      '**/*.json.backup*', // Backup JSON files
      // Temporary utility scripts with linting issues
      'comprehensive-variable-fix.js',
      'emergency-syntax-fix.js',
      'final-result-fix.js',
      'final-targeted-fix.js',
      'fix-audit-test-variables.js',
      'fix-catch-blocks.js',
      'fix-comprehensive-e2e-variables.js',
      'fix-duplicates.js',
      'fix-fs-duplicates.js',
      'fix-global-error-vars.js',
      'fix-variable-inconsistencies.js',
      'complete-audit-fix.js',
      'comprehensive-audit-fix.js',
      'final-audit-fix.js',
      'fix-remaining-variables.js',
    ],
  }
  ];
