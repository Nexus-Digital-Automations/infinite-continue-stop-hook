#!/usr/bin/env node

const fs = require('fs').promises;

const FILES_TO_FIX = [
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/trend-analyzer.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/validation-audit-trail-manager.js',
];

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let fixCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';

      // Check if this line contains _error.message and the next line is a catch block
      if (line.includes('_error.message') && nextLine.trim().match(/^\}\s*catch\s*\(_error\)\s*\{/)) {
        // This is a misplaced error log - skip it
        console.log(`  Removing misplaced error log at line ${i + 1}: ${line.trim().substring(0, 60)}...`);
        fixCount++;
        continue;
      }

      newLines.push(line);
    }

    if (fixCount > 0) {
      await fs.writeFile(filePath, newLines.join('\n'), 'utf8');
      console.log(`✓ Fixed ${fixCount} misplaced error logs in ${filePath.split('/').pop()}\n`);
      return fixCount;
    } else {
      console.log(`- No misplaced error logs found in ${filePath.split('/').pop()}`);
      return 0;
    }
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('Fixing misplaced error log statements...\n');

  let totalFixed = 0;

  for (const filePath of FILES_TO_FIX) {
    const fixCount = await fixFile(filePath);
    totalFixed += fixCount;
  }

  console.log(`========================================`);
  console.log(`Fixed ${totalFixed} misplaced error logs`);
  console.log(`========================================`);
}

main().catch(console.error);