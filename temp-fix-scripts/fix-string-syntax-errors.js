/**
 * String Syntax Error Fixer
 * Fixes string literal, template literal, and quote-related parsing errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing string syntax and parsing errors...\n');

// Get all JS files
function getAllJSFiles() {
  try {
    const result = execSync(
      'find . -name "*.js" -not -path "./node_modules/*" -not -path "./coverage/*" -not -path "./.git/*"',
      { encoding: 'utf-8' },
    );
    return result.split('\n').filter((f) => f && f.endsWith('.js'));
  } catch {
    console.error('Failed to get JS files');
    return [];
  }
}

// Fix string-related syntax errors in a file
function fixStringSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fixCount = 0;

    // Fix 1: Extra commas after closing braces, parentheses, brackets
    const originalContent = content;
    content = content.replace(/(\}\s*;|;\s*|\)\s*|\]\s*);/g, (match) => {
      modified = true;
      fixCount++;
      return match.replace(',', '');
    });

    // Fix 2: Extra commas in specific error patterns
    content = content.replace(/(`[^`]*`)\s*;/g, '$1;');
    if (content !== originalContent) {
      modified = true;
      fixCount++;
    }

    // Fix 3: Fix unquoted string literals in function parameters
    content = content.replace(
      /category\s*=\s*'general'/g,
      "category = 'general'",
    );
    content = content.replace(
      /category\s*=\s*general\b/g,
      "category = 'general'",
    );

    // Fix 4: Fix template literal quote escaping issues
    content = content.replace(
      /'([^']*category\s*=\s*'general'[^']*)'/g,
      "'$1'",
    );

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(
        `✅ Fixed ${fixCount} issues in: ${path.relative(process.cwd(), filePath)}`,
      );
      return true;
    }
    return false;
  } catch {
    console.error(`❌ Error processing ${filePath}:`, _error.message);
    return false;
  }
}

// Main execution
function main() {
  const jsFiles = getAllJSFiles();
  console.log(`📊 Found ${jsFiles.length} JavaScript files to process\n`);

  let totalFixed = 0;
  let fileCount = 0;

  for (const filePath of jsFiles) {
    if (fixStringSyntaxErrors(filePath)) {
      totalFixed++;
    }
    fileCount++;
  }

  console.log(`\n📈 Summary:`);
  console.log(`  Files processed: ${fileCount}`);
  console.log(`  Files fixed: ${totalFixed}`);

  // Run linter to verify fixes
  console.log('\n🔍 Checking results...');
  try {
    execSync('npm run lint > /dev/null 2>&1');
    console.log('✅ All syntax errors resolved!');
  } catch {
    console.log('⚠️ Some issues may remain - checking specific errors...');
    try {
      const output = execSync(
        'npm run lint 2>&1 | grep -E "(Parsing error|Unexpected token)" | head -5',
        { encoding: 'utf8' },
      );
      if (output.trim()) {
        console.log('Remaining parsing errors:');
        console.log(output);
      }
    } catch {
      // No parsing errors found
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixStringSyntaxErrors, getAllJSFiles };
