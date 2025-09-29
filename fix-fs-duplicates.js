/* eslint-disable no-console, security/detect-non-literal-fs-filename */
const fs = require('fs');
const PATH = require('path');

/**
 * Emergency fix for duplicate FS variable declarations
 * This script fixes the widespread duplicate const FS declarations
 * that are preventing the testing framework from running
 */

function fixDuplicateFS(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Pattern 1: Fix path + fs.promises duplicates
    let fixed = content.replace(
      /const FS = require\('path'\);\s*\n\s*const FS = require\('fs'\)\.promises;/g,
      "const PATH = require('path');\nconst FS = require('fs').promises;"
    );

    // Pattern 2: Fix path + fs duplicates
    fixed = fixed.replace(
      /const FS = require\('path'\);\s*\n\s*const FS = require\('fs'\);/g,
      "const PATH = require('path');\nconst FS = require('fs');"
    );

    // Pattern 3: Fix sqlite3 + fs.promises duplicates
    fixed = fixed.replace(
      /const FS = require\('sqlite3'\)\.verbose\(\);\s*\n\s*const FS = require\('fs'\)\.promises;/g,
      "const SQLITE = require('sqlite3').verbose();\nconst FS = require('fs').promises;"
    );

    // Pattern 4: Remove local FS redeclarations (keep only first)
    const lines = fixed.split('\n');
    let foundFirst = false;
    const filteredLines = lines.filter((line) => {
      if (line.trim().startsWith("const FS = require('fs').promises;")) {
        if (foundFirst) {
          return false; // Remove subsequent declarations
        }
        foundFirst = true;
      }
      return true;
    });

    fixed = filteredLines.join('\n');

    // Update PATH references for path operations
    fixed = fixed.replace(/FS\.join\(/g, 'PATH.join(');
    fixed = fixed.replace(/FS\.resolve\(/g, 'PATH.resolve(');
    fixed = fixed.replace(/FS\.dirname\(/g, 'PATH.dirname(');
    fixed = fixed.replace(/FS\.basename\(/g, 'PATH.basename(');

    if ((content !== fixed, filePath)) {
      fs.writeFileSync(filePath, fixed);
      console.log(`Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (_error) {
    console.error(`Error fixing ${filePath}:`, _error.message);
    return false;
  }
}

function findJSFiles(dir) {
  const files = [];

  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = PATH.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (
        stat.isDirectory() &&
        !item.startsWith('.') &&
        item !== 'node_modules'
      ) {
        scan(fullPath);
      } else if (stat.isFile() && item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

// Main execution
const projectRoot = '/Users/jeremyparker/infinite-continue-stop-hook';
const jsFiles = findJSFiles(projectRoot);

console.log(`Found ${jsFiles.length} JavaScript files to check...`);

let fixedCount = 0;
for (const file of jsFiles) {
  if (fixDuplicateFS(file)) {
    fixedCount++;
  }
}

console.log(`Fixed duplicate FS declarations in ${fixedCount} files.`);
