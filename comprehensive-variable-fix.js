/**
 * Comprehensive Variable Fix Script
 * Fixes all remaining variable naming inconsistencies and undefined variable issues
 */

/* eslint-disable security/detect-non-literal-fs-filename */
const FS = require('fs');
const PATH = require('path');
const { execSync } = require('child_process');
const { loggers } = require('./lib/logger');

const rootDir = '/Users/jeremyparker/infinite-continue-stop-hook';

// Comprehensive fix patterns for all remaining variable issues
const comprehensiveFixes = [
  // Fix result declared but result used - change usage to match declaration
  { pattern: /\bresult\b(?=\s*[.[()])/g, replacement: 'result' },
  { pattern: /\bresult\s*\./g, replacement: 'result.' },
  { pattern: /\bresult\s*\[/g, replacement: 'result[' },
  { pattern: /\bresult\s*\(/g, replacement: 'result(' },
  { pattern: /\bresult\s*;/g, replacement: 'result;' },
  { pattern: /\bresult\s*\)/g, replacement: 'result)' },
  { pattern: /\bresult\s*,/g, replacement: 'result,' },
  { pattern: /\bresult$/gm, replacement: 'result' },

  // Fix agentId used but agentId declared - change usage to match declaration
  { pattern: /\bagentId\b/g, replacement: 'agentId' },

  // Fix specific path variable inconsistencies
  { pattern: /\bpath\b(?=\s*\.)/g, replacement: 'PATH' },

  // Fix agentId should be agentId
  { pattern: /\b_agentId\b/g, replacement: 'agentId' },
];

// Catch block fixes for specific patterns
const catchBlockFixes = [
  // Add error parameter to catch blocks that reference error
  {
    pattern: /catch\s*\(\s*\)\s*\{([^{}]*\b_error\b[^{}]*)\}/g,
    replacement: (match, _blockContent) => {
      return match.replace(/catch\s*\(\s*\)\s*\{/, 'catch (error) {');
    },
  },

  // Add error parameter to catch blocks that reference error
  {
    pattern: /catch\s*\(\s*\)\s*\{([^{}]*\berror\b[^{}]*)\}/g,
    replacement: (match, _blockContent) => {
      return match.replace(/catch\s*\(\s*\)\s*\{/, 'catch (_error) {');
    },
  },
];

function fixFile(_filePath) {
  const normalizedPath = PATH.resolve(_filePath);

  if (!normalizedPath.endsWith('.js')) {
    return false;
  }

  try {
    if (!FS.existsSync(normalizedPath)) {
      return false;
    }

    let content = FS.readFileSync(normalizedPath, 'utf8');
    let modified = false;

    // Apply comprehensive fixes
    comprehensiveFixes.forEach((fix) => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        modified = true;
      }
    });

    // Apply catch block fixes
    catchBlockFixes.forEach((fix) => {
      const originalContent = content;
      if (typeof fix.replacement === 'function') {
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }
      if (content !== originalContent) {
        modified = true;
      }
    });

    // Handle multi-line catch blocks that reference error or error

    const multiLineCatchRegex =
      /catch\s*\(\s*\)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/gs;
    let match;
    const replacements = [];

    while ((match = multiLineCatchRegex.exec(content)) !== null) {
      const blockContent = match[1];
      if (blockContent.includes('error')) {
        replacements.push({
          original: match[0],
          replacement: match[0].replace(
            /catch\s*\(\s*\)\s*\{/,
            'catch (error) {'
          ),
        });
      } else if (blockContent.includes('error')) {
        replacements.push({
          original: match[0],
          replacement: match[0].replace(
            /catch\s*\(\s*\)\s*\{/,
            'catch (_error) {'
          ),
        });
      }
    }

    // Apply replacements
    replacements.forEach(({ original, replacement }) => {
      content = content.replace(original, replacement);
      modified = true;
    });

    if (modified) {
      FS.writeFileSync(normalizedPath, content, 'utf8');
      loggers.app.info(`Fixed: ${PATH.relative(rootDir, _filePath)}`);
      return true;
    }

    return false;
  } catch (_fixError) {
    loggers.app.error(`Error fixing ${filePath}:`, {
      error: _fixError.message,
    });
    return false;
  }
}

// Get all JavaScript files for comprehensive fixing
function getAllJsFiles() {
  try {
    const output = execSync(
      'find . -name "*.js" -not -path "./node_modules/*" -not -path "./.git/*"',
      { cwd: rootDir, encoding: 'utf8' }
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
loggers.app.info('🎯 COMPREHENSIVE VARIABLE FIX - ALL REMAINING ISSUES');
const allFiles = getAllJsFiles();
loggers.app.info(`📊 Processing ${allFiles.length} JavaScript files...`);

let fixedCount = 0;
allFiles.forEach((file) => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

loggers.app.info(`✨ Applied comprehensive fixes to ${fixedCount} files!`);

// Run autofix to handle any newly fixable issues
loggers.app.info('🔧 Running autofix after comprehensive fixes...');
try {
  execSync('npm run lint -- --fix', { cwd: rootDir, stdio: 'inherit' });
  loggers.app.info('✅ Autofix completed successfully');
} catch (_autofixError) {
  loggers.app.warn('⚠️ Autofix completed with some remaining issues');
}

// Check final progress
loggers.app.info('🔄 Checking final error count...');
try {
  const LINT_RESULT = execSync('npm run lint 2>&1', {
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
