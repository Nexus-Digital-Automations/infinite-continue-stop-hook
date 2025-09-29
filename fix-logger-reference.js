const fs = require('fs');
const { loggers } = require('../lib/logger');

/**
 * Fix incorrect logger reference in TaskManager API
 */

const FILE_PATH =
  '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';
const content = fs.readFileSync(FILE_PATH, 'utf8');

// Fix the specific logger reference issue
const fixed = content.replace(
  "this.logger.warn('Running in development mode with missing secrets',",
  "loggers.taskManager.warn('Running in development mode with missing secrets',"
);

if (content !== fixed) {
  fs.writeFileSync(FILE_PATH, fixed);
  console.log('Fixed logger reference in TaskManager API');
} else {
  console.log('No logger reference fix needed');
}
