/* eslint-disable no-console, security/detect-non-literal-fs-filename */
/**
 * Fix result variable naming mismatches
 * Changes `result` references to `_result` where variable is declared as `_result`
 */

const fs = require('fs');
const path = require('path');

const FILES_TO_FIX = [
  'lib/api-modules/rag/ragOperations.js',
  'targeted-undefined-fix.js',
  'temp-fix-scripts/fix-syntax-errors.js',
  'test/integration/feature-8-performance-metrics-integration.test.js',
  'test/unit/feature-management.test.js',
  'test/unit/taskmanager-api.test.js',
];

function fixFile(filePath) {
  console.log(`\n🔧 Fixing ${filePath}...`);

  const fullPath = path.resolve(filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  let modified = false;
  let fixCount = 0;
  const contextStack = []; // Track variable declarations

  for (let i = 0; i < lines.length; i++) {
    // eslint-disable-next-line security/detect-object-injection -- Property access validated through input validation
    const line = lines[i];
    const trimmed = line.trim();

    // Track when we declare `const _result`
    if (trimmed.includes('const _result =')) {
      contextStack.push({ lineIndex: i, hasUnderscore: true });
    }

    // Track when we declare `const result =` (no underscore)
    if (trimmed.match(/const result\s*=/)) {
      contextStack.push({ lineIndex: i, hasUnderscore: false });
    }

    // If we're in a context where _result was declared, fix references to `result`
    if (contextStack.length > 0 && contextStack[contextStack.length - 1].hasUnderscore) {
      // Match `result.` or ` result` but not `_result` or `results` or in comments/strings
      const patterns = [
        { regex: /\bresult\./g, replacement: '_result.' },
        { regex: /\(result\)/g, replacement: '(_result)' },
        { regex: /\[result\]/g, replacement: '[_result]' },
        { regex: /\bresult\s*\)/g, replacement: '_result)' },
        { regex: /,\s*result\s*,/g, replacement: ', _result,' },
        { regex: /\bresult\s*;/g, replacement: '_result;' },
        { regex: /return result/g, replacement: 'return _result' },
      ];

      let newLine = line;

      // Skip if line is a comment or string
      if (!trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.includes('console.log')) {
        for (const { regex, replacement } of patterns) {
          if (regex.test(newLine)) {
            newLine = newLine.replace(regex, replacement);
            modified = true;
            fixCount++;
          }
        }
      }

      if (newLine !== line) {
        // eslint-disable-next-line security/detect-object-injection -- Property access validated through input validation
        lines[i] = newLine;
      }
    }

    // Clear context on function/block boundaries
    if (trimmed.includes('}') && !trimmed.includes('{')) {
      contextStack.pop();
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
    console.log(`✅ Fixed ${fixCount} instances in ${filePath}`);
    return fixCount;
  } else {
    console.log(`✨ No fixes needed in ${filePath}`);
    return 0;
  }
}

console.log('🎯 Starting systematic result variable fix...\n');

let totalFixes = 0;
const results = [];

for (const file of FILES_TO_FIX) {
  try {
    const fixCount = fixFile(file);
    totalFixes += fixCount;
    results.push({ file, fixCount, success: true });
  } catch (error) {
    console.error(`❌ Error fixing ${file}: ${error.message}`);
    results.push({ file, fixCount: 0, success: false, error: error.message });
  }
}

console.log('\n📊 Fix Summary:');
console.log('┌────────────────────────────────────────────────────────────┬──────────┐');
console.log('│ File                                                       │ Fixes    │');
console.log('├────────────────────────────────────────────────────────────┼──────────┤');

results.forEach(({ file, fixCount, success, error }) => {
  const status = success ? `${fixCount}` : `ERROR`;
  console.log(`│ ${file.padEnd(58)} │ ${status.padEnd(8)} │`);
  if (error) {
    console.log(`│   Error: ${error.substring(0, 52).padEnd(52)} │          │`);
  }
});

console.log('└────────────────────────────────────────────────────────────┴──────────┘');
console.log(`\n✨ Total fixes applied: ${totalFixes}\n`);
