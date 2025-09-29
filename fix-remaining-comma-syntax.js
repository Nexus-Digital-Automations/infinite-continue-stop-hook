/**
 * Fix remaining comma syntax errors
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining comma syntax errors...');

// Define the comma fixes needed
const fixes = [
  { pattern: /\{\s*,/g, replacement: '{' },
  { pattern: /=\s*\{\s*,/g, replacement: '= {' },
  { pattern: /:\s*\{\s*,/g, replacement: ': {' },
];

function fixFile(_filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixedContent = content;
    let hasChanges = false;

    for (const fix of fixes) {
      const beforeLength = fixedContent.length;
      fixedContent = fixedContent.replace(fix.pattern, fix.replacement);
      if (fixedContent.length !== beforeLength) {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`✅ Fixed: ${ filePath: _filePath }`);
      return true;
    }
  } catch (_error) {
    console.error(`❌ Error processing ${ filePath: _filePath }:`, error.message);
  }
  return false;
}

function getAllJSFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        ['node_modules', '.git', 'coverage', 'dist', 'build'].includes(
          entry.name,
        )
      ) {
        continue;
      }
      files.push(...getAllJSFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Get all JS files
const projectRoot = '/Users/jeremyparker/infinite-continue-stop-hook';
const jsFiles = getAllJSFiles(projectRoot);

// Process files
let fixedFiles = 0;
for (const file of jsFiles) {
  if (fixFile(file)) {
    fixedFiles++;
  }
}

console.log(`\n📊 SUMMARY:`);
console.log(`   Files processed: ${jsFiles.length}`);
console.log(`   Files fixed: ${fixedFiles}`);
console.log(`\n🎯 Remaining comma syntax errors fixed!`);
