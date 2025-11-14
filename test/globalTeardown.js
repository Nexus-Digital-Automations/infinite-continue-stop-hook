/**
 * Jest Global Teardown
 *
 * Cleanup operations that run once after all test suites complete
 *
 * @author Testing Framework Agent
 * @version 1.0.0
 * @since 2025-11-13
 */

const fs = require('fs');
const path = require('path');
const { loggers } = require('../lib/logger');

const logger = loggers.tests || console;

module.exports = () => {
  logger.info('Starting global test teardown...');

  try {
    // Clean up temporary test files and directories
    const tempDirs = [
      path.join(__dirname, 'e2e', 'test-project'),
      path.join(__dirname, 'e2e', 'validation-test-project'),
      path.join(__dirname, 'integration', 'test-environments'),
    ];

    for (const dir of tempDirs) {
      if (fs.existsSync(dir)) {
        logger.info(`Cleaning up temporary directory: ${dir}`);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }

    // Clean up test databases
    const testDbPattern = /test.*\.db$/;
    const testDir = __dirname;

    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir);
      for (const file of files) {
        if (testDbPattern.test(file)) {
          const filePath = path.join(testDir, file);
          logger.info(`Removing test database: ${filePath}`);
          fs.unlinkSync(filePath);
        }
      }
    }

    // Clean up temporary log files
    const logDir = path.join(__dirname, 'logs');
    if (fs.existsSync(logDir)) {
      logger.info(`Cleaning up test logs: ${logDir}`);
      fs.rmSync(logDir, { recursive: true, force: true });
    }

    logger.info('Global test teardown completed successfully');
  } catch (error) {
    logger.error('Error during global teardown:', error.message);
    // Don't throw - teardown errors shouldn't fail the test run
  }
};
