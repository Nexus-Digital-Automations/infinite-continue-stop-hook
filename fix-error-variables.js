/**
 * Fix Error Variable References Script
 *
 * Specifically targets the 733 'error' is not defined issues
 * by fixing catch blocks that reference undefined error variables.
 */

const FS = require('fs');
const PATH = require('path');
const { execSync } = require('child_process');

class ErrorVariableFixer {
  constructor() {
    this.fixedFiles = [];
    this.errorCount = 0;
  }

  /**
   * Fix catch blocks with missing error parameter
   */
  fixCatchBlocks(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let hasChanges = false;

      // Pattern 1: } catch { ... error.something }
      // Fix: Change to } catch { ... error.something }
      const emptyCatchPattern = /}\s*catch\s*\(\s*\)\s*\{([^}]*error[^}]*)\}/g;
      if (emptyCatchPattern.test(content)) {
        newContent = newContent.replace(
          /}\s*catch\s*\(\s*\)\s*\{/g,
          '} catch {'
        );
        hasChanges = true;
      }

      // Pattern 2: } catch { ... error.something } (no parentheses)
      const noCatchParamPattern = /}\s*catch\s*\{([^}]*error[^}]*)\}/g;
      if (noCatchParamPattern.test(content)) {
        newContent = newContent.replace(/}\s*catch\s*\{/g, '} catch {');
        hasChanges = true;
      }

      // Pattern 3: catch { ... __error.something }
      // Fix: Change error references to _error
      const lines = newContent.split('\n');
      const newLines = [];
      let inCatchBlock = false;
      let catchErrorVar = null;
      let braceCount = 0;

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Detect catch block start
        const catchMatch = line.match(/catch\s*\(([^)]+)\)/);
        if (catchMatch) {
          inCatchBlock = true;
          catchErrorVar = catchMatch[1].trim();
          braceCount = 0;
        }

        // Count braces to track catch block scope
        if (inCatchBlock) {
          braceCount += (line.match(/\{/g) || []).length;
          braceCount -= (line.match(/\}/g) || []).length;
        }

        // If we're in a catch block and error variable doesn't match
        if (inCatchBlock && catchErrorVar && catchErrorVar !== 'error') {
          // Replace 'error' with the actual catch parameter
          if (line.includes('error') && !line.includes(catchErrorVar)) {
            line = line.replace(/\berror\b/g, catchErrorVar);
            hasChanges = true;
          }
        }

        // If in catch block with missing parameter, add error reference
        if (inCatchBlock && !catchErrorVar && line.includes('error')) {
          // Line already has error reference - just need to add catch parameter
          // This is handled by the regex patterns above
        }

        // End of catch block
        if (inCatchBlock && braceCount <= 0 && line.includes('}')) {
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
      console.error(`Error processing ${filePath}:`, err.message);
      return { content: null, hasChanges: false };
    }
  }

  /**
   * Process a single file
   */
  processFile(filePath) {
    console.log(`Processing: ${path.relative('.', filePath)}`);

    const result = this.fixCatchBlocks(filePath);
    if (result.hasChanges && result.content) {
      fs.writeFileSync(filePath, result.content);
      this.fixedFiles.push(filePath);
      console.log(
        `  ✅ Fixed error variables in ${path.relative('.', filePath)}`
      );
    }
  }

  /**
   * Find all JavaScript files with error variable issues
   */
  findFilesWithErrorIssues() {
    try {
      const result = execSync(
        'npm run lint 2>&1 | grep "\'error\' is not defined"',
        {
          encoding: 'utf8',
        }
      );

      const files = new Set();
      const lines = result.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        // Extract file path from ESLint output
        const match = line.match(/^([^:]+):/);
        if (match) {
          files.add(match[1]);
        }
      }

      return Array.from(files);
    } catch {
      console.error('Error finding files with error issues:', error.message);
      return [];
    }
  }

  /**
   * Get current error count
   */
  getCurrentErrorCount() {
    try {
      const result = execSync(
        'npm run lint 2>&1 | grep "\'error\' is not defined" | wc -l',
        { encoding: 'utf8' }
      );
      return parseInt(result.trim());
    } catch {
      return 0;
    }
  }

  /**
   * Run the fix process
   */
  run() {
    console.log('🚀 Starting error variable fix...\n');

    const initialErrors = this.getCurrentErrorCount();
    console.log(`📊 Initial 'error' variable errors: ${initialErrors}\n`);

    const files = this.findFilesWithErrorIssues();
    console.log(`📁 Found ${files.length} files with error variable issues\n`);

    // Process files
    for (const file of files) {
      if (fs.existsSync(file)) {
        this.processFile(file);
      }
    }

    const finalErrors = this.getCurrentErrorCount();
    const errorsFixed = initialErrors - finalErrors;

    console.log('\n🎉 Error variable fix completed!');
    console.log(`📊 Files processed: ${files.length}`);
    console.log(`📊 Files modified: ${this.fixedFiles.length}`);
    console.log(`📊 Error variable issues fixed: ${errorsFixed}`);
    console.log(`📊 Remaining 'error' variable errors: ${finalErrors}`);
  }
}

// Run the fix
if (require.main === module) {
  const fixer = new ErrorVariableFixer();
  fixer.run();
}

module.exports = ErrorVariableFixer;
