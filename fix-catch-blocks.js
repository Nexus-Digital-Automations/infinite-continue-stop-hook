/**
 * Fix Catch Blocks Without Parameters That Reference _error
 * Systematically adds _error parameter to catch blocks that reference _error in their body
 */

const FS = require('fs');
const PATH = require('path');
const { loggers } = require('./lib/logger');

function filePath(_$2) {

    let content = FS.readFileSync(filePath, 'utf8');
    let modified = false;

    // Find all catch blocks without parameters that reference _error
    // This regex matches multiline catch blocks
    const catchBlockRegex = /} catch \{\s*((?:[^{}]|\{[^{}]*\})*?)\s*\}/gs;
    const replacements = [];

    let match;
    while ((match = catchBlockRegex.exec(content)) !== null) {
      const blockContent = match[1];

      // Check if the block content references _error
      if (blockContent.includes('_error')) {
        replacements.push({
          original: match[0],
          replacement: match[0].replace('} catch {', '} catch (_error) {'),
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
        `✅ Fixed catch blocks in ${PATH.relative('.', filePath)}`
      );
      return true;
    }

    return false;
  } catch (error) {
    loggers.app.error(`❌ Error fixing ${filePath}:`, { error: error.message });
    return false;
  }
}

// Fix the main taskmanager-api.js file
const mainFile =
  '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';
loggers.app.info('🎯 Fixing catch blocks in taskmanager-api.js...');

if (fixCatchBlocks(mainFile)) {
  loggers.app.info('✅ Successfully fixed catch blocks in taskmanager-api.js');
} else {
  loggers.app.info('ℹ️  No catch blocks needed fixing in taskmanager-api.js');
}

// Also check other files that might have similar issues
const filesToCheck = [
  '/Users/jeremyparker/infinite-continue-stop-hook/test/taskmanager-api-comprehensive.test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/success-criteria-regression.test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/comprehensive-linting-fix.js',
];

let totalFixed = 0;
filesToCheck.forEach((file) => {
  if (fixCatchBlocks(file)) {
    totalFixed++;
  }
});

loggers.app.info(`🎉 Fixed catch blocks in ${totalFixed} additional files`);
loggers.app.info('✨ All catch block fixes complete!');
