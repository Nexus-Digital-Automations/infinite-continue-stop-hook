/**
 * Comprehensive Capitalization Error Fix Script
 *
 * Fixes linter-induced capitalization errors across the codebase.
 * These errors were introduced by incorrect linting that capitalized variables.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loggers } = require('./lib/logger');

// Define root directory for security validation
const rootDir = '/Users/jeremyparker/infinite-continue-stop-hook';

// Pattern replacements to fix capitalized variables
const fixes = [
  // Fix OPERATION -> operation parameter issues
  { pattern: /(\w+)\(OPERATION (\w+),/g, replacement: '$1(operation, $2,' },
  { pattern: /(\w+)\(OPERATION(\w+),/g, replacement: '$1(operation$2,' },
  { pattern: /OPERATION (\w+),/g, replacement: 'operation, $1,' },
  { pattern: /OPERATION(\w+),/g, replacement: 'operation$1,' },

  // Fix result -> result variable issues
  { pattern: /const result =/g, replacement: 'const result =' },
  { pattern: /let result =/g, replacement: 'let result =' },
  { pattern: /var result =/g, replacement: 'var result =' },

  // Fix object property syntax issues
  { pattern: /{\s*OPERATION\s*$/gm, replacement: '{ operation,' },
  { pattern: /,\s*OPERATION\s*$/gm, replacement: ', operation,' },
  { pattern: /OPERATION\s*$/gm, replacement: 'operation,' },

  // Fix template literal issues
  { pattern: /\$\{OPERATION/g, replacement: '${operation' },
  {
    pattern: /Performance: \$\{OPERATION`/g,
    replacement: 'Performance: ${operation}`',
  },
  {
    pattern: /Database: \$\{OPERATION on/g,
    replacement: 'Database: ${operation} on',
  },

  // Fix function parameter lists
  {
    pattern: /performance\(OPERATION duration/g,
    replacement: 'performance(operation, duration',
  },
  {
    pattern: /database\(OPERATION table/g,
    replacement: 'database(operation, table',
  },

  // Fix object destructuring and property access
  {
    pattern: /logger\.info\(\{\s*operation, operationName,/g,
    replacement: 'logger.info({ operation: operationName,',
  },
  {
    pattern: /operation, operationName,/g,
    replacement: 'operation: operationName,',
  },
];

// Function to apply fixes to a file
function fixFile(filePath) {
  // Security: Validate file path to prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..') || !normalizedPath.startsWith(rootDir)) {
    loggers.app.warn(
      `Security: Rejected potentially unsafe file path: ${filePath}`
    );
    return false;
  }

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    // Justification: File path is validated above to ensure it's within project directory
    let content = fs.readFileSync(normalizedPath, 'utf8');
    let modified = false;

    fixes.forEach((fix) => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        modified = true;
      }
    });

    if (modified) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      // Justification: File path is validated above to ensure it's within project directory
      fs.writeFileSync(normalizedPath, content, 'utf8');
      loggers.app.info(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch {
    loggers.app.error(`❌ Error fixing ${filePath}:`, { error: error.message });
    return false;
  }
}

// Find and fix all JavaScript files
function findAndFixFiles() {
  try {
    // Get all JS files excluding node_modules and .git
    const output = execSync(
      'find . -name "*.js" -not -path "./node_modules/*" -not -path "./.git/*"',
      { encoding: 'utf8' }
    );
    const files = output
      .trim()
      .split('\n')
      .filter((f) => f);

    loggers.app.info(`🔍 Found ${files.length} JavaScript files to check`);

    let fixedCount = 0;
    files.forEach((file) => {
      if (fixFile(file)) {
        fixedCount++;
      }
    });

    loggers.app.info(
      `📊 Summary: Fixed ${fixedCount} out of ${files.length} files`
    );

    if (fixedCount > 0) {
      loggers.app.info('🎯 Running linter to verify fixes...');
      try {
        execSync('npm run lint', { stdio: 'inherit' });
        loggers.app.info('✅ Linting passed!');
      } catch {
        loggers.app.warn(
          '⚠️  Some linting issues remain, but syntax errors should be fixed'
        );
      }
    }
  } catch {
    loggers.app.error('❌ Error during file processing:', {
      error: error.message,
    });
    throw new Error(`File processing failed: ${error.message}`);
  }
}

// Run the fix
loggers.app.info('🚀 Starting comprehensive capitalization error fix...');
findAndFixFiles();
loggers.app.info('✨ Capitalization error fix completed!');
