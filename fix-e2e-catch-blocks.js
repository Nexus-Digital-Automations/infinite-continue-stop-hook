/* eslint-disable no-console, security/detect-non-literal-fs-filename */
const fs = require('fs');
const PATH = require('path');

/**
 * Fix catch blocks that use 'error' variable but don't declare it in E2E tests
 */

function fixCatchBlocks(_filePath) {
  try {
    const content = fs.readFileSync(_filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for catch blocks without parameter
      if (line.trim().endsWith('} catch {')) {
        // Check subsequent lines for error usage
        let j = i + 1;
        let braceCount = 1;
        let usesError = false;

        while (j < lines.length && braceCount > 0) {
          const nextLine = lines[j];
          braceCount += (nextLine.match(/\{/g) || []).length;
          braceCount -= (nextLine.match(/\}/g) || []).length;

          if (
            nextLine.includes('error.message') ||
            nextLine.includes('error.stack') ||
            nextLine.includes('error.name') ||
            nextLine.includes('error.code') ||
            nextLine.includes('error.stdout') ||
            nextLine.includes('error.stderr') ||
            nextLine.includes('throw error') ||
            nextLine.includes('console.error(error') ||
            nextLine.includes('logger.error(') ||
            (nextLine.includes('loggers.') && nextLine.includes('error'))
          ) {
            usesError = true;
          }

          j++;
        }

        // If error is used, fix the catch declaration
        if (usesError) {
          lines[i] = line.replace('} catch {', '} catch (_error) {');
          modified = true;
          console.log(`Fixed catch block at line ${i + 1} in ${filePath}`);
        }
      }
    }

    if (modified) {
      fs.writeFileSync(_filePath, lines.join('\n'));
      console.log(`Fixed catch blocks in: ${filePath}`);
      return true;
    }

    return false;
  } catch (_error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function findE2ETestFiles(dir) {
  const files = [];

  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = PATH.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        scan(fullPath);
      } else if (stat.isFile() && item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

// Fix E2E test files
const e2eTestDir = '/Users/jeremyparker/infinite-continue-stop-hook/test/e2e';
const e2eFiles = findE2ETestFiles(e2eTestDir);

console.log(`Found ${e2eFiles.length} E2E test files to check...`);

let fixedCount = 0;
for (const file of e2eFiles) {
  if (fixCatchBlocks(file)) {
    fixedCount++;
  }
}

console.log(`Fixed catch blocks in ${fixedCount} E2E test files.`);
