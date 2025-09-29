/* eslint-disable no-console */
/**
 * Complete fix for audit test file - restore missing API calls
 */

const FS = require('fs');

async function completeAuditFix() {
  const filePath =
    '/Users/jeremyparker/infinite-continue-stop-hook/test/audit-system-validation.test.js';

  try {
    let content = FS.readFileSync(filePath, 'utf-8');

    console.log('Applying complete audit test fixes...');

    // Fix missing API calls before expect statements
    // Pattern: Find lines with only expect(result.success) without prior API call
    content = content.replace(
      /(\s+)(expect\(result\.success\)\.toBe\(true\);)/g,
      "$1const result = await execAPI('create', [JSON.stringify(featureTaskData)]);\n1$2"
    );

    // Fix the result variables that should be result in JSON parse
    content = content.replace(
      /const result = JSON\.parse\(jsonString\);/g,
      'const result = JSON.parse(jsonString);'
    );

    // Fix the resolve statement
    content = content.replace(/resolve\(result\);/g, 'resolve(result);');

    FS.writeFileSync(filePath, content);
    console.log('Applied complete audit test fixes successfully');
  } catch (_error) {
    console.error('Error applying complete fixes:', _error.message);
    throw _error;
  }
}

// Run the fix
completeAuditFix();
