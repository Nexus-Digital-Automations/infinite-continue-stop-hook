/* eslint-disable no-console */
/**
 * Final comprehensive fix for all no-undef errors in audit test file
 */

const fs = require('fs');

function finalAuditFix() {
  const filePath =
    '/Users/jeremyparker/infinite-continue-stop-hook/test/audit-system-validation.test.js';

  try {
    let content = fs.readFileSync(filePath, 'utf-8');

    console.log('Applying final comprehensive audit test fixes...');

    // Fix error.message in child process error handler
    content = content.replace(
      /reject\(new Error\(`Command execution failed: \$\{error\.message\}`\)\);/g,
      'reject(new Error(`Command execution failed: ${error.message}`));'
    );

    // Replace ALL instances of result (uppercase) with result (lowercase)
    content = content.replace(/\bRESULT\b/g, 'result');

    // Fix variable references that might still be uppercase
    content = content.replace(/\bresult\.taskId/g, 'result.taskId');
    content = content.replace(/\bresult\.success/g, 'result.success');

    // Ensure proper catch parameter naming
    content = content.replace(
      /} catch \{([^}]+)\$\{error\.message\}/g,
      '} catch (err) {$1${err.message}'
    );

    // Clean up any remaining unused variable assignments
    content = content.replace(/^\s*const result = [^;]+;\s*$/gm, '');

    fs.writeFileSync(filePath, content);
    console.log('Applied final comprehensive audit test fixes successfully');
  } catch (_error) {
    console.error('Error applying final fixes:', _error.message);
    throw _error;
  }
}

// Run the fix
finalAuditFix();
