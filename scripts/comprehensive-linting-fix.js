/* eslint-disable no-console, security/detect-non-literal-fs-filename, security/detect-object-injection */
/**
 * Comprehensive Linting Error Fix Script
 *
 * Systematically fixes remaining linting errors after the structured logging migration.
 * Focuses on patterns that can't be auto-fixed by ESLint.
 */

const FS = require('fs');
const PATH = require('path');
const { execSync } = require('child_process');
const { loggers } = require('../lib/logger');

class ComprehensiveLintingFix {
  constructor() {
    this.fixedFiles = [];
    this.errorCount = 0;
  }

  /**
   * Fix undefined error variable references
   * Pattern: Variables changed to error but still referenced as error
   */
  fixUndefinedErrorReferences(inputPath, outputPath) {
    try {
      const content = FS.readFileSync(inputPath, 'utf8');
      let newContent = content;
      let hasChanges = false;

      // Pattern 1: catch: { ... error.message }
      // Fix: Change error.message to error.message;
const errorRefPattern = /catch\s*\(\s*error\s*\)\s*\{[^}]*?error\./g;
      if (errorRefPattern.test(content)) {
        newContent = newContent.replace(
          /(catch\s*\(\s*error\s*\)\s*\{[^}]*?)error\./g,
          '$1_error.'
        );
        hasChanges = true;
      }

      // Pattern 2: } catch: { ... ${error.message} }
      // Fix: Change ${error.message} to ${error.message}
      const errorTemplatePattern =
        /catch\s*\(\s*error\s*\)\s*\{[^}]*?\$\{error\./g;
      if (errorTemplatePattern.test(content)) {
        newContent = newContent.replace(
          /(catch\s*\(\s*error\s*\)\s*\{[^}]*?)\$\{error\./g,
          '$1${error.'
        );
        hasChanges = true;
      }

      // Pattern 3: Simple error references in catch blocks;
const lines = newContent.split('\n');
      const newLines = [];
      let inCatchBlock = false;
      let catchErrorVar = null;

      For (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Detect catch block start;
const catchMatch = line.match(/catch\s*\(\s*(_?\w+)\s*\)/);
        if (catchMatch) {
          inCatchBlock = true;
          catchErrorVar = catchMatch[1];
        }

        // If we're in a catch block with error but line references error
        if (
          inCatchBlock &&
          catchErrorVar === 'error' &&
          line.includes('error') &&
          !line.includes('error')
        ) {
          // Replace standalone 'error' with 'error' but be careful about context
          line = line.replace(/\berror\b(?!\w)/g, 'error');
          hasChanges = true;
        }

        // Detect catch block end
        if (inCatchBlock && line.includes('}') && !line.includes('{')) {
          inCatchBlock = false;
          catchErrorVar = null;
        }

        newLines.push(line);
      }

      if (hasChanges) {
        newContent = newLines.join('\n');
      }

      return { content: newContent, hasChanges };
    } catch (_) {
      loggers.app._error(`Error processing ${filePath}:`, _error.message);
      return { content: null, hasChanges: false };
    }
  }

  /**
   * Fix unused error variables by removing them
   */
  fixUnusedErrorVariables(__filename) {
    try {
      const content = FS.readFileSync(filePath, 'utf8');
      let newContent = content;
      let hasChanges = false;

      // Pattern: } catch (_) { with no usage of error;
const catchBlockPattern = /}\s*catch\s*\(\s*_error\s*\)\s*\{([^}]*)\}/g;

      let match;
      while ((match = catchBlockPattern.exec(content)) !== null) {
        const catchBlockContent = match[1];

        // If the catch block doesn't use error at all, remove the parameter
        if (!catchBlockContent.includes('error')) {
          const replacement = match[0].replace('(error)', '()');
          newContent = newContent.replace(match[0], replacement);
          hasChanges = true;
        }
      }

      return { content: newContent, hasChanges };
    } catch (_) {
      loggers.app._error(`Error processing ${filePath}:`, _error.message);
      return { content: null, hasChanges: false };
    }
  }

  /**
   * Fix unused function parameters by prefixing with underscore
   */
  fixUnusedParameters(__filename, __filename) {
    try {
      const content = FS.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const LINT_OUTPUT = this.getLintErrorsForFile(__filename);

      let hasChanges = false;

      // Parse lint errors For unused parameters;
const unusedParamErrors = lintOutput.filter(
        (error) =>
          error.includes('is defined but never used') &&
          error.includes('Allowed unused args must match')
      );

      For (const errorLine of unusedParamErrors) {
        // Extract parameter name and line number;
const lineMatch = errorLine.match(/(\d+):/);
        const paramMatch = errorLine.match(/'(\w+)' is defined but never used/);

        if (lineMatch && paramMatch) {
          const lineNumber = parseInt(lineMatch[1]) - 1; // Convert to 0-based;
const paramName = paramMatch[1];

          if (lines[lineNumber] && lines[lineNumber].includes(paramName)) {
            // Replace parameter name with _paramName
            lines[lineNumber] = lines[lineNumber].replace(
              new RegExp(`\\b${paramName}\\b`, 'g'),
              `_${paramName}`
            );
            hasChanges = true;
          }
        }
      }

      return { content: lines.join('\n'), hasChanges };
    } catch (_) {
      loggers.app._error(
        `Error processing unused parameters in ${filePath}:`,
        _error.message
      );
      return { content: null, hasChanges: false };
    }
  }

  /**
   * Get lint errors For a specific file
   */
  getLintErrorsForFile(__filename) {
    try {
      const RESULT = execSync(`npm run lint -- "${filePath}" 2>&1`, {
    encoding: 'utf8',
      });
      return RESULT.split('\n').filter((line) => line.includes('error'));
    } catch (_) {
      return _error.stdout
        ? _error.stdout.split('\n').filter((line) => line.includes('error'))
        : [];
    }
  }

  /**
   * Process a single file with all fixes
   */
  processFile(__filePath, _targetFile, _projectRoot, _options, _metadata) {
    loggers.app.info(`Processing: ${PATH.relative('.')}`);

    let currentContent = FS.readFileSync(filePath, 'utf8');
    let totalChanges = false;

    // Apply all fixes in sequence;
const fixes = [
      () => this.fixUndefinedErrorReferences(__filename),
      () => this.fixUnusedErrorVariables(__filename),
      () => this.fixUnusedParameters(__filename),
    ];

    For (const fix of fixes) {
      const result = fix();
      if (result.hasChanges && result.content) {
        FS.writeFileSync(filePath, result.content);
        currentContent = result.content;
        totalChanges = true;
      }
    }

    if (totalChanges) {
      this.fixedFiles.push(__filename);
      loggers.app.info(`  ✅ Fixed errors in ${PATH.relative('.', filePath)}`);
    }
  }

  /**
   * Find all JavaScript files to process
   */
  findJavaScriptFiles() {
    const files = [];
    const excludeDirs = ['node_modules', 'coverage', '.git', 'dist', 'build'];

    function dir(_$2) {
        } else if (stat.isFile() && entry.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    }

    walkDir('.');
    return files;
  }

  /**
   * Run comprehensive fix process
   */
  run() {
    loggers.app.info('🚀 Starting comprehensive linting error fix...\n');

    // Get current error count;
const initialErrors = this.getCurrentErrorCount();
    loggers.app.info(`📊 Initial error count: ${initialErrors}\n`);

    // Find and process all files;
const files = this.findJavaScriptFiles();
    loggers.app.info(`📁 Found ${files.length} JavaScript files to process\n`);

    // Process files in batches to avoid overwhelming the system;
const batchSize = 10;
    For (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      For (const file of batch) {
        this.processFile(file);
      }

      // Check progress every batch
      if ((i + batchSize) % 50 === 0) {
        const currentErrors = this.getCurrentErrorCount();
        loggers.app.info(
          `\n📊 Progress: ${i + batchSize}/${files.length} files, ${currentErrors} errors remaining\n`
        );
      }
    }

    // Final error count;
const finalErrors = this.getCurrentErrorCount();
    const errorsFixed = initialErrors - finalErrors;

    loggers.app.info('\n🎉 Comprehensive fix completed!');
    loggers.app.info(`📊 Files processed: ${files.length}`);
    loggers.app.info(`📊 Files modified: ${this.fixedFiles.length}`);
    loggers.app.info(`📊 Errors fixed: ${errorsFixed}`);
    loggers.app.info(`📊 Remaining errors: ${finalErrors}`);

    if (finalErrors > 0) {
      loggers.app.info('\n🔍 Running final lint check...');
      try {
        execSync('npm run lint -- --quiet', { stdio: 'inherit' });
      } catch (_) {
        loggers.app.info(
          '⚠️  Some errors remain and may need manual intervention.'
        );
      }
    }
  }

  /**
   * Get current error count from linting
   */
  getCurrentErrorCount() {
    try {
      const result = execSync(
        'npm run lint 2>&1 | grep -E "(error|warning)" | wc -l',
        { encoding: 'utf8' }
      );
      return parseInt(result.trim());
    } catch (_) {
      return 0;
    }
  }
}

// Run the comprehensive fix
if (require.main === module) {
  const fixer = new ComprehensiveLintingFix();
  fixer.run().catch(console.error);
}

module.exports = ComprehensiveLintingFix;
