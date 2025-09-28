/**
 * Fix remaining OPERATION quotes patterns
 */

const fs = require('fs');

const file = 'taskmanager-api.js';

try {
  let content = fs.readFileSync(file, 'utf8');

  // Fix all OPERATION 'value' patterns
  content = content.replace(/OPERATION '([^']+)'/g, "operation: '$1'");

  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ Fixed all OPERATION quotes patterns in taskmanager-api.js');
} catch {
  console.error('❌ Error:', error.message);
}
