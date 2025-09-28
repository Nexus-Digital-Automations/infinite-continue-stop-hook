/**
 * Automated No-Undef Variable Fixer
 *
 * Fixes common no-undef variable issues:
 * - Replaces result with result consistently
 * - Ensures proper variable declarations
 * - Fixes path/PATH inconsistencies
 * - Handles error variable references
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// List of files that have no-undef errors
const problematicFiles = [
  './migration-script.js',
  './setup-infinite-hook.js',
  './test/mocks/mockSetup.js',
  './test/unit/agent-management.test.js',
  './test/unit/feature-management.test.js',
  './test/unit/feature-7-custom-validation-rules.test.js',
  './test/unit/feature-management-system.test.js',
  './test/unit/example-with-mocks.test.js',
  './test/unit/feature-8-performance-metrics.test.js',
  './test/unit/validation-dependency-manager.test.js',
  './test/taskmanager-api-comprehensive.test.js',
];

/**
 * Fix variable inconsistencies in a file
 */
function fixVariableIssues(filePath) {
  console.log(`Fixing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Fix: const result = ... followed by expect(result...)
  content = content.replace(
    /const result = ([^;]+);[\s\S]*?expect\(result/g,
    (match) => {
      return match.replace('const result =', 'const result =');
    },
  );

  // Fix: const result = ... followed by expect(result...)
  content = content.replace(
    /const result = ([^;]+);[\s\S]*?expect\(result/g,
    (match) => {
      return match.replace('const result =', 'const result =');
    },
  );

  // Fix: path. should be PATH. when PATH is imported
  if (content.includes("const PATH = require('path')")) {
    content = content.replace(/([^A-Z])path\./g, '$1PATH.');
  }

  // Fix: error variable in catch blocks
  content = content.replace(
    /catch\s*\(\s*_error\s*\)\s*{[\s\S]*?error\.message/g,
    (match) => {
      return match.replace('(_error)', '(error)');
    },
  );

  // Fix: catch () { ... error.message }
  content = content.replace(
    /catch\s*\(\s*\)\s*{([^}]*error\.message[^}]*)}/g,
    (match, body) => {
      return `catch (error) {${body}}`;
    },
  );

  // Fix: result variable usage when result is declared
  content = content.replace(
    /const result = ([^;]+);([\s\S]*?)resolve\(result\)/g,
    (match, assignment, body) => {
      return `const result = ${assignment};${body}resolve(result)`;
    },
  );

  // Fix: return { result } when result was declared
  content = content.replace(
    /const result = ([^;]+);([\s\S]*?)return\s*{\s*[^}]*result[^}]*}/g,
    (match, assignment, body) => {
      return `const result = ${assignment};${body.replace(
        /return\s*{\s*([^}]*)\s*}/,
        (returnMatch, returnBody) => {
          return `return { ${returnBody.replace(/result/g, 'result')} }`;
        },
      )}`;
    },
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed variable issues in ${filePath}`);
    return true;
  }

  return false;
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Starting automated no-undef variable fixes...\n');

  let filesFixed = 0;

  for (const file of problematicFiles) {
    if (fs.existsSync(file)) {
      if (fixVariableIssues(file)) {
        filesFixed++;
      }
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  }

  console.log(`\n✅ Completed fixes on ${filesFixed} files`);

  // Check remaining errors
  try {
    console.log('\n🔍 Checking remaining no-undef errors...');
    const lintOutput = execSync('npx eslint . 2>&1 | grep "no-undef" | wc -l', {
      encoding: 'utf8',
    });
    const errorCount = parseInt(lintOutput.trim());
    console.log(`📊 Remaining no-undef errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('🎉 All no-undef errors have been resolved!');
    } else {
      console.log('🔧 Some errors remain - manual fixes may be needed');
    }
  } catch {
    console.error('Error checking lint status:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixVariableIssues };
