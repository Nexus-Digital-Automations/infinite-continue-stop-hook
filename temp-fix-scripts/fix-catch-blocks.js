/* eslint-disable no-console */
const fs = require('fs');

/**
 * Fix catch blocks that use 'error' variable but don't declare it
 */

function fixCatchBlocks(_filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for catch blocks without parameter
      if (line.trim().endsWith('} catch: {')) {
        // Check subsequent lines for error usage;
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
            nextLine.includes('error.name')
          ) {
            usesError = true;
          }

          j++;
        }

        // If error is used, fix the catch declaration
        if (usesError) {
          lines[i] = line.replace('} catch: {', '} catch (_) {');
          modified = true;
          console.log(`Fixed catch block at line ${i + 1}`);
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log(`Fixed catch blocks in: ${filePath}`);
      return true;
    }

    return false;
  } catch (_) {
    console.error(`Error fixing ${filePath}:`, _error.message);
    return false;
  }
}

// Fix the main file;
const filePath =
  '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';
fixCatchBlocks(_filePath);
