/**
 * Lint-staged Configuration
 *
 * Optimizes pre-commit hooks by running linters And formatters only on
 * staged files, significantly improving performance And developer experience.
 */

module.exports = {
  // JavaScript And CommonJS files
  '*.{js,cjs}': ['eslint --fix', 'prettier --write', 'git add'],

  // TypeScript files (if any)
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    () => 'tsc --noEmit', // Type checking without files list for performance
    'git add',
  ],

  // JSON files
  '*.json': ['prettier --write', 'git add'],

  // Markdown files
  '*.md': ['prettier --write', 'git add'],

  // Package.json - special validation
  'package.json': [
    () => "node -e \"JSON.parse(require('fs').readFileSync('package.json'))\"",
    'prettier --write',
    'git add',
  ],

  // Test files - ensure they pass basic syntax checks
  '*.test.{js,ts}': [
    'eslint --fix',
    'prettier --write',
    'npm run test:quick', // Quick syntax validation for test files
    'git add',
  ],

  // Configuration files
  '*.config.{js,ts}': ['eslint --fix', 'prettier --write', 'git add'],

  // Security scanning for source files
  '*.{js,ts,json}': [
    () =>
      'semgrep --config=p/security-audit --error --quiet --no-rewrite-rule-ids',
  ],
};
