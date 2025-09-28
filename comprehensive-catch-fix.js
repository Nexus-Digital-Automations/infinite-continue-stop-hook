/**
 * Comprehensive catch block parameter and usage fixer
 * Handles all types of catch block inconsistencies
 */

const fs = require('fs');
const PATH = require('path');
const { execSync } = require('child_process');

const rootDir = '/Users/jeremyparker/infinite-continue-stop-hook';

/**
 * Get all JavaScript files for fixing
 */
function getAllJavaScriptFiles() {
  try {
    const RESULT = execSync(
      'find . -name "*.js" -not -path "./node_modules/*" -not -path "./coverage/*" -not -path "./.git/*"',
      { cwd: rootDir, encoding: 'utf-8' }
    );

    return RESULT.split('\n')
      .filter((f) => f && f.endsWith('.js'))
      .map((f) => PATH.resolve(rootDir, f.replace('./', '')));
  } catch (_error) {
    console.error('Failed to get JS files:', _error.message);
    return [];
  }
}

/**
 * Fix all catch block issues in a file
 */
function fixCatchBlocksInFile(_filePath) {
  try {
    const content = fs.readFileSync(_filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Fix Pattern 1: } catch { (missing parameter entirely)
      if (line.trim().endsWith('} catch {')) {
        lines[i] = line.replace('} catch {', '} catch (_error) {');
        modified = true;
        console.log(
          `  ✓ Fixed missing parameter: ${PATH.relative(rootDir, _filePath)}:${i + 1}`
        );
      }

      // Fix Pattern 2: catch (_error) but using error.property
      if (line.includes('catch (_error)')) {
        // Look for usage mismatches in the following lines (within this catch block)
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];

          // Stop if we hit another catch or end of block
          if (nextLine.includes('catch (') || nextLine.match(/^\s*\}\s*$/)) {
            break;
          }

          // Fix error.property to _error.property
          if (
            nextLine.includes('_error.message') &&
            !nextLine.includes('_error.message')
          ) {
            lines[j] = nextLine.replace(
              /\berror\.message\b/g,
              '_error.message'
            );
            modified = true;
            console.log(
              `  ✓ Fixed error.message -> _error.message: ${PATH.relative(rootDir, _filePath)}:${j + 1}`
            );
          }
          if (
            nextLine.includes('_error.stack') &&
            !nextLine.includes('_error.stack')
          ) {
            lines[j] = nextLine.replace(/\berror\.stack\b/g, '_error.stack');
            modified = true;
            console.log(
              `  ✓ Fixed error.stack -> _error.stack: ${PATH.relative(rootDir, _filePath)}:${j + 1}`
            );
          }
          if (
            nextLine.includes('_error.code') &&
            !nextLine.includes('_error.code')
          ) {
            lines[j] = nextLine.replace(/\berror\.code\b/g, '_error.code');
            modified = true;
            console.log(
              `  ✓ Fixed error.code -> _error.code: ${PATH.relative(rootDir, _filePath)}:${j + 1}`
            );
          }
          if (
            nextLine.includes('_error.stdout') &&
            !nextLine.includes('_error.stdout')
          ) {
            lines[j] = nextLine.replace(/\berror\.stdout\b/g, '_error.stdout');
            modified = true;
            console.log(
              `  ✓ Fixed error.stdout -> _error.stdout: ${PATH.relative(rootDir, _filePath)}:${j + 1}`
            );
          }
          if (
            nextLine.includes('_error.stderr') &&
            !nextLine.includes('_error.stderr')
          ) {
            lines[j] = nextLine.replace(/\berror\.stderr\b/g, '_error.stderr');
            modified = true;
            console.log(
              `  ✓ Fixed error.stderr -> _error.stderr: ${PATH.relative(rootDir, _filePath)}:${j + 1}`
            );
          }
          if (
            nextLine.includes('_error.name') &&
            !nextLine.includes('_error.name')
          ) {
            lines[j] = nextLine.replace(/\berror\.name\b/g, '_error.name');
            modified = true;
            console.log(
              `  ✓ Fixed error.name -> _error.name: ${PATH.relative(rootDir, _filePath)}:${j + 1}`
            );
          }

          // Fix standalone error references (but be careful with strings)
          if (
            nextLine.match(/\W+error\W+/) &&
            !nextLine.includes('_error') &&
            !nextLine.includes('"') &&
            !nextLine.includes("'")
          ) {
            lines[j] = nextLine.replace(/(\W)error(\W)/g, '$1_error$2');
            modified = true;
            console.log(
              `  ✓ Fixed error -> _error: ${PATH.relative(rootDir, _filePath)}:${j + 1}`
            );
          }
        }
      }

      // Fix Pattern 3: catch (error) but error is unused - change to _error
      if (line.includes('catch (error)')) {
        // Check if error is actually used in the following lines
        let errorUsed = false;
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];

          // Stop if we hit another catch or end of block
          if (nextLine.includes('catch (') || nextLine.match(/^\s*\}\s*$/)) {
            break;
          }

          // Check for error usage
          if (nextLine.includes('error.') || nextLine.match(/\W+error\W+/)) {
            errorUsed = true;
            break;
          }
        }

        // If error is not used, change parameter to _error
        if (!errorUsed) {
          lines[i] = line.replace('catch (error)', 'catch (_error)');
          modified = true;
          console.log(
            `  ✓ Changed unused error to _error: ${PATH.relative(rootDir, _filePath)}:${i + 1}`
          );
        }
      }

      // Fix Pattern 4: Other parameter mismatches
      if (line.includes('catch (err)')) {
        // Look for error usage instead of err
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];

          // Stop if we hit another catch or end of block
          if (nextLine.includes('catch (') || nextLine.match(/^\s*\}\s*$/)) {
            break;
          }

          // Fix error.property to err.property
          if (
            nextLine.includes('error.message') &&
            !nextLine.includes('err.message')
          ) {
            lines[j] = nextLine.replace(/\berror\.message\b/g, 'err.message');
            modified = true;
            console.log(
              `  ✓ Fixed error.message -> err.message: ${PATH.relative(rootDir, _filePath)}:${j + 1}`
            );
          }
          if (
            nextLine.includes('error.stack') &&
            !nextLine.includes('err.stack')
          ) {
            lines[j] = nextLine.replace(/\berror\.stack\b/g, 'err.stack');
            modified = true;
            console.log(
              `  ✓ Fixed error.stack -> err.stack: ${PATH.relative(rootDir, _filePath)}:${j + 1}`
            );
          }
        }
      }

      if (line.includes('catch (e)') && !line.includes('catch (error)')) {
        // Look for error usage instead of e
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];

          // Stop if we hit another catch or end of block
          if (nextLine.includes('catch (') || nextLine.match(/^\s*\}\s*$/)) {
            break;
          }

          // Fix error.property to e.property
          if (
            nextLine.includes('error.message') &&
            !nextLine.includes('e.message')
          ) {
            lines[j] = nextLine.replace(/\berror\.message\b/g, 'e.message');
            modified = true;
            console.log(
              `  ✓ Fixed error.message -> e.message: ${PATH.relative(rootDir, _filePath)}:${j + 1}`
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
  } catch (_error) {
    console.error(`Error fixing ${_filePath}:`, _error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Starting comprehensive catch block fixes...');

  const jsFiles = getAllJavaScriptFiles();
  console.log(`📊 Found ${jsFiles.length} JavaScript files to process`);

  let totalFixed = 0;

  for (const filePath of jsFiles) {
    if (fixCatchBlocksInFile(filePath)) {
      totalFixed++;
      console.log(
        `✅ Fixed catch blocks in: ${PATH.relative(rootDir, filePath)}`
      );
    }
  }

  console.log(`\n📈 Summary: Fixed catch blocks in ${totalFixed} files`);

  // Run autofix to handle any remaining linting issues
  console.log('\n🔧 Running autofix to clean up any remaining issues...');
  try {
    execSync('npm run autofix', {
      cwd: rootDir,
      stdio: 'inherit',
    });
    console.log('✅ Autofix completed successfully');
  } catch (_error) {
    console.log('⚠️ Autofix completed with some remaining issues');
  }

  // Final linting check
  console.log('\n🔍 Checking final linting status...');
  try {
    execSync('npm run lint', {
      cwd: rootDir,
      stdio: 'inherit',
    });
    console.log('🎉 ALL LINTING ERRORS RESOLVED!');
  } catch (_error) {
    console.log('⚠️ Some linting issues remain - running final diagnostic...');

    try {
      const RESULT = execSync('npm run lint 2>&1', {
        cwd: rootDir,
        encoding: 'utf-8',
      });
      console.log('Unexpected success - all issues resolved!');
    } catch (lintError) {
      const output = lintError.stdout || lintError.message;
      const errorMatches = output.match(/(\d+) errors?/);
      const warningMatches = output.match(/(\d+) warnings?/);

      const errorCount = errorMatches ? parseInt(errorMatches[1]) : 0;
      const warningCount = warningMatches ? parseInt(warningMatches[1]) : 0;

      console.log(
        `📊 Final status: ${errorCount} errors, ${warningCount} warnings remaining`
      );
    }
  }

  console.log('\n🎯 Comprehensive catch block fixing complete!');
}

// Execute if run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { fixCatchBlocksInFile, getAllJavaScriptFiles };
