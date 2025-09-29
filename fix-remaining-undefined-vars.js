/**
 * Fix remaining specific undefined variable patterns
 * Targets the most common undefined variable issues
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
      { cwd: rootDir, encoding: 'utf-8' }
    );

    return result
      .split('\n')
      .filter((f) => f && f.endsWith('.js'))
      .map((f) => path.resolve(rootDir, f.replace('./', '')));
  } catch (_error) {
    console.error('Failed to get JS files:', _error.message);
    return [];
  }
}

/**
 * Fix specific undefined variable patterns in a file
 */
function fixSpecificUndefinedVarsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern 1: Fix 'error' undefined in catch blocks
      if (
        line.includes('error') &&
        !line.includes('_error') &&
        !line.includes('new Error') &&
        !line.includes('console.error')
      ) {
        // Check if we're in a catch block with _error parameter
        const prevLines = lines.slice(Math.max(0, i - 10), i);
        const hasCatchError = prevLines.some((l) =>
          l.includes('catch (_error)')
        );

        if (
          hasCatchError &&
          (line.includes('_error.') || line.includes('throw _error'))
        ) {
          lines[i] = line
            .replace(/\berror\./g, '_error.')
            .replace(/throw error\b/g, 'throw _error');
          modified = true;
          console.log(
            `  ✓ Fixed error -> _error: ${path.relative(rootDir, filePath)}:${i + 1}`
          );
        }
      }

      // Pattern 2: Fix 'agentId' undefined
      if (
        line.includes('agentId') &&
        !line.includes('(agentId') &&
        !line.includes('= agentId')
      ) {
        const prevLines = lines.slice(Math.max(0, i - 10), i);
        const hasAgentIdParam = prevLines.some(
          (l) =>
            l.includes('(agentId') ||
            l.includes('agentId,') ||
            l.includes('agentId)')
        );

        if (!hasAgentIdParam) {
          // Check for _AGENT_ID parameter instead
          const hasUnderscoreAgentId = prevLines.some(
            (l) =>
              l.includes('(_AGENT_ID') ||
              l.includes('_AGENT_ID,') ||
              l.includes('_AGENT_ID)')
          );

          if (hasUnderscoreAgentId) {
            lines[i] = line.replace(/\bagentId\b/g, '_AGENT_ID');
            modified = true;
            console.log(
              `  ✓ Fixed _AGENT_ID -> _AGENT_ID: ${path.relative(rootDir, filePath)}:${i + 1}`
            );
          }
        }
      }

      // Pattern 3: Fix 'filePath' undefined
      if (
        line.includes('filePath') &&
        !line.includes('(FILE_PATH') &&
        !line.includes('= FILE_PATH')
      ) {
        const prevLines = lines.slice(Math.max(0, i - 10), i);
        const hasFilePathParam = prevLines.some(
          (l) =>
            l.includes('(filePath') ||
            l.includes('filePath,') ||
            l.includes('filePath)')
        );

        if (hasFilePathParam) {
          lines[i] = line.replace(/\bFILE_PATH\b/g, 'filePath');
          modified = true;
          console.log(
            `  ✓ Fixed filePath -> filePath: ${path.relative(rootDir, filePath)}:${i + 1}`
          );
        }
      }

      // Pattern 4: Fix missing 'loggers' import
      if (
        line.includes('loggers.') &&
        !line.includes('const loggers') &&
        !line.includes('require')
      ) {
        // Check if loggers is imported
        const hasLoggersImport = lines.some(
          (l) =>
            l.includes('loggers') &&
            (l.includes('require') || l.includes('import'))
        );

        if (!hasLoggersImport) {
          // Find a good place to insert the import
          let insertIndex = -1;
          for (let j = 0; j < lines.length; j++) {
            if (lines[j].includes('require(') && lines[j].includes('=')) {
              insertIndex = j;
            }
          }

          if (insertIndex !== -1) {
            // Determine the correct relative path to logger
            const relativePath = filePath.includes('/lib/')
              ? './logger'
              : filePath.includes('/test/')
                ? '../lib/logger'
                : filePath.includes('/scripts/')
                  ? '../lib/logger'
                  : './lib/logger';

            lines.splice(
              insertIndex + 1,
              0,
              `const { loggers } = require('${relativePath}');`
            );
            modified = true;
            console.log(
              `  ✓ Added loggers import: ${path.relative(rootDir, filePath)}`
            );
            i++; // Adjust index since we inserted a line
          }
        }
      }

      // Pattern 5: Fix 'category' undefined (common in task management functions)
      if (
        line.includes('category') &&
        !line.includes('(category') &&
        !line.includes('= category')
      ) {
        const prevLines = lines.slice(Math.max(0, i - 10), i);
        const hasTaskParam = prevLines.some(
          (l) =>
            l.includes('(task') ||
            l.includes('task,') ||
            l.includes('task.') ||
            l.includes('(data') ||
            l.includes('data,') ||
            l.includes('data.')
        );

        if (hasTaskParam && !line.includes('getCategoryPriority')) {
          // Likely should be task.task.category or data.task.category
          if (line.includes('task.category.')) {
            lines[i] = line.replace(/\bcategory\./g, 'task.task.category.');
            modified = true;
            console.log(
              `  ✓ Fixed task.category -> task.task.category: ${path.relative(rootDir, filePath)}:${i + 1}`
            );
          } else if (line.match(/\bcategory\b/) && !line.includes('=')) {
            lines[i] = line.replace(/\bcategory\b/g, 'task.category');
            modified = true;
            console.log(
              `  ✓ Fixed task.category -> task.task.category: ${path.relative(rootDir, filePath)}:${i + 1}`
            );
          }
        }
      }

      // Pattern 6: Fix missing 'fs' require
      if (
        (line.includes('fs.') || line.includes('FS.')) &&
        !line.includes('require')
      ) {
        const hasFsImport = lines.some(
          (l) => (l.includes('fs') || l.includes('FS')) && l.includes('require')
        );

        if (!hasFsImport) {
          // Find where to insert fs require
          let insertIndex = -1;
          for (let j = 0; j < Math.min(20, lines.length); j++) {
            if (lines[j].includes('require(')) {
              insertIndex = j;
              break;
            }
          }

          if (insertIndex === -1) {
            insertIndex = 0;
          }

          if (line.includes('FS.')) {
            lines.splice(insertIndex, 0, "const FS = require('fs');");
          } else {
            lines.splice(insertIndex, 0, "const fs = require('fs');");
          }
          modified = true;
          console.log(
            `  ✓ Added fs import: ${path.relative(rootDir, filePath)}`
          );
          i++; // Adjust index
        }
      }

      // Pattern 7: Fix common function name issues
      if (
        line.includes('getArgValue') &&
        !line.includes('function getArgValue')
      ) {
        // This function is likely defined elsewhere or should be inline
        if (line.includes('const') && line.includes('process.argv.find(arg => arg.startsWith("'="))?.split("=")[1]) {
          lines[i] = line.replace(
            /getArgValue\(([^)]+)\)/,
            'process.argv.find(arg => arg.startsWith("$1="))?.split("=")[1]'
          );
          modified = true;
          console.log(
            `  ✓ Fixed getArgValue -> inline: ${path.relative(rootDir, filePath)}:${i + 1}`
          );
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
      return true;
    }

    return false;
  } catch (_error) {
    console.error(`Error fixing ${filePath}:`, _error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Starting specific undefined variable fixes...');

  const jsFiles = getAllJavaScriptFiles();
  console.log(`📊 Found ${jsFiles.length} JavaScript files to process`);

  let totalFixed = 0;

  for (const filePath of jsFiles) {
    if (fixSpecificUndefinedVarsInFile(filePath)) {
      totalFixed++;
      console.log(
        `✅ Fixed specific undefined variables in: ${path.relative(rootDir, filePath)}`
      );
    }
  }

  console.log(
    `\n📈 Summary: Fixed specific undefined variables in ${totalFixed} files`
  );

  // Check remaining errors
  console.log('\n🔍 Checking remaining undefined variable errors...');
  try {
    const lintResult = execSync('npm run lint 2>&1', {
      cwd: rootDir,
      encoding: 'utf-8',
    });
    console.log('Unexpected success - all issues resolved!');
  } catch (lintError) {
    const output = lintError.stdout || lintError.message;
    const undefinedMatches = output.match(/is not defined/g);
    const undefinedCount = undefinedMatches ? undefinedMatches.length : 0;

    console.log(`📊 Remaining undefined variable errors: ${undefinedCount}`);

    // Show top remaining undefined variables
    const errorLines = output
      .split('\n')
      .filter((line) => line.includes('is not defined'));
    const errorTypes = {};
    errorLines.forEach((line) => {
      const match = line.match(/'([^']+)' is not defined/);
      if (match) {
        errorTypes[match[1]] = (errorTypes[match[1]] || 0) + 1;
      }
    });

    console.log('\n📊 Top remaining undefined variables:');
    Object.entries(errorTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([variable, count]) => {
        console.log(`  ${variable}: ${count} occurrences`);
      });
  }

  console.log('\n🎯 Specific undefined variable fixing complete!');
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { fixSpecificUndefinedVarsInFile, getAllJavaScriptFiles };
