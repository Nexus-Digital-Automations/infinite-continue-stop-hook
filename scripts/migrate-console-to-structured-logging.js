/**
 * Console.log to Structured Logging Migration Script
 *
 * Systematically replaces console.log calls with structured logging
 * using the existing Pino-based logger infrastructure.
 */

const fs = require('fs');
const path = require('path');
const { loggers } = require('../lib/logger');

class ConsoleToStructuredMigrator {
  constructor() {
    this.processedFiles = 0;
    this.replacedCalls = 0;
    this.skippedFiles = [];

    // Priority files to migrate (operational tools, not tests)
    this.priorityPatterns = [
      'scripts/**/*.js',
      'lib/**/*.js',
      'development/**/*.js',
      '*.js', // Root level files
    ];

    // Files to skip (tests and development tools that should keep console.log)
    this.skipPatterns = [
      'test/**/*',
      'node_modules/**/*',
      'coverage/**/*',
      '.git/**/*',
      'fix-*.js', // Temporary fix scripts
      'migrate-*.js', // Migration scripts themselves
    ];

    // Console method mappings to structured logger
    this.loggerMappings = {
      'console.log': 'loggers.app.info',
      'console.info': 'loggers.app.info',
      'console.warn': 'loggers.app.warn',
      'console.error': 'loggers.app.error',
      'console.debug': 'loggers.app.debug',
    };
  }

  shouldSkipFile(filePath) {
    return this.skipPatterns.some((pattern) => {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
      );
      return regex.test(filePath);
    });
  }

  shouldProcessFile(filePath) {
    if (this.shouldSkipFile(filePath)) {
      return false;
    }

    return this.priorityPatterns.some((pattern) => {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
      );
      return regex.test(filePath);
    });
  }

  migrateFileContent(content, filePath) {
    let modified = false;
    let newContent = content;

    // Check if file already has logger import
    const hasLoggerImport = /require\(['"]\.\.?\/.*logger['"]/.test(content);

    // If no logger import, add it at the top after other requires
    if (
      !hasLoggerImport &&
      /console\.(log|info|warn|error|debug)/.test(content)
    ) {
      const requireStatements =
        content.match(/^const .* = require\(.*\);?$/gm) || [];
      if (requireStatements.length > 0) {
        const lastRequire = requireStatements[requireStatements.length - 1];
        const loggerImport = this.getLoggerImportForFile(filePath);
        newContent = newContent.replace(
          lastRequire,
          lastRequire + '\n' + loggerImport
        );
        modified = true;
      }
    }

    // Replace console calls with structured logging
    Object.entries(this.loggerMappings).forEach(
      ([consoleMethod, loggerMethod]) => {
        const consoleRegex = new RegExp(
          `\\b${consoleMethod.replace('.', '\\.')}\\(`,
          'g'
        );
        if (consoleRegex.test(newContent)) {
          newContent = newContent.replace(consoleRegex, `${loggerMethod}(`);
          modified = true;
          this.replacedCalls++;
        }
      }
    );

    return { content: newContent, modified };
  }

  getLoggerImportForFile(filePath) {
    const relativePath = path.relative(
      path.dirname(filePath),
      path.join(__dirname, '../lib/logger')
    );
    const normalizedPath = relativePath.replace(/\\/g, '/');
    return `const { loggers } = require('${normalizedPath}');`;
  }

  async processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: newContent, modified } = this.migrateFileContent(
        content,
        filePath
      );

      if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        loggers.app.info('Migrated console calls to structured logging', {
          filePath: path.relative(process.cwd(), filePath),
          replacedCalls: this.replacedCalls,
        });
        this.processedFiles++;
      }
    } catch {
      loggers.app.error('Failed to process file', {
        filePath,
        error: error.message,
      });
      this.skippedFiles.push({ filePath, reason: error.message });
    }
  }

  async findJavaScriptFiles(dir = process.cwd()) {
    const files = [];

    function scan(directory) {
      const items = fs.readdirSync(directory);

      for (const item of items) {
        const itemPath = path.join(directory, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory() && !item.startsWith('.')) {
          scan(itemPath);
        } else if (stat.isFile() && item.endsWith('.js')) {
          files.push(itemPath);
        }
      }
    }

    scan(dir);
    return files;
  }

  async migrate() {
    loggers.app.info('Starting console.log to structured logging migration');

    const allFiles = await this.findJavaScriptFiles();
    const filesToProcess = allFiles.filter((file) =>
      this.shouldProcessFile(file)
    );

    loggers.app.info('Migration scope determined', {
      totalFiles: allFiles.length,
      filesToProcess: filesToProcess.length,
      skippedFiles: allFiles.length - filesToProcess.length,
    });

    for (const file of filesToProcess) {
      await this.processFile(file);
    }

    loggers.app.info('Console.log migration completed', {
      processedFiles: this.processedFiles,
      totalReplacements: this.replacedCalls,
      skippedFiles: this.skippedFiles.length,
      success: this.skippedFiles.length === 0,
    });

    if (this.skippedFiles.length > 0) {
      loggers.app.warn('Some files were skipped due to errors', {
        skippedFiles: this.skippedFiles,
      });
    }

    return {
      processedFiles: this.processedFiles,
      replacedCalls: this.replacedCalls,
      skippedFiles: this.skippedFiles.length,
    };
  }
}

// Execute migration if run directly
if (require.main === module) {
  const migrator = new ConsoleToStructuredMigrator();
  migrator
    .migrate()
    .then((result) => {
      if (result.skippedFiles > 0) {
        throw new Error(
          `Migration completed with ${result.skippedFiles} skipped files`
        );
      }
    })
    .catch((error) => {
      loggers.app.error('Migration failed', { error: error.message });
      throw new Error(`Migration failed: ${error.message}`);
    });
}

module.exports = ConsoleToStructuredMigrator;
