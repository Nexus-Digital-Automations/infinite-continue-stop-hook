const fs = require('fs');

console.log('Fixing _error references in taskmanager-api.js...');

const filePath =
  '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';

try {
  const content = fs.readFileSync(filePath, 'utf8');

  // Replace all instances of _error with error
  const fixedContent = content.replace(/\b_error\b/g, 'error');

  fs.writeFileSync(filePath, fixedContent);
  console.log('✅ Fixed all _error references in taskmanager-api.js');

  // Count how many replacements were made
  const originalCount = (content.match(/\b_error\b/g) || []).length;
  console.log(
    `📊 Replaced ${originalCount} instances of '_error' with 'error'`,
  );
} catch (error) {
  console.error('❌ Error fixing _error references:', error.message);
  process.exit(1);
}
