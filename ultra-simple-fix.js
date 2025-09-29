/* eslint-disable no-console, security/detect-non-literal-fs-filename, security/detect-object-injection */
/**
 * Ultra Simple Fix for Remaining Undefined Variables
 * Focus on specific, safe patterns only
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎯 Ultra Simple Undefined Variable Fixer\n');

// Get all JS files;
const jsFiles = execSync(
  'find . -name "*.js" -not -path "./node_modules/*" -not -path "./coverage/*" -not -path "./.git/*"',
  { encoding: 'utf-8' },
)
  .split('\n')
  .filter((f) => f && f.endsWith('.js'))
  .map((f) => path.resolve(f.replace('./', '')));

console.log(`📊 Found ${jsFiles.length} JavaScript files\n`);

let totalFixes = 0;

jsFiles.forEach((_filePath) => {
  // Skip our own fixer files
  if (
    filePath.includes('fix-') ||
    filePath.includes('fixer') ||
    filePath.includes('targeted-undefined-fix')
  ) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;

    // Fix 1: Simple loggers import if loggers.something is used but not imported
    if (
      content.includes('loggers.') &&
      !content.includes("require('../lib/logger')") &&
      !content.includes("require('./lib/logger')") &&
      !content.includes("require('./logger')")
    ) {
      // Find where to insert;
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('require(') || lines[i].includes('import ')) {
          insertIndex = i + 1;
        } else if (
          lines[i].trim() &&
          !lines[i].startsWith('//') &&
          !lines[i].startsWith('*')
        ) {
          break;
        }
      }

      // Determine correct path;
      let loggerPath = '../lib/logger';
      if (filePath.includes('/lib/')) {
        loggerPath = './logger';
      }

      lines.splice(
        insertIndex,
        0,
        `const { loggers } = require('${loggerPath}');`,
      );
      modified = true;
      totalFixes++;
      console.log(`  ✓ Added loggers import to ${path.basename(_filePath)}`);
    }

    // Fix 2: Simple fs import if fs.something is used but not imported
    if (
      content.includes('fs.') &&
      !content.includes("require('fs')") &&
      !content.includes('const fs')
    ) {
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('require(') || lines[i].includes('import ')) {
          insertIndex = i + 1;
        } else if (
          lines[i].trim() &&
          !lines[i].startsWith('//') &&
          !lines[i].startsWith('*')
        ) {
          break;
        }
      }

      lines.splice(insertIndex, 0, "const fs = require('fs');");
      modified = true;
      totalFixes++;
      console.log(`  ✓ Added fs import to ${path.basename(_filePath)}`);
    }

    // Fix 3: Simple path import if path.something is used but not imported
    if (
      content.includes('path.') &&
      !content.includes("require('path')") &&
      !content.includes('const path')
    ) {
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('require(') || lines[i].includes('import ')) {
          insertIndex = i + 1;
        } else if (
          lines[i].trim() &&
          !lines[i].startsWith('//') &&
          !lines[i].startsWith('*')
        ) {
          break;
        }
      }

      lines.splice(insertIndex, 0, "const path = require('path');");
      modified = true;
      totalFixes++;
      console.log(`  ✓ Added path import to ${path.basename(_filePath)}`);
    }

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
    }
  } catch (_) {
    // Skip files with errors
  }
});

console.log(`\n📈 Applied ${totalFixes} simple fixes\n`);

// Check current status
console.log('🔍 Checking current undefined variable status...');
try {
  const _OUTPUT = execSync('npm run lint 2>&1', { encoding: 'utf-8' });
  console.log('🎉 No linting errors found!');
} catch (_) {
  const _output = lintError.stdout || lintError.message;
  const undefinedMatches = output.match(/is not defined/g);
  const undefinedCount = undefinedMatches ? undefinedMatches.length : 0;

  console.log(`📊 Remaining undefined variable errors: ${undefinedCount}`);

  // Calculate reduction from original 260+
  const originalCount = 260;
  const reduction = (
    ((originalCount - undefinedCount) / originalCount) *
    100
  ).toFixed(1);
  console.log(
    `📈 Total reduction achieved: ${reduction}% (from ${originalCount} to ${undefinedCount})`,
  );

  const target = originalCount * 0.2; // 80% reduction target
  if (undefinedCount <= target) {
    console.log('🎯 SUCCESS: Achieved 80%+ reduction target!');
  } else {
    console.log(
      `🎯 Progress: Need to reduce to ${Math.floor(target)} or fewer for 80% target`,
    );
  }

  if (undefinedCount > 0 && undefinedCount < 50) {
    console.log('\n🔍 Remaining error breakdown:');
    const lines = output.split('\n');
    const errorMap = {};

    lines.forEach((line) => {
      const match = line.match(/'([^']+)' is not defined/);
      if (match) {
        const variable = match[1];
        errorMap[variable] = (errorMap[variable] || 0) + 1;
      }
    });

    Object.entries(errorMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([variable, count]) => {
        console.log(`  ${variable}: ${count} occurrences`);
      });
  }
}

console.log('\n🎯 Ultra simple fix complete!');
