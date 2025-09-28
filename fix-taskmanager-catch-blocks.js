/* eslint-disable no-console */
const fs = require('fs');

/**
 * Fix catch blocks that use 'error' variable but don't declare it in TaskManager API
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
            (nextLine.includes('loggers.') && nextLine.includes('error')) ||
            (nextLine.includes('this.logger.') && nextLine.includes('error'))
          ) {
            usesError = true;
          }

          j++;
        }

        // If error is used, fix the catch declaration
        if (usesError) {
          lines[i] = line.replace('} catch {', '} catch (_error) {');
          modified = true;
          console.log(`Fixed catch block at line ${i + 1}`);
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

// Fix the TaskManager API file
const filePath =
  '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';
console.log(`Checking ${filePath} for catch block issues...`);

if (fixCatchBlocks(_filePath)) {
  console.log('Successfully fixed TaskManager API catch blocks.');
} else {
  console.log('No catch block fixes needed in TaskManager API.');
}
