/**
 * ESLint Configuration for ML Recommendation Engine
 * 
 * Enforces code quality standards and consistency across the ML system.
 * Follows industry best practices for Node.js and machine learning projects.
 */

module.exports = {
  env: {
    browser: false,
    es2022: true,
    node: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Code Quality Rules
    'no-console': 'warn', // Prefer logger over console
    'no-debugger': 'error',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_', 
      varsIgnorePattern: '^_' 
    }],
    
    // Style Rules
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'space-before-function-paren': ['error', 'always'],
    
    // Import Rules
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always'
    }],
    
    // ML/AI Specific Rules
    'no-magic-numbers': ['warn', { 
      ignore: [0, 1, -1, 100],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true
    }],
    
    // Performance Rules
    'no-sync': 'warn', // Prefer async operations
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Error Handling
    'prefer-promise-reject-errors': 'error',
    'no-throw-literal': 'error'
  },
  
  // Override rules for specific file types
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      rules: {
        'no-magic-numbers': 'off', // Allow magic numbers in tests
        'max-len': 'off' // Allow longer lines in tests
      }
    },
    {
      files: ['scripts/**/*.js'],
      rules: {
        'no-console': 'off' // Allow console in build/utility scripts
      }
    },
    {
      files: ['benchmarks/**/*.js'],
      rules: {
        'no-console': 'off', // Allow console in benchmark scripts
        'no-sync': 'off' // Allow sync operations in benchmarks
      }
    }
  ],
  
  // Global variables for ML context
  globals: {
    'tf': 'readonly', // TensorFlow.js global
    'performance': 'readonly' // Performance API
  }
}