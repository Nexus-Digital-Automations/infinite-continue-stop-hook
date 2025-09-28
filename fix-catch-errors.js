/**
 * Fix Catch Block Error Variables
 *
 * Fixes catch blocks that are missing the error parameter but reference 'error' inside
 */

const FS = require('fs');
const PATH = require('path');
const { execSync } = require('child_process');

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let hasChanges = false;

  // Pattern: } catch { ... error... }
  // Replace with: } catch { ... error... }

  // Find catch blocks without parameters that contain error references
  const catchBlockPattern = /}\s*catch\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;

  let match;
  while ((match = catchBlockPattern.exec(content)) !== null) {
    const catchBody = match[1];

    // If the catch body contains 'error', add the error parameter
    if (catchBody.includes('error')) {
      const replacement = match[0].replace(/}\s*catch\s*\{/, '} catch {');
      newContent = newContent.replace(match[0], replacement);
      hasChanges = true;
    }
  }

  // Also handle single-line catch blocks and more complex patterns
  // Pattern: catch { with error reference on same or next lines
  const lines = newContent.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check if this line has } catch {
    if (line.includes('} catch {')) {
      // Check if current line or next few lines have 'error'
      let hasErrorRef = false;
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].includes('error') && j > i) {
          hasErrorRef = true;
          break;
        }
      }

      if (hasErrorRef) {
        line = line.replace(/}\s*catch\s*\{/, '} catch {');
        hasChanges = true;
      }
    }

    newLines.push(line);
  }

  if (hasChanges) {
    newContent = newLines.join('\n');
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Fixed catch blocks in ${path.relative('.', filePath)}`);
    return true;
  }

  return false;
}

function findJavaScriptFiles() {
  const files = [];

  function walkDir(dir) {
    try {
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (
            !['node_modules', '.git', 'coverage', 'dist', 'build'].includes(
              entry
            )
          ) {
            walkDir(fullPath);
          }
        } else if (stat.isFile() && entry.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  walkDir('.');
  return files;
}

function getCurrentErrorCount() {
  try {
    const result = execSync(
      'npm run lint 2>&1 | grep "\'error\' is not defined" | wc -l',
      {
        encoding: 'utf8',
      }
    );
    return parseInt(result.trim());
  } catch {
    return 0;
  }
}

function main() {
  console.log('🚀 Fixing catch block error variables...\n');

  const initialErrors = getCurrentErrorCount();
  console.log(`📊 Initial 'error' variable errors: ${initialErrors}\n`);

  const files = findJavaScriptFiles();
  console.log(`📁 Processing ${files.length} JavaScript files...\n`);

  let fixedFiles = 0;

  for (const file of files) {
    if (fixFile(file)) {
      fixedFiles++;
    }
  }

  const finalErrors = getCurrentErrorCount();
  const errorsFixed = initialErrors - finalErrors;

  console.log('\n🎉 Catch block fix completed!');
  console.log(`📊 Files modified: ${fixedFiles}`);
  console.log(`📊 Error variable issues fixed: ${errorsFixed}`);
  console.log(`📊 Remaining 'error' variable errors: ${finalErrors}`);
}

if (require.main === module) {
  main();
}
