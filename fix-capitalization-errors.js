/**
 * Comprehensive Capitalization Error Fix Script
 *
 * Fixes linter-induced capitalization errors across the codebase.
 * These errors were introduced by incorrect linting that capitalized variables.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    fixes.forEach((fix) => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
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

    console.log(`🔍 Found ${files.length} JavaScript files to check`);

    let fixedCount = 0;
    files.forEach((file) => {
      if (fixFile(file)) {
        fixedCount++;
      }
    });

    console.log(
      `\n📊 Summary: Fixed ${fixedCount} out of ${files.length} files`
    );

    if (fixedCount > 0) {
      console.log('\n🎯 Running linter to verify fixes...');
      try {
        execSync('npm run lint', { stdio: 'inherit' });
        console.log('✅ Linting passed!');
      } catch (lintError) {
        console.log(
          '⚠️  Some linting issues remain, but syntax errors should be fixed'
        );
      }
    }
  } catch (error) {
    console.error('❌ Error during file processing:', error.message);
    process.exit(1);
  }
}

// Run the fix
console.log('🚀 Starting comprehensive capitalization error fix...\n');
findAndFixFiles();
console.log('\n✨ Capitalization error fix completed!');
