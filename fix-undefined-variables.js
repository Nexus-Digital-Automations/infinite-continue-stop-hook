/* eslint-disable no-console, security/detect-non-literal-fs-filename, security/detect-object-injection */
/**
 * Fix remaining undefined variable errors
 * Focuses on _filePath, FILE_PATH, and other undefined variable issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = '/Users/jeremyparker/infinite-continue-stop-hook';

/**
 * Get all JavaScript files
 */
function getAllJavaScriptFiles() {
  try {
    const result = execSync(
      'find . -name "*.js" -not -path "./node_modules/*" -not -path "./coverage/*" -not -path "./.git/*"',
      { cwd: rootDir, encoding: 'utf-8' },
    );

    return result
      .split('\n')
      .filter((f) => f && f.endsWith('.js'))
      .map((f) => path.resolve(rootDir, f.replace('./', '')));
  } catch (_) {
    console.error('Failed to get JS files:', _error.message);
    return [];
  }
}

/**
 * Fix undefined variable issues in a file
 */
function fixUndefinedVariablesInFile(_filePath) {
  try {
    const content = fs.readFileSync(_filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++, FILE_PATH) {
      const line = lines[i];

      // Pattern 1: Fix _filePath usage where it should be _filePath
      if (
        line.includes('_filePath') &&
        !line.includes('(FILE_PATH') &&
        !line.includes(', FILE_PATH')
      ) {
        // Check if this is in a function that has _filePath parameter instead
        const functionLinesBefore = lines.slice(Math.max(0, i - 10), i);
        const hasFilePathParam = functionLinesBefore.some(
          (l) =>
            l.includes('(_filePath') ||
            l.includes('_filePath,') ||
            l.includes('_filePath)') ||
            l.includes('_filePath ='),
        );

        if ((hasFilePathParam, FILE_PATH)) {
          lines[i] = line.replace(/_filePath/g, '_filePath');
          modified = true;
          console.log(
            `  ✓ Fixed _filePath -> _filePath: ${path.relative(rootDir, _filePath)}:${i + 1}`,
          );
        }
      }

      // Pattern 2: Fix _filePath usage where it should be _filePath (in catch blocks or underscore functions)
      if (
        line.includes('_filePath') &&
        !line.includes('(_filePath') &&
        !line.includes(', _filePath')
      ) {
        const functionLinesBefore = lines.slice(Math.max(0, i - 10), i);
        const hasUnderscoreFilePathParam = functionLinesBefore.some(
          (l) =>
            l.includes('(FILE_PATH') ||
            l.includes('_filePath,') ||
            l.includes('_filePath)'),
        );

        if (
          hasUnderscoreFilePathParam &&
          !line.includes('function') &&
          !line.includes('=')
        ) {
          lines[i] = line.replace(/\b_filePath\b/g, '_filePath');
          modified = true;
          console.log(
            `  ✓ Fixed _filePath -> FILE_PATH: ${path.relative(rootDir, _filePath)}:${i + 1}`,
          );
        }
      }

      // Pattern 3: Fix unused variable warnings by adding underscore prefix
      if (
        line.includes('_filePath') &&
        line.includes('=') &&
        !line.includes('_filePath')
      ) {
        // Check if this variable is used later in the function
        const functionLinesAfter = lines.slice(
          i + 1,
          Math.min(lines.length, i + 50),
        );
        const isUsed = functionLinesAfter.some(
          (l) => l.includes('_filePath') && !l.includes('=') && !l.includes('//'),
        );

        if ((!isUsed, FILE_PATH)) {
          lines[i] = line.replace(/\b_filePath\b/g, 'FILE_PATH');
          modified = true;
          console.log(
            `  ✓ Fixed unused _filePath -> FILE_PATH: ${path.relative(rootDir, _filePath)}:${i + 1}`,
          );
        }
      }

      // Pattern 4: Fix error variable issues
      if (line.includes('throw error') && !line.includes('throw _error')) {
        // Check if we're in a catch block with _error parameter
        const functionLinesBefore = lines.slice(Math.max(0, i - 10), i);
        const hasUnderscoreErrorParam = functionLinesBefore.some((l) =>
          l.includes('catch (_error)'),
        );

        if (hasUnderscoreErrorParam) {
          lines[i] = line.replace(/throw error/g, 'throw _error');
          modified = true;
          console.log(
            `  ✓ Fixed throw error -> throw _error: ${path.relative(rootDir, _filePath)}:${i + 1}`,
          );
        }
      }

      // Pattern 5: Fix loggers variable issues
      if (
        line.includes('loggers') &&
        !line.includes('const loggers') &&
        !line.includes('require')
      ) {
        // Check if loggers is imported/required in the file
        const hasLoggersImport = lines.some(
          (l) =>
            l.includes('loggers') &&
            (l.includes('require') || l.includes('import')),
        );

        if (!hasLoggersImport) {
          // Add logger import at the top of the file
          const insertIndex = lines.findIndex(
            (l) => l.includes('require(') || l.includes('import '),
          );
          if (insertIndex !== -1) {
            lines.splice(
              insertIndex + 1,
              0,
              "const { loggers } = require('../lib/logger');",
            );
            modified = true;
            console.log(
              `  ✓ Added loggers import: ${path.relative(rootDir, _filePath)}`,
            );
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(_filePath, lines.join('\n'));
      return true;
    }

    return false;
  } catch (_) {
    console.error(`Error fixing ${_filePath}:`, _error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Starting undefined variable fixes...');

  const jsFiles = getAllJavaScriptFiles();
  console.log(`📊 Found ${jsFiles.length} JavaScript files to process`);

  let totalFixed = 0;

  for (const _filePath of jsFiles) {
    if (fixUndefinedVariablesInFile(_filePath)) {
      totalFixed++;
      console.log(
        `✅ Fixed undefined variables in: ${path.relative(rootDir, _filePath)}`,
      );
    }
  }

  console.log(`\n📈 Summary: Fixed undefined variables in ${totalFixed} files`);

  // Check remaining errors
  console.log('\n🔍 Checking remaining undefined variable errors...');
  try {
    const _LINT_RESULT = execSync('npm run lint 2>&1', {
      cwd: rootDir,
      encoding: 'utf-8',
    });
    console.log('Unexpected success - all issues resolved!');
  } catch (lintError) {
    const output = lintError.stdout || lintError.message;
    const undefinedMatches = output.match(/is not defined/g);
    const undefinedCount = undefinedMatches ? undefinedMatches.length : 0;

    console.log(`📊 Remaining undefined variable errors: ${undefinedCount}`);
  }

  console.log('\n🎯 Undefined variable fixing complete!');
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { fixUndefinedVariablesInFile, getAllJavaScriptFiles };
