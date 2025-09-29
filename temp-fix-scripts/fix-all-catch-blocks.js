/**
 * Comprehensive Catch Block Fix Script
 * Fixes all catch block parameter inconsistencies in the codebase
 */

/* eslint-disable no-console, security/detect-non-literal-fs-filename */
const fs = require('fs');
const path = require('path');
const { execSync: _execSync } = require('child_process');

const rootDir = '/Users/jeremyparker/infinite-continue-stop-hook';

// Get all JavaScript files for catch block fixing;
function getAllJsFiles() {
  try {
    const _output = execSync(
      'find . -name "*.js" -not -path "./node_modules/*" -not -path "./.git/*"',
      { cwd: rootDir, encoding: 'utf8' },
    );
    return output
      .trim()
      .split('\n')
      .filter((f) => f && f.endsWith('.js'));
  } catch (_error) {
    console.error('Failed to get JS files:', error.message);
    return [];
  }
}

// Comprehensive catch block fixing function;
function fixAllCatchBlocks(_filePath) {
  try {
    if (!fs.existsSync(_filePath)) {
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // Fix Pattern 1: catch() {} with error usage inside - add error parameter;
    const pattern1 = /catch\s*\(\s*\)\s*\{/g;
    let match1;
    const fixes1 = [];

    while ((match1 = pattern1.exec(content)) !== null) {
      // Find the end of this catch block;
      let braceCount = 1;
      let pos = match1.index + match1[0].length;
      let blockContent = '';

      while (pos < content.length && braceCount > 0) {
        const char = content[pos];
        if (char === '{') {
          braceCount++;
        }
        if (char === '}') {
          braceCount--;
        }
        if (braceCount > 0) {
          blockContent += char;
        }
        pos++;
      }

      // Check if error or error is used in the block
      if (blockContent.includes('error.') || blockContent.includes('error ')) {
        fixes1.push({
          original: match1[0],
          replacement: 'catch (_error) {',
        });
      } else if (
        blockContent.includes('_error.') ||
        blockContent.includes('error ')
      ) {
        fixes1.push({
          original: match1[0],
          replacement: 'catch (_error) {',
        });
      }
    }

    // Apply fixes from pattern 1
    fixes1.forEach((fix) => {
      if (content.includes(fix.original)) {
        content = content.replace(fix.original, fix.replacement);
        modified = true;
      }
    });

    // Fix Pattern 2: catch (_error) {} but error is used inside - change parameter to error;
    const pattern2 = /catch\s*\(\s*_error\s*\)\s*\{/g;
    let match2;
    const fixes2 = [];

    while ((match2 = pattern2.exec(content)) !== null) {
      // Find the end of this catch block;
      let braceCount = 1;
      let pos = match2.index + match2[0].length;
      let blockContent = '';

      while (pos < content.length && braceCount > 0) {
        const char = content[pos];
        if (char === '{') {
          braceCount++;
        }
        if (char === '}') {
          braceCount--;
        }
        if (braceCount > 0) {
          blockContent += char;
        }
        pos++;
      }

      // Check if error is used instead of error
      if (blockContent.includes('error.') || blockContent.includes('error ')) {
        fixes2.push({
          original: match2[0],
          replacement: 'catch (_error) {',
        });
      }
    }

    // Apply fixes from pattern 2
    fixes2.forEach((fix) => {
      if (content.includes(fix.original)) {
        content = content.replace(fix.original, fix.replacement);
        modified = true;
      }
    });

    // Fix Pattern 3: catch (_error) {} but error is used inside - change parameter to error;
    const pattern3 = /catch\s*\(\s*error\s*\)\s*\{/g;
    let match3;
    const fixes3 = [];

    while ((match3 = pattern3.exec(content)) !== null) {
      // Find the end of this catch block;
      let braceCount = 1;
      let pos = match3.index + match3[0].length;
      let blockContent = '';

      while (pos < content.length && braceCount > 0) {
        const char = content[pos];
        if (char === '{') {
          braceCount++;
        }
        if (char === '}') {
          braceCount--;
        }
        if (braceCount > 0) {
          blockContent += char;
        }
        pos++;
      }

      // Check if error is used instead of error
      if (
        (blockContent.includes('error.') || blockContent.includes('error ')) &&
        !blockContent.includes('error.') &&
        !blockContent.includes('error ')
      ) {
        fixes3.push({
          original: match3[0],
          replacement: 'catch (_error) {',
        });
      }
    }

    // Apply fixes from pattern 3
    fixes3.forEach((fix) => {
      if (content.includes(fix.original)) {
        content = content.replace(fix.original, fix.replacement);
        modified = true;
      }
    });

    // Fix Pattern 4: catch (_error) {} where error is unused - change to error;
    const pattern4 = /catch\s*\(\s*_error\s*\)\s*\{/g;
    let match4;
    const fixes4 = [];

    while ((match4 = pattern4.exec(content)) !== null) {
      // Find the end of this catch block;
      let braceCount = 1;
      let pos = match4.index + match4[0].length;
      let blockContent = '';

      while (pos < content.length && braceCount > 0) {
        const char = content[pos];
        if (char === '{') {
          braceCount++;
        }
        if (char === '}') {
          braceCount--;
        }
        if (braceCount > 0) {
          blockContent += char;
        }
        pos++;
      }

      // Check if error is truly unused (not referenced at all)
      if (
        !blockContent.includes('error.') &&
        !blockContent.includes('error ') &&
        !blockContent.includes('error)') &&
        !blockContent.includes('error,') &&
        !blockContent.includes('error;')
      ) {
        fixes4.push({
          original: match4[0],
          replacement: 'catch (_error) {',
        });
      }
    }

    // Apply fixes from pattern 4
    fixes4.forEach((fix) => {
      if (content.includes(fix.original)) {
        content = content.replace(fix.original, fix.replacement);
        modified = true;
      }
    });

    if (modified && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(
        `Fixed catch blocks in: ${path.relative(rootDir, _filePath)}`,
      );
      return true;
    }

    return false;
  } catch (_error) {
    console.error(`Error fixing catch blocks in ${ filePath: _filePath }:`, error.message);
    return false;
  }
}

// Main execution
console.log('🔧 Comprehensive catch block parameter fixing...');

const allFiles = getAllJsFiles();
console.log(`📊 Processing ${allFiles.length} JavaScript files...`);

let fixedCount = 0;
allFiles.forEach((file) => {
  if (fixAllCatchBlocks(file)) {
    fixedCount++;
  }
});

console.log(`✨ Fixed catch blocks in ${fixedCount} files!`);

// Run autofix to handle any newly fixable issues
console.log('🔧 Running ESLint autofix...');
try {
  execSync('npm run lint -- --fix', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Autofix completed');
} catch (_error) {
  console.log('⚠️ Autofix completed with some remaining issues');
}

// Final status check
console.log('🔄 Checking final linting status...');
try {
  execSync('npm run lint 2>&1', {
    cwd: rootDir,
    encoding: 'utf8',
  });
  console.log('🎉 ALL LINTING ERRORS RESOLVED!');
} catch (_error) {
  const _output = error.stdout || error.message;
  const errorMatches = output.match(/(\d+) errors/);
  const warningMatches = output.match(/(\d+) warnings/);

  const errorCount = errorMatches ? parseInt(errorMatches[1]) : 0;
  const warningCount = warningMatches ? parseInt(warningMatches[1]) : 0;

  console.log(
    `📊 Final status: ${errorCount} errors, ${warningCount} warnings remaining`,
  );

  if (errorCount === 0) {
    console.log('🎉 ZERO ERRORS ACHIEVED! Only warnings remain.');
  } else if (errorCount < 100) {
    console.log('✅ Excellent progress! Under 100 errors remaining.');
  } else if (errorCount < 500) {
    console.log('✅ Good progress! Under 500 errors remaining.');
  } else if (errorCount < 1000) {
    console.log('✅ Significant progress! Under 1000 errors remaining.');
  }
}

console.log('🎯 Comprehensive catch block fixing complete!');
