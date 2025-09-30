
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Systematically fix no-unused-vars errors by prefixing with underscore
 */

console.log('🔧 Starting systematic no-unused-vars fix...\n');

try {
  // Get all no-unused-vars errors with file paths and variable names
  let lintOutput;
  try {
    lintOutput = execSync('npm run lint 2>&1', { encoding: 'utf-8' });
  } catch (error) {
    // Linting returns non-zero exit code when there are errors
    lintOutput = error.stdout || error.stderr || '';
  }

  const errorPattern = /^(.+?):(\d+):(\d+)\s+error\s+'([^']+)' is (?:defined but never used|assigned a value but never used)/gm;
  const errors = [];
  let match;

  while ((match = errorPattern.exec(lintOutput)) !== null) {
    const [, filePath, line, col, varName] = match;
    if (!filePath.includes('node_modules')) {
      errors.push({ filePath, line: parseInt(line), col: parseInt(col), varName });
    }
  }

  console.log(`Found ${errors.length} no-unused-vars errors\n`);

  // Group errors by file
  const errorsByFile = {};
  for (const error of errors) {
    if (!errorsByFile[error.filePath]) {
      errorsByFile[error.filePath] = [];
    }
    errorsByFile[error.filePath].push(error);
  }

  let filesFixed = 0;
  let variablesFixed = 0;

  // Process each file
  for (const [filePath, fileErrors] of Object.entries(errorsByFile)) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      let modified = false;

      // Sort errors by line number (descending) to avoid offset issues
      fileErrors.sort((a, b) => b.line - a.line);

      for (const error of fileErrors) {
        const { varName } = error;

        // Skip if already prefixed with underscore
        if (varName.startsWith('_')) {
          continue;
        }

        // Patterns to fix
        const _patterns = [
          // catch (error) => catch (_error)
          new RegExp(`catch\\s*\\(\\s*${varName}\\s*\\)`, 'g'),
          // function(param) => function(_param)
          new RegExp(`\\bfunction\\s*\\([^)]*\\b${varName}\\b[^)]*\\)`, 'g'),
          // (param) => => (_param) =>
          new RegExp(`\\(([^)]*)\\b${varName}\\b([^)]*)\\)\\s*=>`, 'g'),
          // const varName = => const _varName =
          new RegExp(`\\b(const|let|var)\\s+${varName}\\b`, 'g'),
          // Destructuring: { varName } = => { varName: _varName } = (if not already aliased)
          new RegExp(`\\{([^}]*)\\b${varName}\\b([^}]*)\\}\\s*=`, 'g'),
        ];

        let wasFixed = false;

        // Try catch block pattern first (most common)
        const catchPattern = new RegExp(`catch\\s*\\(\\s*${varName}\\s*\\)`, 'g');
        if (catchPattern.test(content)) {
          content = content.replace(catchPattern, `catch (_${varName})`);
          wasFixed = true;
        }

        // Try function parameter pattern
        const funcPattern = new RegExp(`\\(([^)]*)\\b${varName}\\b([^)]*)\\)\\s*=>`, 'g');
        if (funcPattern.test(content)) {
          content = content.replace(funcPattern, `($1_${varName}$2) =>`);
          wasFixed = true;
        }

        // Try variable declaration pattern
        const varPattern = new RegExp(`\\b(const|let|var)\\s+${varName}\\b`, 'g');
        if (varPattern.test(content)) {
          content = content.replace(varPattern, `$1 _${varName}`);
          wasFixed = true;
        }

        if (wasFixed) {
          modified = true;
          variablesFixed++;
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        filesFixed++;
        console.log(`✅ Fixed ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}: ${error.message}`);
    }
  }

  console.log(`\n✅ Fixed ${variablesFixed} variables in ${filesFixed} files`);

  // Verify the fix
  console.log('\n🔍 Verifying fix...');
  let verifyOutput;
  try {
    verifyOutput = execSync('npm run lint 2>&1', { encoding: 'utf-8' });
  } catch (error) {
    verifyOutput = error.stdout || error.stderr || '';
  }
  const remainingErrors = (verifyOutput.match(/no-unused-vars/g) || []).length;
  console.log(`Remaining no-unused-vars errors: ${remainingErrors}`);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
