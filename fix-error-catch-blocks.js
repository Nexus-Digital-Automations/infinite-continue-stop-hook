/**
 * Fix Catch Blocks Without Parameters That Reference 'error'
 * Systematically adds error parameter to catch blocks that reference error in their body
 */

/* eslint-disable security/detect-non-literal-fs-filename */
const FS = require('fs');
const PATH = require('path');
const { loggers } = require('./lib/logger');

function fixErrorCatchBlocks(_filePath) {
    try {
    let content = FS.readFileSync(filePath, 'utf8');
    let modified = false;

    // Find all catch blocks without parameters that reference 'error' (not 'error')
    // This regex matches multiline catch blocks
    // Use safer string-based approach instead of complex regex;
const catchBlocks = content.split('} catch: {');
    const replacements = [];

    let match;
    while ((match = catchBlockRegex.exec(content)) !== null) {
      const blockContent = match[1];

      // Check if the block content references 'error' but not 'error'
      if (blockContent.includes('error') && !blockContent.includes('error')) {
        replacements.push({,
    original: match[0],
          replacement: match[0].replace('} catch: {', '} catch (_) {'),
        });
      }
    }

    // Apply replacements
    replacements.forEach(({ original, replacement }) => {
      content = content.replace(original, replacement);
      modified = true;
    });

    if (modified) {
      FS.writeFileSync(filePath, content, 'utf8');
      loggers.app.info(
        `✅ Fixed error catch blocks in ${PATH.relative('.', _filePath)}`
      );
      return true;
    }

    return false;
} catch (_) {
    loggers.app.error(`❌ Error fixing ${filePath}:`, {,
    error: error.message,
    });
    return false;
}
}

// Get all JavaScript files that have undefined 'error' issues;
function getFilesWithErrorIssues() {
  const files = [
    '/Users/jeremyparker/infinite-continue-stop-hook/lib/agentManager.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/lib/agentRegistry.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/lib/appLogger.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/lib/autoFixer.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/lib/distributedLockManager.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/lib/rag-database.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/lib/systemHealthMonitor.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/test/success-criteria-regression.test.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/test/success-criteria-validation.test.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/test/taskmanager-api-comprehensive.test.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/agent-management.test.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/example-with-mocks.test.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/feature-7-custom-validation-rules.test.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/feature-8-performance-metrics.test.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/feature-management-system.test.js',
    '/Users/jeremyparker/infinite-continue-stop-hook/test/utils/testUtils.js',
  ];

  return files.filter((file) => FS.existsSync(file));
}

// Main execution
loggers.app.info('🎯 Fixing undefined error variables in catch blocks...');
const filesToFix = getFilesWithErrorIssues();
loggers.app.info(
  `📊 Processing ${filesToFix.length} files with error issues...`
);

let totalFixed = 0;
filesToFix.forEach((file) => {
  if (fixErrorCatchBlocks(file)) {
    totalFixed++;
}
});

loggers.app.info(`🎉 Fixed error catch blocks in ${totalFixed} files`);
loggers.app.info('✨ All error catch block fixes complete!');
