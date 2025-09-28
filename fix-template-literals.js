/**
 * Fix malformed template literals with 'operation' keyword
 */

const FS = require('fs');

const file = 'taskmanager-api.js';

try {
  let content = fs.readFileSync(file, 'utf8');

  // Fix template literals with malformed 'operation' patterns
  content = content.replace(/\$\{operation ([^}]+)\}/g, '$1');

  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ Fixed malformed template literals in taskmanager-api.js');
} catch {
  console.error('❌ Error:', error.message);
}
