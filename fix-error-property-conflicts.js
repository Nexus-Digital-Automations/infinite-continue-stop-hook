
/* eslint-disable no-console, security/detect-non-literal-fs-filename, no-await-in-loop */

const fs = require('fs').promises;

const FILES_TO_FIX = [
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/trend-analyzer.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/validation-audit-trail-manager.js',
];

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let fixCount = 0;

    // Pattern: Change "_error: _error.message" to "error: _error.message"
    // This fixes the property/variable name conflict
    const regex = /(\s+)_error:\s*_error\.message/g;
    content = content.replace(regex, (match, spaces) => {
      fixCount++;
      return `${spaces}error: _error.message`;
    });

    if (fixCount > 0) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✓ Fixed ${fixCount} _error property conflicts in ${filePath.split('/').pop()}`);
      return fixCount;
    } else {
      console.log(`- No _error property conflicts found in ${filePath.split('/').pop()}`);
      return 0;
    }
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('Fixing _error property/variable name conflicts...\n');

  let totalFixed = 0;

  for (const filePath of FILES_TO_FIX) {
    const fixCount = await fixFile(filePath);
    totalFixed += fixCount;
  }

  console.log(`\n========================================`);
  console.log(`Fixed ${totalFixed} _error property conflicts`);
  console.log(`========================================`);
}

main().catch(console.error);
