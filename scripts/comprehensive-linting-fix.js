/**
 * Comprehensive Linting Error Fix Script
 *
 * Systematically fixes remaining linting errors after the structured logging migration.
 * Focuses on patterns that can't be auto-fixed by ESLint.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ComprehensiveLintingFix {
  constructor() {
    this.fixedFiles = [];
    this.errorCount = 0;
  }

  /**
   * Fix undefined error variable references
   * Pattern: Variables changed to _error but still referenced as error
   */
  fixUndefinedErrorReferences(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let hasChanges = false;

      // Pattern 1: catch (_error) { ... error.message }
      // Fix: Change error.message to _error.message
      const errorRefPattern = /catch\s*\(\s*_error\s*\)\s*\{[^}]*?error\./g;
      if (errorRefPattern.test(content)) {
        newContent = newContent.replace(
          /(catch\s*\(\s*_error\s*\)\s*\{[^}]*?)error\./g,
          '$1_error.'
        );
        hasChanges = true;
      }

      // Pattern 2: } catch { ... ${error.message} }
      // Fix: Change ${error.message} to ${_error.message}
      const errorTemplatePattern =
        /catch\s*\(\s*_error\s*\)\s*\{[^}]*?\$\{error\./g;
      if (errorTemplatePattern.test(content)) {
        newContent = newContent.replace(
          /(catch\s*\(\s*_error\s*\)\s*\{[^}]*?)\$\{error\./g,
          '$1${_error.'
        );
        hasChanges = true;
      }

      // Pattern 3: Simple error references in catch blocks
      const lines = newContent.split('\n');
      const newLines = [];
      let inCatchBlock = false;
      let catchErrorVar = null;

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Detect catch block start
        const catchMatch = line.match(/catch\s*\(\s*(_?\w+)\s*\)/);
        if (catchMatch) {
          inCatchBlock = true;
          catchErrorVar = catchMatch[1];
        }

        // If we're in a catch block with _error but line references error
        if (
          inCatchBlock &&
          catchErrorVar === '_error' &&
          line.includes('error') &&
          !line.includes('_error')
        ) {
          // Replace standalone 'error' with '_error' but be careful about context
          line = line.replace(/\berror\b(?!\w)/g, '_error');
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
    } catch {
      console.error(`Error processing ${filePath}:`, error.message);
      return { content: null, hasChanges: false };
    }
  }

  /**
   * Fix unused _error variables by removing them
   */
  fixUnusedErrorVariables(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let hasChanges = false;

      // Pattern: } catch { with no usage of _error
      const catchBlockPattern = /}\s*catch\s*\(\s*_error\s*\)\s*\{([^}]*)\}/g;

      let match;
      while ((match = catchBlockPattern.exec(content)) !== null) {
        const catchBlockContent = match[1];

        // If the catch block doesn't use _error at all, remove the parameter
        if (!catchBlockContent.includes('_error')) {
          const replacement = match[0].replace('(_error)', '()');
          newContent = newContent.replace(match[0], replacement);
          hasChanges = true;
        }
      }

      return { content: newContent, hasChanges };
    } catch {
      console.error(`Error processing ${filePath}:`, error.message);
      return { content: null, hasChanges: false };
    }
  }

  /**
   * Fix unused function parameters by prefixing with underscore
   */
  fixUnusedParameters(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const lintOutput = this.getLintErrorsForFile(filePath);

      let hasChanges = false;

      // Parse lint errors for unused parameters
      const unusedParamErrors = lintOutput.filter(
        (error) =>
          error.includes('is defined but never used') &&
          error.includes('Allowed unused args must match')
      );

      for (const errorLine of unusedParamErrors) {
        // Extract parameter name and line number
        const lineMatch = errorLine.match(/(\d+):/);
        const paramMatch = errorLine.match(/'(\w+)' is defined but never used/);

        if (lineMatch && paramMatch) {
          const lineNumber = parseInt(lineMatch[1]) - 1; // Convert to 0-based
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
    } catch {
      console.error(
        `Error processing unused parameters in ${filePath}:`,
        error.message
      );
      return { content: null, hasChanges: false };
    }
  }

  /**
   * Get lint errors for a specific file
   */
  getLintErrorsForFile(filePath) {
    try {
      const RESULT = execSync(`npm run lint -- "${filePath}" 2>&1`, {
        encoding: 'utf8',
      });
      return result.split('\n').filter((line) => line.includes('error'));
    } catch {
      return error.stdout
        ? error.stdout.split('\n').filter((line) => line.includes('error'))
        : [];
    }
  }

  /**
   * Process a single file with all fixes
   */
  processFile(filePath) {
    console.log(`Processing: ${path.relative('.', filePath)}`);

    let currentContent = fs.readFileSync(filePath, 'utf8');
    let totalChanges = false;

    // Apply all fixes in sequence
    const fixes = [
      () => this.fixUndefinedErrorReferences(filePath),
      () => this.fixUnusedErrorVariables(filePath),
      () => this.fixUnusedParameters(filePath),
    ];

    for (const fix of fixes) {
      const RESULT = fix();
      if (result.hasChanges && result.content) {
        fs.writeFileSync(filePath, result.content);
        currentContent = result.content;
        totalChanges = true;
      }
    }

    if (totalChanges) {
      this.fixedFiles.push(filePath);
      console.log(`  ✅ Fixed errors in ${path.relative('.', filePath)}`);
    }
  }

  /**
   * Find all JavaScript files to process
   */
  findJavaScriptFiles() {
    const files = [];
    const excludeDirs = ['node_modules', 'coverage', '.git', 'dist', 'build'];

    function walkDir(dir) {
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!excludeDirs.includes(entry)) {
            walkDir(fullPath);
          }
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
  async run() {
    console.log('🚀 Starting comprehensive linting error fix...\n');

    // Get current error count
    const initialErrors = this.getCurrentErrorCount();
    console.log(`📊 Initial error count: ${initialErrors}\n`);

    // Find and process all files
    const files = this.findJavaScriptFiles();
    console.log(`📁 Found ${files.length} JavaScript files to process\n`);

    // Process files in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      for (const file of batch) {
        this.processFile(file);
      }

      // Check progress every batch
      if ((i + batchSize) % 50 === 0) {
        const currentErrors = this.getCurrentErrorCount();
        console.log(
          `\n📊 Progress: ${i + batchSize}/${files.length} files, ${currentErrors} errors remaining\n`
        );
      }
    }

    // Final error count
    const finalErrors = this.getCurrentErrorCount();
    const errorsFixed = initialErrors - finalErrors;

    console.log('\n🎉 Comprehensive fix completed!');
    console.log(`📊 Files processed: ${files.length}`);
    console.log(`📊 Files modified: ${this.fixedFiles.length}`);
    console.log(`📊 Errors fixed: ${errorsFixed}`);
    console.log(`📊 Remaining errors: ${finalErrors}`);

    if (finalErrors > 0) {
      console.log('\n🔍 Running final lint check...');
      try {
        execSync('npm run lint -- --quiet', { stdio: 'inherit' });
      } catch {
        console.log('⚠️  Some errors remain and may need manual intervention.');
      }
    }
  }

  /**
   * Get current error count from linting
   */
  getCurrentErrorCount() {
    try {
      const RESULT = execSync(
        'npm run lint 2>&1 | grep -E "(error|warning)" | wc -l',
        { encoding: 'utf8' }
      );
      return parseInt(result.trim());
    } catch {
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
