const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = '/Users/jeremyparker/infinite-continue-stop-hook';

/**
 * Get all JavaScript files for fixing trailing commas
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
  } catch (error) {
    console.error('Failed to get JS files:', error.message);
    return [];
  }
}

/**
 * Fix trailing commas in a file
 */
function fixTrailingCommasInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip empty lines, comments, and strings
      if (
        !trimmedLine ||
        trimmedLine.startsWith('//') ||
        trimmedLine.startsWith('*')
      ) {
        continue;
      }

      // Pattern 1: Object literals - add trailing comma before closing brace
      if (
        /^\s*[\w'"$]+\s*:\s*.*[^,\s]\s*$/.test(line) &&
        i + 1 < lines.length &&
        lines[i + 1].trim().startsWith('}')
      ) {
        lines[i] = line + ',';
        modified = true;
      }

      // Pattern 2: Array elements - add trailing comma before closing bracket
      if (
        /^\s*.*[^,\s]\s*$/.test(line) &&
        !line.includes('//') &&
        i + 1 < lines.length &&
        lines[i + 1].trim().startsWith(']')
      ) {
        lines[i] = line + ',';
        modified = true;
      }

      // Pattern 3: Function parameters - add trailing comma before closing paren (multiline)
      if (
        /^\s*\w+.*[^,\s]\s*$/.test(line) &&
        i + 1 < lines.length &&
        lines[i + 1].trim().startsWith(')')
      ) {
        lines[i] = line + ',';
        modified = true;
      }

      // Pattern 4: Import/export statements - add trailing comma
      if (
        /^\s*import\s*{.*[^,\s]\s*}\s*from/.test(line) ||
        /^\s*export\s*{.*[^,\s]\s*}/.test(line)
      ) {
        lines[i] = line.replace(/([^,\s])\s*}/, '$1,}');
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main function to fix all trailing comma issues
 */
function main() {
  console.log('🔧 Starting comprehensive trailing comma fixes...');

  const jsFiles = getAllJavaScriptFiles();
  console.log(`📊 Found ${jsFiles.length} JavaScript files to process`);

  let totalFixed = 0;

  for (const filePath of jsFiles) {
    if (fixTrailingCommasInFile(filePath)) {
      totalFixed++;
      console.log(
        `✅ Fixed trailing commas in: ${path.relative(rootDir, filePath)}`
      );
    }
  }

  console.log(`\n📈 Summary: Fixed trailing commas in ${totalFixed} files`);

  // Run ESLint autofix to handle any remaining issues
  console.log('\n🔧 Running ESLint autofix to clean up remaining issues...');
  try {
    execSync('npm run lint -- --fix', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ ESLint autofix completed successfully');
  } catch (_error) {
    console.log('⚠️ ESLint autofix completed with remaining issues');
  }

  // Check final comma-dangle status
  try {
    const result = execSync('npm run lint 2>&1 | grep "comma-dangle" | wc -l', {
      cwd: rootDir,
      encoding: 'utf-8',
    });
    const remaining = parseInt(result.trim());
    console.log(
      `\n📊 Final status: ${remaining} comma-dangle errors remaining`
    );
  } catch (_error) {
    console.log('\n📊 Final status: Unable to determine remaining errors');
  }

  console.log('\n🎯 Comprehensive trailing comma fixing complete!');
}

// Execute if run directly
if (require.main === module) {
  main();
}
