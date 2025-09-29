/**
 * Fix PATH vs path variable naming inconsistencies across the codebase
 * - Variables declared as `const PATH` but code references `path`
 * - Variables declared as `const path` but should be `PATH` based on usage
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
    const result = execSync(
      'find . -name "*.js" -not -path "./node_modules/*" -not -path "./coverage/*" -not -path "./.git/*"',
      { cwd: rootDir, encoding: 'utf-8' },
    );

    return result
      .split('\n')
      .filter((f) => f && f.endsWith('.js'))
      .map((f) => PATH.resolve(rootDir, f.replace('./', '')));
  } catch (_error) {
    console.error('Failed to get JS files:', _error.message);
    return [];
  }
}

/**
 * Fix PATH variable inconsistencies in a file
 */
function fixPathVariableInconsistencies(filePath) {
  try {
    const content = fs.readFileSync(_filePath, 'utf-8');
    let fixed = content;
    let changes = 0;

    // Pattern 1: File has `const PATH = require('path')` but uses lowercase `path.`
    if (fixed.includes("const PATH = require('path')")) {
      const beforePathUsage = fixed;
      // Replace lowercase path method calls with PATH when PATH is declared
      fixed = fixed.replace(
        /\bpath\.(resolve|join|dirname|basename|extname|relative|parse|format|sep)\b/g,
        'PATH.$1',
      );
      if (beforePathUsage !== fixed) {
        changes++;
        console.log(
          `  ✓ Fixed lowercase path.* calls to PATH.* in ${PATH.basename(filePath)}`,
        );
      }
    }

    // Pattern 2: Fix variable name mismatches (declared as PATH but referenced as path in template literals)
    if (fixed.includes("const PATH = require('path')")) {
      const beforeTemplateFix = fixed;
      // Fix path in template literals and error messages
      fixed = fixed.replace(
        /\$\{path\.(relative|resolve|join|dirname|basename)\(/g,
        '${PATH.$1(',
      );
      if (beforeTemplateFix !== fixed) {
        changes++;
        console.log(
          `  ✓ Fixed path references in template literals to PATH in ${PATH.basename(filePath)}`,
        );
      }
    }

    // Pattern 3: Fix error variable mismatches (error vs _error)
    const beforeErrorFix = fixed;
    // Fix cases where catch(_error) is used but error.message is referenced
    fixed = fixed.replace(
      /catch\s*\(\s*_error\s*\)\s*\{([^}]*)\berror\.(message|stack|code|name)\b/g,
      (match, catchBody, prop) => {
        return match.replace(`error.${prop}`, `_error.${prop}`);
      },
    );

    // Fix standalone error references in catch(_error) blocks
    const lines = fixed.split('\n');
    let inCatchError = false;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if we're entering a catch(_error) block
      if (line.includes('catch (_error)')) {
        inCatchError = true;
        braceCount = 0;
      }

      if (inCatchError) {
        // Count braces to track block scope
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;

        // Fix error.property references to _error.property
        if (line.includes('error.') && !line.includes('_error.')) {
          lines[i] = line.replace(
            /\berror\.(message|stack|code|name|stdout|stderr)\b/g,
            '_error.$1',
          );
          changes++;
        }

        // Exit catch block when braces are balanced
        if (braceCount <= 0) {
          inCatchError = false;
        }
      }
    }
    fixed = lines.join('\n');

    // Pattern 4: Fix variable declaration mismatches (_filePath vs filePath)
    const beforeFilePathFix = fixed;
    // When function parameter is _filePath but code uses filePath
    fixed = fixed.replace(
      /function\s+\w+\s*\(\s*_filePath\s*\)[^{]*\{[^}]*\bfilePath\b/g,
      (match) => {
        return match.replace(/\bfilePath\b/g, '_filePath');
      },
    );

    // Fix fs.readFileSync(_filePath, ...) when parameter is _filePath
    fixed = fixed.replace(
      /fs\.readFileSync\(\s*filePath\s*,/g,
      'fs.readFileSync(_filePath,',
    );
    fixed = fixed.replace(
      /fs\.writeFileSync\(\s*filePath\s*,/g,
      'fs.writeFileSync(_filePath,',
    );

    if (beforeFilePathFix !== fixed) {
      changes++;
      console.log(
        `  ✓ Fixed filePath vs _filePath inconsistencies in ${PATH.basename(filePath)}`,
      );
    }

    // Pattern 5: Fix unused variable names that should be prefixed with _
    const beforeUnusedFix = fixed;
    // Variables that are assigned but never used should be prefixed with _
    if (fixed.includes('const PATH = require(') && !fixed.includes('PATH.')) {
      fixed = fixed.replace(
        /const PATH = require\('path'\)/g,
        "const PATH = require('path')",
      );
      changes++;
      console.log(
        `  ✓ Fixed unused PATH variable to PATH in ${PATH.basename(filePath)}`,
      );
    }

    if (changes > 0) {
      fs.writeFileSync(_filePath, fixed);
      console.log(
        `✅ Fixed ${changes} PATH variable inconsistencies in: ${PATH.relative(rootDir, filePath)}`,
      );
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
async function main() {
  console.log('🔧 Starting PATH variable inconsistency fixes...');

  const jsFiles = getAllJavaScriptFiles();
  console.log(`📊 Found ${jsFiles.length} JavaScript files to process`);

  let totalFixed = 0;

  for (const filePath of jsFiles) {
    if (fixPathVariableInconsistencies(filePath)) {
      totalFixed++;
    }
  }

  console.log(
    `\n📈 Summary: Fixed PATH inconsistencies in ${totalFixed} files`,
  );

  // Run linting to see current status
  console.log('\n🔍 Checking linting status...');
  try {
    execSync('npm run lint --silent', {
      cwd: rootDir,
      stdio: 'inherit',
    });
    console.log('🎉 ALL LINTING ERRORS RESOLVED!');
  } catch (_error) {
    console.log('⚠️ Some linting issues remain - running diagnostic...');

    try {
      const RESULT = execSync("npm run lint 2>const result = execSync('npm run lint 2>&11"', {
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
        `📊 Final status: ${errorCount} errors, ${warningCount} warnings remaining`,
      );
    }
  }

  console.log('\n🎯 PATH variable inconsistency fixing complete!');
}

// Execute if run directly
if (require.main === module) {
  main().catch((_error) => {
    console.error('Fatal error:', _error.message);
    process.exit(1);
  });
}

module.exports = { fixPathVariableInconsistencies, getAllJavaScriptFiles };
