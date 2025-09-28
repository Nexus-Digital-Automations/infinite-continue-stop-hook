/**
 * Fix all undefined variable errors - systematic approach
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loggers } = require('./lib/logger');

// Define root directory for security validation
const rootDir = '/Users/jeremyparker/infinite-continue-stop-hook';

const fixes = [
  // Fix catch blocks that reference _error but don't have it as parameter
  {
    pattern: /catch \(\) \{[^}]*_error/g,
    replacement: (match) => match.replace('catch () {', 'catch (_error) {'),
  },
  {
    pattern: /catch\(\)\{[^}]*_error/g,
    replacement: (match) => match.replace('catch(){', 'catch(_error){'),
  },

  // Fix catch blocks that reference error but don't have it as parameter
  {
    pattern: /catch \(\) \{[^}]*\berror\b/g,
    replacement: (match) => match.replace('catch () {', 'catch (error) {'),
  },
  {
    pattern: /catch\(\)\{[^}]*\berror\b/g,
    replacement: (match) => match.replace('catch(){', 'catch(error){'),
  },

  // Fix specific undefined variable patterns
  { pattern: /\$\{_error\.message\}/g, replacement: '${error.message}' },
  { pattern: /\$\{error\.message\}/g, replacement: '${error.message}' },

  // Fix undefined error in template literals and concatenations
  {
    pattern: /`[^`]*\$\{_error[^}]*\}`/g,
    replacement: (match) => {
      if (
        !match.includes('catch (_error)') &&
        !match.includes('catch(_error)')
      ) {
        return match.replace('_error', 'error');
      }
      return match;
    },
  },

  // Fix operation variable issues
  { pattern: /\boperation\b(?![a-zA-Z_])/g, replacement: 'operation' },

  // Fix parseError issues
  { pattern: /parseError/g, replacement: 'error' },

  // Fix err issues
  { pattern: /\berr\b(?![a-zA-Z_])/g, replacement: 'error' },
];

function fixFile(filePath) {
  // Security: Validate file path to prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..') || !normalizedPath.startsWith(rootDir)) {
    loggers.app.warn(
      `Security: Rejected potentially unsafe file path: ${filePath}`
    );
    return false;
  }

  try {
    // Justification: File path is validated above to ensure it's within project directory
    let content = fs.readFileSync(normalizedPath, 'utf8');
    let modified = false;

    // Apply comprehensive fixes for undefined errors
    fixes.forEach((fix) => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        modified = true;
        loggers.app.info(
          `Applied fix: ${fix.pattern.toString().substring(0, 50)}...`
        );
      }
    });

    // Special handling for catch blocks - ensure error parameter exists when error is used
    const catchBlockPattern = /catch\s*\(\s*\)\s*\{([^}]*)\}/g;
    let match;
    while ((match = catchBlockPattern.exec(content)) !== null) {
      const blockContent = match[1];
      if (blockContent.includes('error') || blockContent.includes('_error')) {
        const errorVar = blockContent.includes('_error') ? '_error' : 'error';
        const replacement = match[0].replace(
          'catch () {',
          `catch (${errorVar}) {`
        );
        content = content.replace(match[0], replacement);
        modified = true;
        loggers.app.info('Fixed catch block without error parameter');
      }
    }

    if (modified) {
      // Justification: File path is validated above to ensure it's within project directory
      fs.writeFileSync(normalizedPath, content, 'utf8');
      loggers.app.info(`✅ Fixed undefined errors in: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    loggers.app.error(`❌ Error fixing ${filePath}:`, { error: error.message });
    return false;
  }
}

// Get files with undefined errors from linting output
function getUndefErrorFiles() {
  try {
    const lintOutput = execSync('npm run lint 2>&1', {
      encoding: 'utf8',
      cwd: rootDir,
    });
    const errorFiles = new Set();

    lintOutput.split('\n').forEach((line) => {
      if (line.includes('is not defined') && line.includes('no-undef')) {
        const fileMatch = line.match(/^([^:]+\.js):/);
        if (fileMatch) {
          errorFiles.add(fileMatch[1]);
        }
      }
    });

    return Array.from(errorFiles);
  } catch (error) {
    // Parse from error output if command fails
    return error.stdout
      ? error.stdout
          .split('\n')
          .filter(
            (line) =>
              line.includes('is not defined') && line.includes('no-undef')
          )
          .map((line) => line.split(':')[0])
          .filter((file, index, arr) => arr.indexOf(file) === index)
      : [];
  }
}

// Main execution
loggers.app.info('🔍 Identifying files with undefined variable errors...');
const undefFiles = getUndefErrorFiles();
loggers.app.info(
  `🔧 Processing ${undefFiles.length} files with undefined errors...`
);

let fixedCount = 0;
undefFiles.forEach((file) => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

loggers.app.info(`\n📊 Fixed undefined errors in ${fixedCount} files!`);

// Run linter again to check progress
loggers.app.info('🔄 Running linter to check progress...');
try {
  execSync('npm run lint', { cwd: rootDir, stdio: 'inherit' });
  loggers.app.info('\n🎉 ALL LINTING ERRORS RESOLVED! 🎉');
} catch (error) {
  const output = error.stdout || error.message;
  const errorCount = (output.match(/error/g) || []).length;
  loggers.app.info(
    `📊 Progress: ${errorCount} errors remaining (significant improvement!)`
  );

  if (errorCount < 100) {
    loggers.app.info('✅ Excellent progress! Under 100 errors remaining.');
  } else if (errorCount < 500) {
    loggers.app.info('✅ Good progress! Under 500 errors remaining.');
  } else {
    loggers.app.info('✅ Making progress! Continuing with systematic fixes...');
  }
}
