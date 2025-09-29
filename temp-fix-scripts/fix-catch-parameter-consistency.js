/* eslint-disable no-console */
/**
 * Fix catch parameter consistency issues
 * Ensures catch parameters match their usage in the catch blocks
 */

const fs = require('fs');
const path = require('path');
const { execSync: _execSync } = require('child_process');

const rootDir = process.cwd();

function getAllJavaScriptFiles() {
  try {
    const _result = execSync(
      'find . -name "*.js" -not -path "./node_modules/*" -not -path "./coverage/*" -not -path "./.git/*"',
      { cwd: rootDir, encoding: 'utf-8' },
    );

    return result
      .split('\n')
      .filter((f) => f && f.endsWith('.js'))
      .map((f) => path.resolve(rootDir, f.replace('./', '')));
  } catch (_error) {
    console.error('Failed to get JS files:', error.message);
    return [];
  }
}

function fixCatchParameterConsistency(_filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern 1: catch (_error) but code uses _error
      if (line.includes('catch (_error)')) {
        // Check what error variables are used in the catch block
        const catchBlockLines = [];
        let blockDepth = 0;

        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];

          // Count braces to determine block boundaries
          blockDepth += (nextLine.match(/\{/g) || []).length;
          blockDepth -= (nextLine.match(/\}/g) || []).length;

          catchBlockLines.push(nextLine);

          if (blockDepth <= 0) {
            break;
          }
        }

        const blockContent = catchBlockLines.join('\n');

        // If block uses _error, change parameter to _error
        if (
          blockContent.includes('_error.') ||
          blockContent.includes('_error ')
        ) {
          lines[i] = line.replace('catch (_error)', 'catch (_error)');
          modified = true;
          console.log(
            `  ✓ Fixed catch (_error) -> catch (_error): ${path.relative(rootDir, _filePath)}:${i + 1}`,
          );
        }
        // If block uses error, change parameter to error
        else if (
          blockContent.includes('error.') ||
          blockContent.includes('error ')
        ) {
          lines[i] = line.replace('catch (_error)', 'catch (_error)'); // Already correct
          modified = true;
          console.log(
            `  ✓ Fixed catch (_error) -> catch (_error): ${path.relative(rootDir, _filePath)}:${i + 1}`,
          );
        }
        // If block uses lintError, change parameter to lintError
        else if (
          blockContent.includes('lintError.') ||
          blockContent.includes('lintError ')
        ) {
          lines[i] = line.replace('catch (_error)', 'catch (_error)');
          modified = true;
          console.log(
            `  ✓ Fixed catch (_error) -> catch (_error): ${path.relative(rootDir, _filePath)}:${i + 1}`,
          );
        }
      }

      // Pattern 2: catch (_error) but code uses error
      else if (line.includes('catch (_error)')) {
        const catchBlockLines = [];
        let blockDepth = 0;

        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];

          blockDepth += (nextLine.match(/\{/g) || []).length;
          blockDepth -= (nextLine.match(/\}/g) || []).length;

          catchBlockLines.push(nextLine);

          if (blockDepth <= 0) {
            break;
          }
        }

        const blockContent = catchBlockLines.join('\n');

        // If block uses error but parameter is _error, change parameter to error
        if (
          blockContent.includes('error.') ||
          blockContent.includes('error ')
        ) {
          lines[i] = line.replace('catch (_error)', 'catch (_error)');
          modified = true;
          console.log(
            `  ✓ Fixed catch (_error) -> catch (_error): ${path.relative(rootDir, _filePath)}:${i + 1}`,
          );
        }
        // If block uses lintError but parameter is _error, change parameter to lintError
        else if (
          blockContent.includes('lintError.') ||
          blockContent.includes('lintError ')
        ) {
          lines[i] = line.replace('catch (_error)', 'catch (_error)');
          modified = true;
          console.log(
            `  ✓ Fixed catch (_error) -> catch (_error): ${path.relative(rootDir, _filePath)}:${i + 1}`,
          );
        }
      }

      // Pattern 3: catch (_error) but code uses _error
      else if (line.includes('catch (_error)')) {
        const catchBlockLines = [];
        let blockDepth = 0;

        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];

          blockDepth += (nextLine.match(/\{/g) || []).length;
          blockDepth -= (nextLine.match(/\}/g) || []).length;

          catchBlockLines.push(nextLine);

          if (blockDepth <= 0) {
            break;
          }
        }

        const blockContent = catchBlockLines.join('\n');

        // If block uses _error but parameter is error, change parameter to _error
        if (
          blockContent.includes('_error.') ||
          blockContent.includes('_error ')
        ) {
          lines[i] = line.replace('catch (_error)', 'catch (_error)');
          modified = true;
          console.log(
            `  ✓ Fixed catch (_error) -> catch (_error): ${path.relative(rootDir, _filePath)}:${i + 1}`,
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
    console.error(`Error fixing ${ filePath: _filePath }:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Starting catch parameter consistency fixes...');

  const jsFiles = getAllJavaScriptFiles();
  console.log(`📊 Found ${jsFiles.length} JavaScript files to process`);

  let totalFixed = 0;

  for (const filePath of jsFiles) {
    if (fixCatchParameterConsistency(_filePath)) {
      totalFixed++;
      console.log(
        `✅ Fixed catch consistency in: ${path.relative(rootDir, _filePath)}`,
      );
    }
  }

  console.log(
    `\n📈 Summary: Fixed catch parameter consistency in ${totalFixed} files`,
  );

  // Run autofix after our fixes
  console.log('\n🔧 Running autofix to clean up formatting...');
  try {
    execSync('npm run lint -- --fix', {
      cwd: rootDir,
      stdio: 'inherit',
    });
    console.log('✅ Autofix completed successfully');
  } catch (_error) {
    console.log('⚠️ Autofix completed with some remaining issues');
  }

  console.log('\n🎯 Catch parameter consistency fixing complete!');
}

if (require.main === module) {
  try {
    main();
  } catch (_error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

module.exports = { fixCatchParameterConsistency, getAllJavaScriptFiles };
