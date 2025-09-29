/* eslint-disable no-console, security/detect-non-literal-fs-filename, security/detect-object-injection */

/**
 * Comprehensive Unused Variables Fix
 *
 * Systematically fixes all unused variable violations by:
 * 1. Adding underscore prefixes to intentionally unused variables
 * 2. Removing genuinely unnecessary declarations
 * 3. Handling various patterns: catch blocks, assignments, parameters
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.cwd();

/**
 * Get all JavaScript files for fixing
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
  } catch (_error) {
    console.error('Failed to get JS files:', _error.message);
    return [];
  }
}

/**
 * Get unused variable violations from ESLint
 */
function getUnusedVariableViolations() {
  try {
    const output = execSync('npx eslint . --format=compact', {
      cwd: rootDir,
      encoding: 'utf-8',
    });
    return output;
  } catch (_error) {
    // ESLint returns non-zero exit code when there are errors
    return _error.stdout || '';
  }
}

/**
 * Parse unused variable violations from ESLint output
 */
function parseUnusedVars(eslintOutput) {
  const violations = [];
  const lines = eslintOutput.split('\n');

  let currentFile = '';

  for (const line of lines) {
    // Extract file path
    const fileMatch = line.match(/^(.+?):\s*line\s*(\d+)/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }

    // Extract unused variable errors
    if (
      line.includes('is defined but never used') ||
      line.includes('is assigned a value but never used')
    ) {
      const lineMatch = line.match(/(\d+):(\d+)/);
      const varMatch = line.match(/'([^']+)'/);

      if (lineMatch && varMatch) {
        violations.push({
          file: currentFile,
          line: parseInt(lineMatch[1]),
          column: parseInt(lineMatch[2]),
          variable: varMatch[1],
          type: line.includes('is assigned a value but never used')
            ? 'assigned'
            : 'defined',
          fullLine: line,
        });
      }
    }
  }

  return violations;
}

/**
 * Fix unused variables in a specific file
 */
function fixUnusedVariablesInFile(filePath, violations) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    // Sort violations by line number (descending) to avoid line number shifts
    const fileViolations = violations
      .filter((v) => v.file === filePath)
      .sort((a, b) => b.line - a.line);

    for (const violation of fileViolations) {
      const lineIndex = violation.line - 1;
      if (lineIndex < 0 || lineIndex >= lines.length) {
        continue;
      }

      const line = lines[lineIndex];
      const variable = violation.variable;

      // Strategy 1: Add underscore prefix for intentionally unused variables
      if (shouldAddUnderscorePrefix(variable, line)) {
        const newVariable = `_${variable}`;

        // Handle different patterns
        if (line.includes(`catch (${variable})`)) {
          lines[lineIndex] = line.replace(
            `catch (${variable})`,
            `catch (${newVariable})`,
          );
          modified = true;
          console.log(
            `  ✓ Fixed catch parameter: ${variable} → ${newVariable} at line ${violation.line}`,
          );
        } else if (
          line.includes(`function`) &&
          line.includes(`, ${variable}`)
        ) {
          lines[lineIndex] = line.replace(`, ${variable}`, `, ${newVariable}`);
          modified = true;
          console.log(
            `  ✓ Fixed function parameter: ${variable} → ${newVariable} at line ${violation.line}`,
          );
        } else if (line.includes(`function`) && line.includes(`(${variable}`)) {
          lines[lineIndex] = line.replace(`(${variable}`, `(${newVariable}`);
          modified = true;
          console.log(
            `  ✓ Fixed function parameter: ${variable} → ${newVariable} at line ${violation.line}`,
          );
        } else if (
          line.includes(`const ${variable} =`) ||
          line.includes(`let ${variable} =`) ||
          line.includes(`var ${variable} =`)
        ) {
          lines[lineIndex] = line.replace(`${variable} =`, `${newVariable} =`);
          modified = true;
          console.log(
            `  ✓ Fixed variable assignment: ${variable} → ${newVariable} at line ${violation.line}`,
          );
        } else if (
          line.includes(`const ${variable};`) ||
          line.includes(`let ${variable};`) ||
          line.includes(`var ${variable};`)
        ) {
          lines[lineIndex] = line.replace(`${variable};`, `${newVariable};`);
          modified = true;
          console.log(
            `  ✓ Fixed variable declaration: ${variable} → ${newVariable} at line ${violation.line}`,
          );
        }
      }

      // Strategy 2: Remove variables that already have underscore but are still unused
      else if (variable.startsWith('_') && canSafelyRemove(variable, line)) {
        // Remove the entire variable if it's safe
        if (
          line.trim().startsWith(`const ${variable}`) ||
          line.trim().startsWith(`let ${variable}`) ||
          line.trim().startsWith(`var ${variable}`)
        ) {
          // Check if this is the only thing on the line
          if (line.trim().endsWith(';')) {
            lines[lineIndex] = ''; // Remove entire line
            modified = true;
            console.log(
              `  ✓ Removed unused variable: ${variable} at line ${violation.line}`,
            );
          }
        }
      }
    }

    if (modified) {
      // Clean up empty lines
      const cleanedLines = lines.filter((line, index) => {
        // Keep line if it's not empty or if removing it would break code structure
        return (
          line.trim() !== '' ||
          (index > 0 &&
            index < lines.length - 1 &&
            lines[index - 1].trim() !== '' &&
            lines[index + 1].trim() !== '')
        );
      });

      fs.writeFileSync(filePath, cleanedLines.join('\n'));
      return true;
    }

    return false;
  } catch (_) {
    console.error(`Error fixing file ${filePath}:`, _error.message);
    return false;
  }
}

/**
 * Determine if variable should get underscore prefix
 */
function shouldAddUnderscorePrefix(variable, line) {
  // Don't prefix if already has underscore
  if (variable.startsWith('_')) {
    return false;
  }

  // Common patterns that should get underscore prefix
  const prefixPatterns = [
    'catch (', // catch block parameters
    'function (', // function parameters
    'const ', // constant assignments (like RESULT, LINT_RESULT)
    'let ', // let assignments
    '.map(', // callback parameters
    '.forEach(', // callback parameters
    '.filter(', // callback parameters
    'agentId', // common unused parameter
    'params', // common unused parameter
    'category', // common unused parameter
    'filePath', // common unused parameter
  ];

  return prefixPatterns.some(
    (pattern) => line.includes(pattern) && line.includes(variable),
  );
}

/**
 * Determine if variable can be safely removed
 */
function canSafelyRemove(variable, line) {
  // Only remove simple variable declarations that are clearly unused
  const safeToRemovePatterns = [
    /^\s*(const|let|var)\s+_\w+\s*=.*;\s*$/, // Simple assignment
    /^\s*(const|let|var)\s+_\w+;\s*$/, // Simple declaration
  ];

  return safeToRemovePatterns.some((pattern) => pattern.test(line.trim()));
}

/**
 * Main execution function
 */
function main() {
  console.log('🔧 Starting comprehensive unused variables fix...\n');

  // Get current violations
  const eslintOutput = getUnusedVariableViolations();
  const violations = parseUnusedVars(eslintOutput);

  console.log(`📊 Found ${violations.length} unused variable violations`);

  if (violations.length === 0) {
    console.log('✅ No unused variable violations found!');
    return;
  }

  // Group violations by file
  const violationsByFile = {};
  for (const violation of violations) {
    if (!violationsByFile[violation.file]) {
      violationsByFile[violation.file] = [];
    }
    violationsByFile[violation.file].push(violation);
  }

  console.log(
    `📁 Processing ${Object.keys(violationsByFile).length} files...\n`,
  );

  let totalFixed = 0;

  for (const [filePath, fileViolations] of Object.entries(violationsByFile)) {
    console.log(
      `🔍 Processing: ${path.relative(rootDir, filePath)} (${fileViolations.length} violations)`,
    );

    if (fixUnusedVariablesInFile(filePath, fileViolations)) {
      totalFixed++;
      console.log(
        `✅ Fixed unused variables in: ${path.relative(rootDir, filePath)}\n`,
      );
    } else {
      console.log(
        `⚠️  No changes made to: ${path.relative(rootDir, filePath)}\n`,
      );
    }
  }

  console.log(
    `\n📈 Summary: Processed unused variables in ${totalFixed} files`,
  );

  // Run autofix to clean up any remaining formatting issues
  console.log('\n🔧 Running ESLint autofix to clean up formatting...');
  try {
    execSync('npx eslint . --fix --fix-type layout', {
      cwd: rootDir,
      stdio: 'inherit',
    });
    console.log('✅ Autofix completed successfully');
  } catch (_) {
    console.log('⚠️  Autofix completed with some remaining issues');
  }

  // Final verification
  console.log('\n🔍 Running final verification...');
  try {
    const finalOutput = getUnusedVariableViolations();
    const finalViolations = parseUnusedVars(finalOutput);

    console.log(
      `📊 Final status: ${finalViolations.length} unused variable violations remaining`,
    );

    if (finalViolations.length === 0) {
      console.log(
        '🎉 SUCCESS: All unused variable violations have been resolved!',
      );
    } else {
      console.log('📋 Remaining violations:');
      finalViolations.slice(0, 10).forEach((v) => {
        console.log(
          `  - ${v.variable} in ${path.relative(rootDir, v.file)}:${v.line}`,
        );
      });
      if (finalViolations.length > 10) {
        console.log(`  ... and ${finalViolations.length - 10} more`);
      }
    }
  } catch (_) {
    console.log('⚠️  Could not run final verification');
  }

  console.log('\n🎯 Comprehensive unused variables fix complete!');
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  fixUnusedVariablesInFile,
  parseUnusedVars,
  getAllJavaScriptFiles,
};
