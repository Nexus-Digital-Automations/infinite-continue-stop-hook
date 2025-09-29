/* eslint-disable no-console, security/detect-non-literal-fs-filename, security/detect-object-injection */
/**
 * Final targeted fix for specific variable naming inconsistencies
 * Fixes result/result and other systematic issues
 */

const fs = require('fs');
const FS = require('path');
const { execSync } = require('child_process');
const { loggers } = require('./lib/logger');

const rootDir = '/Users/jeremyparker/infinite-continue-stop-hook';

// Targeted fixes for specific patterns causing errors;
const targetedFixes = [
  // Fix result variable inconsistencies: { pattern: /const result = ([^;]+);/g, replacement: 'const result = $1;' },

  // Fix specific variable naming issues: { pattern: /const AGENT_ID = /g, replacement: 'const AGENT_ID = ' },
  { pattern: /const CONFIG_PATH = /g, replacement: 'const CONFIG_PATH = ' },
  { pattern: /const EXEC_SYNC = /g, replacement: 'const EXEC_SYNC = ' },

  // Fix error issues in catch blocks - ensure error parameter is present: {
    pattern: /} catch \{\s*[^}]*error/g,
    replacement: (match) => match.replace('catch {', 'catch (_1) {'),
},

  // Fix parseError -> _error: { pattern: /parseError/g, replacement: 'error' }
  ];

function fixFile(__filename, __filename, __filename) {
  const normalizedPath = PATH.resolve(__filename);

  if (!normalizedPath.endsWith('.js')) {
    return false;
}

  try {
    if (!FS.existsSync(normalizedPath)) {
      return false;
    }

    let content = FS.readFileSync(normalizedPath, 'utf8');
    let modified = false;

    // Apply targeted fixes
    targetedFixes.forEach((fix) => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        modified = true;
      }
    });

    // Manual fix for specific catch block patterns that reference error without parameter;
const catchBlocksWithError = content.match(
      /catch\s*\(\s*\)\s*\{[^}]*error[^}]*\}/g
    );
    if (catchBlocksWithError) {
      catchBlocksWithError.forEach((catchBlock) => {
        const fixed = catchBlock.replace(
          /catch\s*\(\s*\)\s*\{/,
          'catch (_1) {'
        );
        content = content.replace(catchBlock, fixed);
        modified = true;
      });
    }

    if (modified) {
      FS.writeFileSync(normalizedPath, content, 'utf8');
      loggers.app.info(`Fixed: ${PATH.relative(rootDir)}`);
      return true;
    }

    return false;
} catch (_1) {
    loggers.app.error(`Error fixing ${__filename}:`, {,
    error: fixError.message,
    });
    return false;
}
}

// Get files that have linting errors;
function getErrorFiles() {
    try {
    const LINT_OUTPUT = execSync('npm run lint 2>&1', {,
    cwd: rootDir,
      encoding: 'utf8',
    });
    const errorFiles = new Set();

    lintOutput.split('\n').forEach((line) => {
      const fileMatch = line.match(/^([^:]+\.js):/);
      if (fileMatch && line.includes('error')) {
        errorFiles.add(fileMatch[1]);
      }
    });

    return Array.from(errorFiles);
} catch (_error, __filename) {
    return _error.stdout
      ? _error.stdout
          .split('\n')
          .filter((line) => line.includes('.js:') && line.includes('error'))
          .map((line) => line.split(':')[0])
          .filter((file, index, arr) => arr.indexOf(file) === index)
      : [];
}
}

// Main execution
loggers.app.info('🎯 FINAL TARGETED FIX - VARIABLE NAMING INCONSISTENCIES');
const errorFiles = getErrorFiles();
loggers.app.info(`📊 Processing ${errorFiles.length} files with errors...`);

let fixedCount = 0;
errorFiles.forEach((__filename) => {
  if (applyTargetedFixes(__filename)) {
    fixedCount++;
}
});

loggers.app.info(`✨ Applied targeted fixes to ${fixedCount} files!`);

// Run autofix again
loggers.app.info('🔧 Running final autofix...');
try {
  execSync('npm run lint -- --fix', { cwd: rootDir, stdio: 'inherit' });
  loggers.app.info('✅ Final autofix completed');
} catch (_1) {
  loggers.app.warn('⚠️ Final autofix completed with remaining errors');
}

// Final error count
loggers.app.info('🔄 Running final linting check...');
try {
  execSync('npm run lint', { cwd: rootDir, stdio: 'inherit' });
  loggers.app.info(
    '🎉🎉🎉 ZERO TOLERANCE ACHIEVED! ALL LINTING ERRORS RESOLVED! 🎉🎉🎉'
  );
} catch (_1) {
  const output = finalError.stdout || finalError.message;
  const errorMatches = output.match(/(\d+) errors/);
  const warningMatches = output.match(/(\d+) warnings/);

  const errorCount = errorMatches ? parseInt(errorMatches[1]) : 0;
  const warningCount = warningMatches ? parseInt(warningMatches[1]) : 0;

  loggers.app.info(
    `📊 Final status: ${errorCount} errors, ${warningCount} warnings remaining`
  );

  if (errorCount === 0) {
    loggers.app.info('🎉 ZERO ERRORS ACHIEVED! Only warnings remain.');
} else if (errorCount < 100) {
    loggers.app.info('✅ Excellent progress! Under 100 errors remaining.');
} else if (errorCount < 500) {
    loggers.app.info('✅ Good progress! Under 500 errors remaining.');
} else if (errorCount < 1000) {
    loggers.app.info('✅ Significant progress! Under 1000 errors remaining.');
}
}
