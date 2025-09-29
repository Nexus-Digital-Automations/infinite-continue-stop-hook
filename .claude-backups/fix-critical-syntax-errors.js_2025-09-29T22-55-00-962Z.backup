/**
 * Fix critical syntax errors caused by incorrect colon placement
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting critical syntax error fixes...');

// Define the syntax fixes needed
const fixes = [
  // JavaScript keywords with incorrect colons
  { pattern: /\btry:\s*\{/g, replacement: 'try {' },
  { pattern: /\bcatch:\s*\(/g, replacement: 'catch (' },
  { pattern: /\belse:\s*\{/g, replacement: 'else {' },
  { pattern: /\bconst:\s*\{/g, replacement: 'const {' },
  { pattern: /\bconst:\s*([a-zA-Z_$])/g, replacement: 'const $1' },
  { pattern: /\blet:\s*([a-zA-Z_$])/g, replacement: 'let $1' },
  { pattern: /\bvar:\s*([a-zA-Z_$])/g, replacement: 'var $1' },
  { pattern: /\bfunction:\s*([a-zA-Z_$])/g, replacement: 'function $1' },
  {
    pattern: /\bclass\s+([a-zA-Z_$][a-zA-Z0-9_$]*):\s*\{/g,
    replacement: 'class $1 {',
  },
  { pattern: /\breturn:\s*\{/g, replacement: 'return {' },
  { pattern: /\bif:\s*\(/g, replacement: 'if (' },
  { pattern: /\bfor:\s*\(/g, replacement: 'for (' },
  { pattern: /\bwhile:\s*\(/g, replacement: 'while (' },

  // Comma and colon issues in objects
  { pattern: /:\s*\{/g, replacement: ': {' },
  { pattern: /\breturn\s*\{/g, replacement: 'return {' },
  { pattern: /=\s*\{/g, replacement: '= {' },
];

function fixFile(_filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixedContent = content;
    let hasChanges = false;

    for (const fix of fixes) {
      const beforeLength = fixedContent.length;
      fixedContent = fixedContent.replace(fix.pattern, fix.replacement);
      if (
        fixedContent.length !== beforeLength ||
        beforeLength !== content.length
      ) {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
  } catch (_) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
  return false;
}

function getAllJSFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip certain directories
      if (
        ['node_modules', '.git', 'coverage', 'dist', 'build'].includes(
          entry.name
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
console.log('📁 Scanning for JavaScript files...');
const jsFiles = getAllJSFiles(projectRoot);
console.log(`📋 Found ${jsFiles.length} JavaScript files`);

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
console.log(`\n🎯 Critical syntax error fix complete!`);
