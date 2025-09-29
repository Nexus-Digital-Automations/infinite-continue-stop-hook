#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Fix the pattern where test files have "const _result" but use "result" in expect statements
 */

function getAllTestFiles() {
  try {
    const output = execSync('find test/ -name "*.js" -type f', { encoding: 'utf8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch (error) {
    console.error('Error finding test files:', error.message);
    return [];
  }
}

function fixResultPattern(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Only process files that have both "const _result" and "expect(result."
    if (content.includes('const _result') && content.includes('expect(result.')) {
      console.log(`Fixing ${filePath}...`);

      // Replace expect(result. with expect(_result.
      const fixed = content.replace(/expect\(result\./g, 'expect(_result.');

      fs.writeFileSync(filePath, fixed);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing result pattern in test files...');

  const testFiles = getAllTestFiles();
  console.log(`📊 Found ${testFiles.length} test files`);

  let fixedCount = 0;

  for (const filePath of testFiles) {
    if (fixResultPattern(filePath)) {
      fixedCount++;
    }
  }

  console.log(`✅ Fixed result pattern in ${fixedCount} files`);

  // Run eslint to see improvement
  console.log('\n🔍 Checking linting status...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('🎉 ALL LINTING ERRORS RESOLVED!');
  } catch (error) {
    console.log('⚠️ Some linting issues remain - checking count...');
    try {
      const output = execSync('npm run lint 2>&1', { encoding: 'utf8' });
      const errorMatch = output.match(/(\d+) problems/);
      if (errorMatch) {
        console.log(`📊 Remaining: ${errorMatch[1]} problems`);
      }
    } catch (_) {
      // Ignore
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixResultPattern, getAllTestFiles };