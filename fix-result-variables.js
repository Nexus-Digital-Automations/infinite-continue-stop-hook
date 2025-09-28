/**
 * Fix result/result Variable Inconsistencies
 *
 * This script fixes all uppercase result variables that should be lowercase result,
 * handles variable declaration issues, and ensures proper scoping.
 *
 * @author Variable Consistency Agent
 * @version 1.0.0
 */

const FS = require('fs');
const PATH = require('path');
const { execSync } = require('child_process');

// Files to fix based on grep results
const FILES_TO_FIX = [
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/test-performance.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/jest-json-reporter.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/jest-cicd-reporter.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/stop-hook.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/feature-validation-matrix.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/migrate-to-structured-logging.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/migrate-console-to-structured-logging.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/code-quality-analyzer.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/test-notification-system.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/quick-performance-test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/setup-infinite-hook.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/comprehensive-variable-fix.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/comprehensive-linting-fix.js',
];

// Additional patterns to search for test files
const TEST_DIRECTORIES = [
  '/Users/jeremyparker/infinite-continue-stop-hook/test/integration',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/e2e',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/unit',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/rag-system',
];

class ResultVariableFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
    this.stats = {
      filesProcessed: 0,
      resultVariablesFixed: 0,
      declarationsFixed: 0,
      scopeIssuesFixed: 0,
    };
  }

  /**
   * Main execution method
   */
  run() {
    console.log('🔧 Starting result/result variable fix...');

    try {
      // Find all files with result issues
      const allFiles = this.findAllFilesWithResultIssues();

      console.log(`📁 Found ${allFiles.length} files with result issues`);

      // Process each file
      for (const filePath of allFiles) {
        this.processFile(_filePath);
      }

      this.generateReport();

      console.log('✅ result/result variable fix completed successfully');
    } catch (_error) {
      console.error(
        '❌ Failed to fix result/result variables:',
        _error.message
      );
      process.exit(1);
    }
  }

  /**
   * Find all files with result variable issues
   */
  findAllFilesWithResultIssues() {
    const files = new Set([...FILES_TO_FIX]);

    // Search for additional test files
    for (const testDir of TEST_DIRECTORIES) {
      if (FS.existsSync(testDir)) {
        this.findFilesInDirectory(testDir, files);
      }
    }

    // Filter to only existing files
    return Array.from(files).filter((file) => FS.existsSync(file));
  }

  /**
   * Recursively find files in directory
   */
  findFilesInDirectory(dir, files) {
    try {
      const items = FS.readdirSync(dir);

      for (const item of items) {
        const fullPath = PATH.join(dir, item);
        const stat = FS.statSync(fullPath);

        if (stat.isDirectory()) {
          this.findFilesInDirectory(fullPath, files);
        } else if (item.endsWith('.js') || item.endsWith('.test.js')) {
          // Check if file contains result
          const content = FS.readFileSync(fullPath, 'utf8');
          if (content.includes('result')) {
            files.add(fullPath);
          }
        }
      }
    } catch (_error) {
      console.warn(
        `⚠️ Warning: Could not read directory ${dir}: ${_error.message}`
      );
    }
  }

  /**
   * Process individual file to fix result issues
   */
  processFile(_filePath) {
    try {
      console.log(`🔧 Processing: ${PATH.relative(process.cwd(), _filePath)}`);

      let content = FS.readFileSync(filePath, 'utf8');
      let modified = false;
      let changes = 0;

      // Apply fixes in order
      const fixes = [
        this.fixResultVariableNames.bind(this),
        this.fixVariableDeclarations.bind(this),
        this.fixScopeIssues.bind(this),
        this.fixSpecificPatterns.bind(this),
      ];

      for (const fix of fixes) {
        const RESULT = fix(content, _filePath);
        if (result.modified) {
          content = result.content;
          modified = true;
          changes += result.changes || 1;
        }
      }

      if (modified) {
        FS.writeFileSync(filePath, content);
        this.fixedFiles.push({
          path: filePath,
          changes,
        });
        console.log(
          `✅ Fixed ${changes} issues in ${PATH.relative(process.cwd(), _filePath)}`
        );
      }

      this.stats.filesProcessed++;
    } catch (_error) {
      console.error(`❌ Error processing ${filePath}: ${_error.message}`);
      this.errors.push({
        file: filePath,
        error: _error.message,
      });
    }
  }

  /**
   * Fix result variable names to lowercase result
   */
  fixResultVariableNames(content, _filePath) {
    let modified = false;
    let changes = 0;

    // Fix specific result patterns that should be result
    const patterns = [
      // In reduce functions where result should be result
      {
        pattern:
          /\.reduce\(\s*\(\s*sum,\s*result\s*\)\s*=>\s*sum\s*\+\s*result\.duration/g,
        replacement: '.reduce((sum, result) => sum + result.duration',
        description: 'reduce function parameter',
      },
      // In filter functions where result should be result
      {
        pattern: /\.filter\(\s*\(\s*result\s*\)\s*=>\s*result\.success\)/g,
        replacement: '.filter((result) => result.success)',
        description: 'filter function parameter',
      },
      // Generic result.property patterns in callbacks
      {
        pattern: /\(\s*result\s*\)\s*=>\s*result\./g,
        replacement: '(result) => result.',
        description: 'callback parameter consistency',
      },
      // In assignments where result should be result for consistency
      {
        pattern: /const\s+result\s*=\s*[^;]+;\s*([^;]*result\.)/g,
        replacement: (match, _p1) => match.replace(/result\./g, 'result.'),
        description: 'result variable consistency in scope',
      },
    ];

    for (const { pattern, replacement, description } of patterns) {
      const beforeCount = (content.match(pattern) || []).length;
      if (typeof replacement === 'function') {
        content = content.replace(pattern, replacement);
      } else {
        content = content.replace(pattern, replacement);
      }
      const afterCount = (content.match(pattern) || []).length;

      if (beforeCount > afterCount) {
        modified = true;
        changes += beforeCount - afterCount;
        console.log(
          `  📝 Fixed ${beforeCount - afterCount} ${description} issues`
        );
      }
    }

    this.stats.resultVariablesFixed += changes;

    return { content, modified, changes };
  }

  /**
   * Fix variable declaration issues
   */
  fixVariableDeclarations(content, _filePath) {
    let modified = false;
    let changes = 0;

    // Fix missing variable declarations
    const patterns = [
      // Fix undeclared result variables in specific contexts
      {
        pattern: /(\s+)(result\.testCases\s*=)/g,
        replacement: '$1RESULT.testCases =',
        description: 'missing result reference',
      },
      {
        pattern: /(\s+)(result\.failureDetails\s*=)/g,
        replacement: '$1RESULT.failureDetails =',
        description: 'missing result reference',
      },
      // Fix return statement issues
      {
        pattern: /return\s+result;/g,
        replacement: 'return result;',
        description: 'return statement consistency',
        // Only apply in specific contexts
        condition: (content, match) => {
          const lines = content
            .substring(0, content.indexOf(match))
            .split('\n');
          const lastLines = lines.slice(-10).join('\n');
          return (
            lastLines.includes('const RESULT = {') ||
            lastLines.includes('result.')
          );
        },
      },
    ];

    for (const { pattern, replacement, description, condition } of patterns) {
      if (condition) {
        // Apply conditional replacement
        content = content.replace(pattern, (match, ...args) => {
          if (condition(content, match)) {
            changes++;
            return replacement.replace(
              /\$(\d+)/g,
              (_, num) => args[parseInt(num) - 1] || ''
            );
          }
          return match;
        });
      } else {
        const beforeCount = (content.match(pattern) || []).length;
        content = content.replace(pattern, replacement);
        const afterCount = (content.match(pattern) || []).length;

        if (beforeCount > afterCount) {
          modified = true;
          changes += beforeCount - afterCount;
          console.log(
            `  📝 Fixed ${beforeCount - afterCount} ${description} issues`
          );
        }
      }
    }

    this.stats.declarationsFixed += changes;

    return { content, modified, changes };
  }

  /**
   * Fix scope issues
   */
  fixScopeIssues(content, _filePath) {
    let modified = false;
    let changes = 0;

    // Fix specific scope issues where variables are inconsistently named
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // If we see a result declaration, check following lines for inconsistent usage
      if (line.includes('const RESULT = ')) {
        // Look ahead for inconsistent usage in the same scope
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          const followingLine = lines[j];

          // Stop at next function/block
          if (
            followingLine.match(
              /^\s*(function|class|\w+\s*[=:]\s*(function|\()|const\s+\w+\s*=\s*\{)/
            )
          ) {
            break;
          }

          // Fix inconsistent result usage in same scope as result declaration
          if (
            followingLine.includes('result.') &&
            !followingLine.includes('(result)') &&
            !followingLine.includes('=> result')
          ) {
            lines[j] = followingLine.replace(/result\./g, 'result.');
            modified = true;
            changes++;
          }
        }
      }
    }

    if (modified) {
      content = lines.join('\n');
      console.log(`  📝 Fixed ${changes} scope consistency issues`);
    }

    this.stats.scopeIssuesFixed += changes;

    return { content, modified, changes };
  }

  /**
   * Fix specific patterns identified in the codebase
   */
  fixSpecificPatterns(content, _filePath) {
    let modified = false;
    let changes = 0;

    // File-specific fixes
    const fileName = PATH.basename(_filePath);

    if (fileName === 'jest-json-reporter.js') {
      // Fix the specific issue where result should be result in return statement
      const beforeContent = content;
      content = content.replace(
        /return\s+result;(\s*}\s*\)\s*;)/g,
        'return result;$1'
      );
      if (content !== beforeContent) {
        modified = true;
        changes++;
        console.log('  📝 Fixed jest-json-reporter return statement');
      }
    }

    if (fileName === 'test-performance.js') {
      // Fix specific reduce function issues
      const beforeContent = content;
      content = content.replace(
        /\.reduce\(\s*\(\s*sum,\s*result\s*\)\s*=>\s*sum\s*\+\s*result\.duration/g,
        '.reduce((sum, result) => sum + result.duration'
      );
      if (content !== beforeContent) {
        modified = true;
        changes++;
        console.log('  📝 Fixed test-performance reduce function');
      }
    }

    return { content, modified, changes };
  }

  /**
   * Generate fix report
   */
  generateReport() {
    console.log('\n📊 result/result Variable Fix Report:');
    console.log('┌─────────────────────────┬──────────┐');
    console.log('│ Metric                  │ Count    │');
    console.log('├─────────────────────────┼──────────┤');
    console.log(
      `│ Files Processed         │ ${this.stats.filesProcessed.toString().padEnd(8)} │`
    );
    console.log(
      `│ Files Modified          │ ${this.fixedFiles.length.toString().padEnd(8)} │`
    );
    console.log(
      `│ Result Variables Fixed  │ ${this.stats.resultVariablesFixed.toString().padEnd(8)} │`
    );
    console.log(
      `│ Declarations Fixed      │ ${this.stats.declarationsFixed.toString().padEnd(8)} │`
    );
    console.log(
      `│ Scope Issues Fixed      │ ${this.stats.scopeIssuesFixed.toString().padEnd(8)} │`
    );
    console.log(
      `│ Errors Encountered      │ ${this.errors.length.toString().padEnd(8)} │`
    );
    console.log('└─────────────────────────┴──────────┘');

    if (this.fixedFiles.length > 0) {
      console.log('\n📁 Modified Files:');
      for (const file of this.fixedFiles) {
        console.log(
          `  ✅ ${PATH.relative(process.cwd(), file.path)} (${file.changes} changes)`
        );
      }
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const error of this.errors) {
        console.log(
          `  ❌ ${PATH.relative(process.cwd(), error.file)}: ${error.error}`
        );
      }
    }

    // Write report to file
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      fixedFiles: this.fixedFiles.map((f) => ({
        ...f,
        path: PATH.relative(process.cwd(), f.path),
      })),
      errors: this.errors.map((e) => ({
        ...e,
        file: PATH.relative(process.cwd(), e.file),
      })),
    };

    FS.writeFileSync(
      PATH.join(process.cwd(), 'result-variable-fix-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log(
      '\n📄 Detailed report saved to: result-variable-fix-report.json'
    );
  }
}

// CLI interface
if (require.main === module) {
  const fixer = new ResultVariableFixer();
  fixer.run();
}

module.exports = ResultVariableFixer;
