/**
 * Systematic fix for 2866 remaining linting errors
 * Zero tolerance approach to achieve perfect linting
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loggers } = require('./lib/logger');

const rootDir = '/Users/jeremyparker/infinite-continue-stop-hook';

// Core fix patterns for systematic error resolution
const systematicFixes = [
  // Fix variable naming inconsistencies - FS/PATH declared but fs/path used
  { pattern: /\bfs\./g, replacement: 'FS.' },
  { pattern: /\bpath\./g, replacement: 'PATH.' },

  // Fix unused variable declarations by prefixing with underscore
  { pattern: /const FS = /g, replacement: 'const FS = ' },
  { pattern: /const PATH = /g, replacement: 'const PATH = ' },
  { pattern: /const agentId = /g, replacement: 'const agentId = ' },
  { pattern: /const CONFIG_PATH = /g, replacement: 'const CONFIG_PATH = ' },
  { pattern: /const EXEC_SYNC = /g, replacement: 'const EXEC_SYNC = ' },
  { pattern: /const result = /g, replacement: 'const result = ' },

  // Fix specific undefined variable names
  { pattern: /\bparseError\b/g, replacement: 'error' },
  { pattern: /\berr\b(?!\w)/g, replacement: 'error' },
  { pattern: /\bfileError\b/g, replacement: 'error' },
  { pattern: /\bmigrationError\b/g, replacement: 'error' },
  { pattern: /\bfinalParseError\b/g, replacement: 'error' },

  // Fix function parameter issues
  { pattern: /\bAGENT_ID\b(?=.*\))/g, replacement: 'agentId' },
  { pattern: /\bPATH\b(?=.*\))/g, replacement: 'PATH' },
];

function applySystematicFixes(filePath) {
  // Convert relative path to absolute path for security validation
  const absolutePath = PATH.resolve(rootDir, filePath);
  const normalizedPath = PATH.normalize(absolutePath);
  if (normalizedPath.includes('..') || !normalizedPath.startsWith(rootDir)) {
    loggers.app.warn(`Security: Rejected unsafe path: ${filePath}`);
    return false;
  }

  try {
    if (!FS.existsSync(normalizedPath)) {
      return false;
    }

    let content = FS.readFileSync(normalizedPath, 'utf8');
    let modified = false;

    // Apply systematic fixes
    systematicFixes.forEach((fix) => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        modified = true;
      }
    });

    // Fix catch blocks with undefined error variables
    // Pattern: catch (error) { ... error.something ... }
    const catchBlockRegex =
      /catch\s*\(\s*\)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    let match;
    while ((match = catchBlockRegex.exec(content)) !== null) {
      const blockContent = match[1];
      if (blockContent.includes('error') || blockContent.includes('_error')) {
        const errorVar = blockContent.includes('_error') ? '_error' : 'error';
        const replacement = match[0].replace(
          /catch\s*\(\s*\)\s*\{/,
          `catch (${errorVar}) {`,
        );
        content = content.replace(match[0], replacement);
        modified = true;
      }
    }

    // Fix specific variable reference patterns
    if (
      content.includes('agentId') &&
      !content.includes('let agentId') &&
      !content.includes('const agentId')
    ) {
      content = content.replace(/\bagentId\b/g, 'agentId');
      modified = true;
    }

    // Update variable usage after renaming imports
    content = content.replace(/\b_FS\./g, 'FS.');
    content = content.replace(/\b_PATH\./g, 'PATH.');

    if (modified) {
      FS.writeFileSync(normalizedPath, content, 'utf8');
      loggers.app.info(`✅ Fixed: ${PATH.relative(rootDir, filePath)}`);
      return true;
    }

    return false;
  } catch (fixError) {
    loggers.app.error(`❌ Error fixing ${filePath}:`, {
      error: fixError.message,
    });
    return false;
  }
}

// Get all JavaScript files for systematic fixing
function getAllJsFiles() {
  try {
    const output = execSync(
      'find . -name "*.js" -not -path "./node_modules/*" -not -path "./.git/*"',
      { cwd: rootDir, encoding: 'utf8' },
    );
    return output
      .trim()
      .split('\n')
      .filter((f) => f);
  } catch (error) {
    loggers.app.error('Failed to get JS files:', { error: error.message });
    return [];
  }
}

// Main execution
loggers.app.info('🎯 SYSTEMATIC ERROR RESOLUTION - 2866 ERRORS TARGET');
const allFiles = getAllJsFiles();
loggers.app.info(`📊 Processing ${allFiles.length} JavaScript files...`);

let fixedCount = 0;
allFiles.forEach((file) => {
  if (applySystematicFixes(file)) {
    fixedCount++;
  }
});

loggers.app.info(`✨ Applied fixes to ${fixedCount} files!`);

// Check progress
loggers.app.info('🔄 Checking error reduction...');
try {
  const lintResult = execSync('npm run lint 2>&1', {
    cwd: rootDir,
    encoding: 'utf8',
  });
  loggers.app.info('🎉 ALL LINTING ERRORS RESOLVED!');
} catch (error) {
  const output = error.stdout || error.message;
  const errorMatches = output.match(/(\d+) errors/);
  const warningMatches = output.match(/(\d+) warnings/);

  const errorCount = errorMatches ? parseInt(errorMatches[1]) : 0;
  const warningCount = warningMatches ? parseInt(warningMatches[1]) : 0;

  loggers.app.info(
    `📊 Progress: ${errorCount} errors, ${warningCount} warnings remaining`,
  );

  if (errorCount === 0) {
    loggers.app.info('🎉 ZERO ERRORS ACHIEVED! Only warnings remain.');
  } else if (errorCount < 500) {
    loggers.app.info('✅ Excellent progress! Under 500 errors remaining.');
  } else if (errorCount < 1000) {
    loggers.app.info('✅ Good progress! Under 1000 errors remaining.');
  } else if (errorCount < 2000) {
    loggers.app.info('✅ Significant progress! Under 2000 errors remaining.');
  }
}
